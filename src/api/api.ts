import { filetypeinfo } from 'magic-bytes.js';
import { randomUUID } from 'node:crypto';
import { Logger, delay, lazyLoadPackage } from '../common';
import { snowflakeToTimestamp } from '../structures/extra/functions';
import type { WorkerData } from '../websocket';
import type { WorkerSendApiRequest } from '../websocket/discord/worker';
import { CDNRouter, type ProxyRequestMethod } from './Router';
import { Bucket } from './bucket';
import {
	DefaultUserAgent,
	OverwrittenMimeTypes,
	type ApiHandlerInternalOptions,
	type ApiHandlerOptions,
	type ApiRequestOptions,
	type HttpMethods,
	type RawFile,
	type RequestHeaders,
} from './shared';
import { isBufferLike } from './utils/utils';

let parentPort: import('node:worker_threads').MessagePort;
let workerData: WorkerData;

export class ApiHandler {
	options: ApiHandlerInternalOptions;
	globalBlock = false;
	ratelimits = new Map<string, Bucket>();
	readyQueue: (() => void)[] = [];
	cdn = CDNRouter.createProxy();
	debugger?: Logger;
	workerPromises?: Map<string, { resolve: (value: any) => any; reject: (error: any) => any }>;

	constructor(options: ApiHandlerOptions) {
		this.options = {
			baseUrl: 'api/v10',
			domain: 'https://discord.com',
			type: 'Bot',
			...options,
			userAgent: DefaultUserAgent,
		};
		if (options.debug) {
			this.debugger = new Logger({
				name: '[API]',
			});
		}

		const worker_threads = lazyLoadPackage<typeof import('node:worker_threads')>('node:worker_threads');

		if (options.workerProxy && !worker_threads?.parentPort) throw new Error('Cannot use workerProxy without a parent.');
		if (options.workerProxy) this.workerPromises = new Map();

		if (worker_threads) {
			workerData = worker_threads.workerData;
			if (worker_threads.parentPort) parentPort = worker_threads.parentPort;
		}
	}

	globalUnblock() {
		this.globalBlock = false;
		let cb;
		while ((cb = this.readyQueue.shift())) {
			cb();
		}
	}

	#randomUUID(): string {
		const uuid = randomUUID();
		if (this.workerPromises!.has(uuid)) return this.#randomUUID();
		return uuid;
	}

	async request<T = any>(
		method: HttpMethods,
		url: `/${string}`,
		{ auth = true, ...request }: ApiRequestOptions = {},
	): Promise<T> {
		if (this.options.workerProxy) {
			const nonce = this.#randomUUID();
			parentPort!.postMessage(
				{
					method,
					url,
					type: 'WORKER_API_REQUEST',
					workerId: (workerData as WorkerData).workerId,
					nonce,
					requestOptions: { auth, ...request },
				} satisfies WorkerSendApiRequest,
				request.files
					?.filter(x => !['string', 'boolean', 'number'].includes(typeof x.data))
					.map(x => x.data as Buffer | Uint8Array),
			);

			return new Promise<T>((res, rej) => {
				this.workerPromises!.set(nonce, { reject: rej, resolve: res });
			});
		}
		const route = request.route || this.routefy(url, method);
		let attempts = 0;

		const callback = async (next: () => void, resolve: (data: any) => void, reject: (err: unknown) => void) => {
			const headers = {
				'User-Agent': this.options.userAgent,
			} satisfies RequestHeaders;

			const { data, finalUrl } = this.parseRequest({
				url,
				headers,
				request: { ...request, auth },
			});

			let response;

			try {
				const url = `${this.options.domain}/${this.options.baseUrl}${finalUrl}`;
				this.debugger?.debug(`Sending, Method: ${method} | Url: [${finalUrl}](${route}) | Auth: ${auth}`);
				response = await fetch(url, {
					method,
					headers,
					body: data,
				});
				this.debugger?.debug(`Received response: ${response.statusText}(${response.status})`);
			} catch (err) {
				this.debugger?.debug('Fetch error', err);
				next();
				reject(err);
				return;
			}

			const now = Date.now();
			const headerNow = Date.parse(response.headers.get('date') ?? '');

			this.setRatelimitsBucket(route, response);
			this.setResetBucket(route, response, now, headerNow);

			let result: string | Record<string, any> = await response.text();

			if (response.status >= 300) {
				if (response.status === 429) {
					const result429 = await this.handle429(route, method, url, request, response, result, next, reject, now);
					if (result429 !== false) return resolve(result429);
					return this.clearResetInterval(route);
				}
				if ([502, 503].includes(response.status) && ++attempts < 4) {
					this.clearResetInterval(route);
					return this.handle50X(method, url, request, next);
				}
				this.clearResetInterval(route);
				next();
				if (result.length > 0) {
					if (response.headers.get('content-type') === 'application/json') {
						try {
							result = JSON.parse(result);
						} catch (err) {
							this.debugger?.warn('Error parsing result error (', result, ')', err);
							reject(err);
							return;
						}
					}
				}
				const parsedError = this.parseError(response, result);
				this.debugger?.warn(parsedError);
				reject(parsedError);
				return;
			}

			if (result.length > 0) {
				if (response.headers.get('content-type') === 'application/json') {
					try {
						result = JSON.parse(result);
					} catch (err) {
						this.debugger?.warn('Error parsing result (', result, ')', err);
						next();
						reject(err);
						return;
					}
				}
			}

			next();
			return resolve((result || undefined) as T);
		};

		return new Promise((resolve, reject) => {
			if (this.globalBlock && auth) {
				this.readyQueue.push(() => {
					if (!this.ratelimits.has(route)) {
						this.ratelimits.set(route, new Bucket(1));
					}
					this.ratelimits.get(route)!.push({ next: callback, resolve, reject }, request.unshift);
				});
			} else {
				if (!this.ratelimits.has(route)) {
					this.ratelimits.set(route, new Bucket(1));
				}
				this.ratelimits.get(route)!.push({ next: callback, resolve, reject }, request.unshift);
			}
		});
	}

	parseError(response: Response, result: unknown) {
		let errMessage = '';
		if (typeof result === 'object' && result) {
			if ('message' in result) {
				errMessage += `${result.message}${'code' in result ? ` ${result.code}` : ''}\n`;
			}

			if ('errors' in result && result) {
				errMessage += `${JSON.stringify(result.errors, null, 2)}\n`;
			}
		}
		if (response.status) {
			return new Error(errMessage ?? response.statusText);
		}
		return new Error('Unknown error');
	}

	async handle50X(method: HttpMethods, url: `/${string}`, request: ApiRequestOptions, next: () => void) {
		const wait = Math.floor(Math.random() * 1900 + 100);
		this.debugger?.warn(`Handling a 50X status, retrying in ${wait}ms`);
		next();
		await delay(wait);
		return this.request(method, url, {
			body: request.body,
			auth: request.auth,
			reason: request.reason,
			route: request.route,
			unshift: true,
		});
	}

	async handle429(
		route: string,
		method: HttpMethods,
		url: `/${string}`,
		request: ApiRequestOptions,
		response: Response,
		result: any,
		next: () => void,
		reject: (err: unknown) => void,
		now: number,
	) {
		const content = typeof request === 'object' ? `${JSON.stringify(request)} ` : '';
		let retryAfter;

		try {
			retryAfter = JSON.parse(result).retry_after * 1000;
		} catch (err) {
			this.debugger?.warn(`Unexpected error: ${err}`);
			reject(err);
			return false;
		}

		this.debugger?.info(
			`${
				response.headers.get('x-ratelimit-global') ? 'Global' : 'Unexpected'
			} 429: ${result}\n${content} ${now} ${route} ${response.status}: ${this.ratelimits.get(route)!.remaining}/${
				this.ratelimits.get(route)!.limit
			} left | Reset ${retryAfter} (${this.ratelimits.get(route)!.reset - now}ms left) | Scope ${response.headers.get(
				'x-ratelimit-scope',
			)}`,
		);
		if (retryAfter) {
			await delay(retryAfter);
			next();
			return this.request(method, url, {
				body: request.body,
				auth: request.auth,
				reason: request.reason,
				route: request.route,
				unshift: true,
			});
		}
		next();
		return this.request(method, url, {
			body: request.body,
			auth: request.auth,
			reason: request.reason,
			route: request.route,
			unshift: true,
		});
	}

	clearResetInterval(route: string) {
		clearInterval(this.ratelimits.get(route)!.processingResetAfter as NodeJS.Timeout);
		this.ratelimits.get(route)!.processingResetAfter = undefined;
		this.ratelimits.get(route)!.resetAfter = 0;
	}

	setResetBucket(route: string, resp: Response, now: number, headerNow: number) {
		const retryAfter = Number(resp.headers.get('x-ratelimit-reset-after') || resp.headers.get('retry-after')) * 1000;

		if (retryAfter >= 0) {
			if (resp.headers.get('x-ratelimit-global')) {
				this.globalBlock = true;
				setTimeout(() => this.globalUnblock(), retryAfter || 1);
			} else {
				this.ratelimits.get(route)!.reset = (retryAfter || 1) + now;
			}
		} else if (resp.headers.get('x-ratelimit-reset')) {
			let resetTime = +resp.headers.get('x-ratelimit-reset')! * 1000;
			if (route.endsWith('/reactions/:id') && +resp.headers.get('x-ratelimit-reset')! * 1000 - headerNow === 1000) {
				resetTime = now + 250;
			}
			this.ratelimits.get(route)!.reset = Math.max(resetTime, now);
		} else {
			this.ratelimits.get(route)!.reset = now;
		}
	}

	setRatelimitsBucket(route: string, resp: Response) {
		if (resp.headers.get('x-ratelimit-limit')) {
			this.ratelimits.get(route)!.limit = +resp.headers.get('x-ratelimit-limit')!;
		}

		this.ratelimits.get(route)!.remaining =
			resp.headers.get('x-ratelimit-remaining') === undefined ? 1 : +resp.headers.get('x-ratelimit-remaining')!;

		if (this.options.smartBucket) {
			if (
				resp.headers.get('x-ratelimit-reset-after') &&
				!this.ratelimits.get(route)!.resetAfter &&
				Number(resp.headers.get('x-ratelimit-limit')) === Number(resp.headers.get('x-ratelimit-remaining')) + 1
			) {
				this.ratelimits.get(route)!.resetAfter = +resp.headers.get('x-ratelimit-reset-after')! * 1000;
			}

			if (this.ratelimits.get(route)!.resetAfter && !this.ratelimits.get(route)!.remaining) {
				this.ratelimits.get(route)!.triggerResetAfter();
			}
		}
	}

	parseRequest(options: {
		url: string;
		headers: RequestHeaders;
		request: ApiRequestOptions;
	}) {
		let finalUrl = options.url;
		let data: string | FormData | undefined;
		if (options.request.auth) {
			options.headers.Authorization = `${this.options.type} ${options.request.token || this.options.token}`;
		}
		if (options.request.query) {
			finalUrl += `?${new URLSearchParams(options.request.query)}`;
		}
		if (options.request.files) {
			const formData = new FormData();

			for (const [index, file] of options.request.files.entries()) {
				const fileKey = file.key ?? `files[${index}]`;

				if (isBufferLike(file.data)) {
					let contentType = file.contentType;

					if (!contentType) {
						const [parsedType] = filetypeinfo(file.data);

						if (parsedType) {
							contentType =
								OverwrittenMimeTypes[parsedType.mime as keyof typeof OverwrittenMimeTypes] ??
								parsedType.mime ??
								'application/octet-stream';
						}
					}

					formData.append(fileKey, new Blob([file.data], { type: contentType }), file.name);
				} else {
					formData.append(fileKey, new Blob([`${file.data}`], { type: file.contentType }), file.name);
				}
			}

			if (options.request.body) {
				if (options.request.appendToFormData) {
					for (const [key, value] of Object.entries(options.request.body)) {
						formData.append(key, value);
					}
				} else {
					formData.append('payload_json', JSON.stringify(options.request.body));
				}
			}
			data = formData;
		} else if (options.request.body) {
			options.headers['Content-Type'] = 'application/json';
			data = JSON.stringify(options.request.body);
		}
		if (options.request.reason) {
			options.headers['X-Audit-Log-Reason'] = encodeURIComponent(options.request.reason);
		}
		return { data, finalUrl } as { data: typeof data; finalUrl: `/${string}` };
	}

	routefy(url: string, method: HttpMethods): `/${string}` {
		if (url.startsWith('/interactions/') && url.endsWith('/callback')) {
			return '/interactions/:id/:token/callback';
		}

		let route = url
			.replace(/\/([a-z-]+)\/(?:[0-9]{17,19})/g, (match, p) =>
				p === 'channels' || p === 'guilds' || p === 'webhooks' ? match : `/${p}/:id`,
			)
			.replace(/\/reactions\/[^/]+/g, '/reactions/:id')
			.replace(/\/reactions\/:id\/[^/]+/g, '/reactions/:id/:userID')
			.replace(/^\/webhooks\/(\d+)\/[A-Za-z0-9-_]{64,}/, '/webhooks/$1/:token');

		if (method === 'DELETE' && route.endsWith('/messages/:id')) {
			const messageID = url.slice(url.lastIndexOf('/') + 1);
			const createdAt = Number(snowflakeToTimestamp(messageID));
			if (Date.now() - createdAt >= 1000 * 60 * 60 * 24 * 14) {
				method += '_OLD';
			} else if (Date.now() - createdAt <= 1000 * 10) {
				method += '_NEW';
			}
			route = method + route;
		} else if (method === 'GET' && /\/guilds\/[0-9]+\/channels$/.test(route)) {
			route = '/guilds/:id/channels';
		}
		if (method === 'PUT' || method === 'DELETE') {
			const index = route.indexOf('/reactions');
			if (index !== -1) {
				route = `MODIFY${route.slice(0, index + 10)}`;
			}
		}
		return route as `/${string}`;
	}
}

export type RequestOptions = Pick<ApiRequestOptions, 'reason' | 'auth' | 'appendToFormData'>;
export type RequestObject<
	M extends ProxyRequestMethod,
	B = Record<string, any>,
	Q = Record<string, any>,
	F extends RawFile[] = RawFile[],
> = {
	query?: Q;
} & RequestOptions &
	(M extends `${ProxyRequestMethod.Get}`
		? unknown
		: {
				body?: B;
				files?: F;
			});

export type RestArguments<
	M extends ProxyRequestMethod,
	B = any,
	Q extends never | Record<string, any> = any,
	F extends RawFile[] = RawFile[],
> = M extends ProxyRequestMethod.Get
	? Q extends never
		? RequestObject<M, never, B, never>
		: never
	: RequestObject<M, B, Q, F>;
