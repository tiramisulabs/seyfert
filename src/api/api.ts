import { randomUUID, type UUID } from 'node:crypto';
import {
	type Awaitable,
	BASE_HOST,
	delay,
	Logger,
	lazyLoadPackage,
	SeyfertError,
	snowflakeToTimestamp,
} from '../common';
import { toArrayBuffer, toBuffer } from '../common/it/utils';
import type { WorkerData } from '../websocket';
import { WORKER_TIMEOUT_MS, type WorkerSendApiRequest } from '../websocket/discord/worker';
import { Bucket } from './bucket';
import { CDNRouter, Router } from './Router';
import type { APIRoutes } from './Routes';
import {
	type ApiHandlerInternalOptions,
	type ApiHandlerOptions,
	type ApiRequestBody,
	type ApiRequestOptions,
	DefaultUserAgent,
	type HttpMethods,
	type RawFile,
	type RequestHeaders,
	type RestObserveOptions,
	type RestObserver,
	type RestObserverDisposer,
	type RestObserverEntry,
} from './shared';
import { isBufferLike } from './utils/utils';

export type {
	RestObserveOptions,
	RestObserver,
	RestObserverDisposer,
	RestObserverEntry,
	RestObserverFailPayload,
	RestObserverRatelimitPayload,
	RestObserverRequestPayload,
	RestObserverSuccessPayload,
} from './shared';

export interface ApiHandler<TClient = unknown> {
	/* @internal */
	_proxy_?: APIRoutes;
	debugger?: Logger;
	/* @internal */
	workerData?: WorkerData;
}

export type OnRatelimitCallback = (response: Response, request: ApiRequestOptions) => Awaitable<any>;
export type OnSuccessRequestCallback = (method: HttpMethods, url: `/${string}`, response: Response) => Awaitable<any>;
export type OnFailRequestCallback = (
	method: HttpMethods,
	url: `/${string}`,
	error: unknown,
	statusCode?: number,
) => Awaitable<any>;
type InternalApiRequestOptions = ApiRequestOptions & { _50xRetries?: number };

export class ApiHandler<TClient = unknown> {
	options: ApiHandlerInternalOptions;
	globalBlock = false;
	ratelimits = new Map<string, Bucket>();
	readyQueue: (() => void)[] = [];
	private bucketAliases = new Map<string, string>();
	private globalBlocks = new Map<string, (() => void)[]>();
	private globalTimers = new Map<string, ReturnType<typeof setTimeout>>();
	cdn = CDNRouter.createProxy();
	workerPromises?: Map<string, { resolve: (value: any) => any; reject: (error: any) => any }>;
	onRatelimit?: OnRatelimitCallback;
	onSuccessRequest?: OnSuccessRequestCallback;
	onFailRequest?: OnFailRequestCallback;
	pluginRestObserverProvider?: () => readonly RestObserverEntry[];
	pluginRestObserverClient?: TClient;
	private restObservers = new Map<symbol, RestObserverEntry<TClient>>();

	constructor(options: ApiHandlerOptions) {
		this.options = {
			baseUrl: 'api/v10',
			domain: BASE_HOST,
			type: 'Bot',
			...options,
			userAgent: DefaultUserAgent,
		};
		if (options.debug) this.debug = true;

		const worker_threads = lazyLoadPackage<typeof import('node:worker_threads')>('node:worker_threads');

		if (options.workerProxy && !worker_threads?.parentPort && !process.send)
			throw new SeyfertError('API_WORKER_PROXY_PARENT_REQUIRED', {
				metadata: { detail: 'Cannot use workerProxy without a parent.' },
			});
		if (options.workerProxy) this.workerPromises = new Map();

		if (worker_threads?.parentPort) {
			this.sendMessage = async body => {
				worker_threads.parentPort!.postMessage(
					body,
					body.requestOptions.files
						?.filter(x => !['string', 'boolean', 'number'].includes(typeof x.data))
						.map(x => (x.data instanceof Buffer ? toArrayBuffer(x.data) : (x.data as ArrayBuffer))) ?? [],
				);
			};
		} else if (process.send) {
			this.sendMessage = body => {
				const data = {
					...body,
					requestOptions: {
						...body.requestOptions,
						files: body.requestOptions.files?.map(file => {
							if (file.data instanceof ArrayBuffer) file.data = toBuffer(file.data);
							return file;
						}),
					},
				};
				process.send!(data);
			};
		}
	}

	observe(observer: RestObserver<TClient>, _opts?: RestObserveOptions): RestObserverDisposer {
		const id = Symbol('rest-observer');
		this.restObservers.set(id, { observer });
		let disposed = false;

		return () => {
			if (disposed) return;
			disposed = true;
			this.restObservers.delete(id);
		};
	}

	set debug(active: boolean) {
		this.debugger = active
			? new Logger({
					name: '[API]',
				})
			: undefined;
	}

	get proxy() {
		return (this._proxy_ ??= new Router(this).createProxy());
	}

	globalUnblock() {
		for (const timer of this.globalTimers.values()) clearTimeout(timer);
		this.globalTimers.clear();
		for (const queue of this.globalBlocks.values()) {
			for (const callback of queue) callback();
		}
		this.globalBlocks.clear();
		this.globalBlock = false;
		let cb: (() => void) | undefined;
		while ((cb = this.readyQueue.shift())) {
			cb();
		}
	}

	randomUUID(): UUID {
		const uuid = randomUUID();
		if (this.workerPromises!.has(uuid)) return this.randomUUID();
		return uuid;
	}

	protected sendMessage(_body: WorkerSendApiRequest) {
		throw new SeyfertError('FUNCTION_NOT_IMPLEMENTED', {
			metadata: { detail: 'Function not implemented' },
		});
	}

	protected postMessage<T = unknown>(body: WorkerSendApiRequest) {
		this.sendMessage(body);
		return new Promise<T>((res, rej) => {
			const timeout = setTimeout(() => {
				this.workerPromises!.delete(body.nonce);
				rej(
					new SeyfertError('WORKER_TIMEOUT', {
						metadata: {
							nonce: body.nonce,
							operation: 'API worker request',
							detail: `API worker request timed out (nonce: ${body.nonce}).`,
						},
					}),
				);
			}, WORKER_TIMEOUT_MS);
			this.workerPromises!.set(body.nonce, {
				resolve: value => {
					clearTimeout(timeout);
					res(value);
				},
				reject: reason => {
					clearTimeout(timeout);
					rej(reason);
				},
			});
		});
	}

	private async notifyRequest(method: HttpMethods, url: `/${string}`, request: ApiRequestOptions) {
		await this.notifyRestObservers('onRequest', () =>
			freezeRestPayload({
				client: this.pluginRestObserverClient,
				method,
				url,
				request: readonlyRequestOptions(request),
			}),
		);
	}

	private async notifySuccessRequest(
		method: HttpMethods,
		url: `/${string}`,
		response: Response,
		request: ApiRequestOptions,
	) {
		await this.notifyRestObservers('onSuccess', () =>
			freezeRestPayload({
				client: this.pluginRestObserverClient,
				method,
				url,
				request: readonlyRequestOptions(request),
				response,
			}),
		);
		try {
			await this.onSuccessRequest?.(method, url, response);
		} catch (error) {
			this.debugger?.warn('onSuccessRequest callback error', error);
		}
	}

	private async notifyFailRequest(
		method: HttpMethods,
		url: `/${string}`,
		error: unknown,
		statusCode: number | undefined,
		request: ApiRequestOptions,
	) {
		await this.notifyRestObservers('onFail', () =>
			freezeRestPayload({
				client: this.pluginRestObserverClient,
				method,
				url,
				request: readonlyRequestOptions(request),
				error,
				statusCode,
			}),
		);
		try {
			await this.onFailRequest?.(method, url, error, statusCode);
		} catch (callbackError) {
			this.debugger?.warn('onFailRequest callback error', callbackError);
		}
	}

	private async notifyRatelimit(
		response: Response,
		request: ApiRequestOptions,
		method: HttpMethods,
		url: `/${string}`,
	) {
		await this.notifyRestObservers('onRatelimit', () =>
			freezeRestPayload({
				client: this.pluginRestObserverClient,
				method,
				url,
				request: readonlyRequestOptions(request),
				response,
			}),
		);
		try {
			await this.onRatelimit?.(response, request);
		} catch (error) {
			this.debugger?.warn('onRatelimit callback error', error);
		}
	}

	private async notifyRestObservers(name: keyof RestObserver, createPayload: () => unknown) {
		let payload: unknown;
		let hasPayload = false;
		const getPayload = () => {
			if (!hasPayload) {
				payload = createPayload();
				hasPayload = true;
			}
			return payload;
		};

		await this.notifyRestObserverEntries(name, getPayload, this.pluginRestObserverProvider?.() ?? []);
		await this.notifyRestObserverEntries(name, getPayload, this.restObservers.values());
	}

	private async notifyRestObserverEntries(
		name: keyof RestObserver,
		getPayload: () => unknown,
		entries: Iterable<RestObserverEntry>,
	) {
		for (const entry of entries) {
			const observer = entry.observer[name];
			if (!observer) continue;
			const payload = getPayload();
			try {
				await (observer as (payload: unknown) => Awaitable<unknown>)(payload);
			} catch (error) {
				const source = entry.plugin ? `[plugin:${entry.plugin}] ` : '';
				this.debugger?.warn(`${source}REST observer "${name}" callback error`, error);
			}
		}
	}

	async request<T = unknown>(method: HttpMethods, url: `/${string}`, request: ApiRequestOptions = {}): Promise<T> {
		const requestOptions = { ...request } as InternalApiRequestOptions;
		const { auth = true } = requestOptions;
		let attempts = requestOptions._50xRetries ?? 0;
		delete requestOptions._50xRetries;
		const originTrace: { stack?: string } = {};
		Error.captureStackTrace(originTrace, this.request);

		if (this.options.workerProxy) {
			const nonce = this.randomUUID();
			return this.postMessage<T>({
				method,
				url,
				type: 'WORKER_API_REQUEST',
				workerId: this.workerData!.workerId,
				nonce,
				requestOptions: { auth, ...requestOptions },
			});
		}
		const route = requestOptions.route || this.routefy(url, method);
		const provisionalRoute = requestOptions.route || `${method}:${route}`;
		let bucketRoute = this.bucketAliases.get(provisionalRoute) ?? provisionalRoute;

		const callback = async (next: () => void, resolve: (data: any) => void, reject: (err: unknown) => void) => {
			const headers = {
				'User-Agent': this.options.userAgent,
			} satisfies RequestHeaders;

			let data: string | FormData | undefined;
			let finalUrl: `/${string}`;

			try {
				({ data, finalUrl } = this.parseRequest({
					url,
					headers,
					request: { ...requestOptions, auth },
				}));
			} catch (err) {
				next();
				reject(err);
				return;
			}

			let response: Response;

			try {
				const requestUrl = `${this.options.domain}/${this.options.baseUrl}${finalUrl}`;
				await this.notifyRequest(method, finalUrl, { ...request, auth });
				this.debugger?.debug(`Sending, Method: ${method} | Url: [${finalUrl}](${route}) | Auth: ${auth}`);
				response = await fetch(requestUrl, {
					method,
					headers,
					body: data,
				});
				this.debugger?.debug(`Received response: ${response.statusText}(${response.status})`);
			} catch (err) {
				this.debugger?.debug('Fetch error', err);
				await this.notifyFailRequest(method, finalUrl, err, undefined, { ...request, auth });
				next();
				reject(err);
				return;
			}

			const now = Date.now();
			const headerNow = Date.parse(response.headers.get('date') ?? '');

			bucketRoute = this.learnBucket(provisionalRoute, bucketRoute, url, response, requestOptions.route !== undefined);
			this.setRatelimitsBucket(bucketRoute, response);
			this.setResetBucket(bucketRoute, response, now, headerNow, route);
			this.ratelimits.get(bucketRoute)!.process();

			const observerResponse = response.clone();
			let result: unknown;
			try {
				result = await decodeResponse(response);
			} catch (error) {
				await this.notifyFailRequest(method, finalUrl, error, response.status, { ...request, auth });
				next();
				reject(error);
				return;
			}

			if (response.status >= 300) {
				const errorResult = normalizeErrorResult(result);
				if (response.status === 429) {
					const result429 = await this.handle429(
						bucketRoute,
						method,
						url,
						{ ...request, auth },
						observerResponse,
						typeof errorResult === 'string' ? errorResult : JSON.stringify(errorResult),
						next,
						reject,
						now,
						finalUrl,
					);
					if (result429 !== false) return resolve(result429);
					await this.notifyFailRequest(method, finalUrl, errorResult, response.status, { ...request, auth });
					return this.clearResetInterval(bucketRoute);
				}
				if ([502, 503].includes(response.status) && ++attempts < 4) {
					this.clearResetInterval(bucketRoute);
					return this.handle50X(method, url, requestOptions, attempts, next, resolve, reject);
				}
				this.clearResetInterval(bucketRoute);
				next();
				const parsedError = this.parseError(method, route, response, errorResult, originTrace);
				this.debugger?.warn(parsedError.message);
				await this.notifyFailRequest(method, finalUrl, parsedError, response.status, { ...request, auth });
				reject(parsedError);
				return;
			}

			await this.notifySuccessRequest(method, finalUrl, observerResponse, { ...request, auth });
			next();
			return resolve(result);
		};

		return new Promise((resolve, reject) => {
			const dispatch = () => {
				bucketRoute = this.bucketAliases.get(provisionalRoute) ?? bucketRoute;
				if (!this.ratelimits.has(bucketRoute)) {
					this.ratelimits.set(bucketRoute, new Bucket(1));
				}
				this.ratelimits.get(bucketRoute)!.push({ next: callback, resolve, reject }, request.unshift);
			};
			const globalQueue = this.globalBlocks.get(this.globalRateLimitKey({ ...requestOptions, auth }));
			if (globalQueue && !url.startsWith('/interactions/')) {
				globalQueue.push(dispatch);
			} else {
				dispatch();
			}
		});
	}

	private learnBucket(
		provisionalRoute: string,
		currentRoute: string,
		url: `/${string}`,
		response: Response,
		hasRouteOverride: boolean,
	) {
		const hash = response.headers.get('x-ratelimit-bucket');
		if (!hash || hasRouteOverride) return currentRoute;

		const learnedRoute = `${hash}:${majorParameter(url)}`;
		this.bucketAliases.set(provisionalRoute, learnedRoute);

		const currentBucket = this.ratelimits.get(currentRoute)!;
		const learnedBucket = this.ratelimits.get(learnedRoute);
		if (!learnedBucket) {
			this.ratelimits.set(learnedRoute, currentBucket);
			return learnedRoute;
		}
		if (learnedBucket !== currentBucket && currentBucket.queue.length) {
			learnedBucket.queue.push(...currentBucket.queue.splice(0));
		}
		return learnedRoute;
	}

	private globalRateLimitKey(request: ApiRequestOptions) {
		if (request.auth === false) return 'unauthenticated';
		return `${this.options.type}:${request.token || this.options.token}`;
	}

	private blockGlobal(request: ApiRequestOptions, retryAfter: number) {
		const key = this.globalRateLimitKey(request);
		if (!this.globalBlocks.has(key)) this.globalBlocks.set(key, []);
		const previousTimer = this.globalTimers.get(key);
		if (previousTimer) clearTimeout(previousTimer);
		this.globalBlock = true;
		this.globalTimers.set(
			key,
			setTimeout(() => this.unblockGlobal(key), retryAfter || 1),
		);
	}

	private unblockGlobal(key: string) {
		this.globalTimers.delete(key);
		const queue = this.globalBlocks.get(key) ?? [];
		this.globalBlocks.delete(key);
		this.globalBlock = this.globalBlocks.size > 0;
		for (const callback of queue) callback();
	}

	parseError(
		method: HttpMethods,
		route: `/${string}`,
		response: Response,
		result: string | Record<string, any>,
		originTrace?: { stack?: string },
	) {
		let errMessage = '';
		let code: string | undefined;
		const metadata: Record<string, unknown> = {
			method,
			route,
			status: response.status,
			statusText: response.statusText,
		};
		if (typeof result === 'object') {
			if (typeof result.code !== 'undefined') {
				code = String(result.code);
			}
			metadata.response = result;
			errMessage += `${result.message ?? 'Unknown'} ${result.code ?? ''}\n[${response.status} ${response.statusText}] ${method} ${route}`;

			if ('errors' in result) {
				const errors = this.parseValidationError(result.errors);
				errMessage += `\n${errors.join('\n') || JSON.stringify(result.errors, null, 2)}`;
			}
		} else {
			errMessage = `[${response.status} ${response.statusText}] ${method} ${route}`;
		}

		const error = new SeyfertError(`API_${response.statusText}_${code}`, {
			metadata: {
				...metadata,
				detail: errMessage,
			},
		});
		const originStack = originTrace?.stack;
		if (originStack) {
			const originLines = originStack
				.split('\n')
				.slice(1)
				.filter(
					line =>
						!line.includes('node:internal') &&
						!line.includes('/src/api/api.ts') &&
						!line.includes('\\src\\api\\api.ts'),
				);

			if (originLines.length) {
				error.stack = `${error.name}: ${error.message}\n${originLines.join('\n')}`;
			}
		}

		return error;
	}

	parseValidationError(data: Record<string, any>, path = '', errors: string[] = []) {
		for (const key in data) {
			if (key === '_errors') {
				for (const error of data[key]) {
					errors.push(`${path.slice(0, -1)} [${error.code}]: ${error.message}`);
				}
			} else if (typeof data[key] === 'object') {
				this.parseValidationError(data[key], `${path}${key}.`, errors);
			}
		}

		return errors;
	}

	async handle50X(
		method: HttpMethods,
		url: `/${string}`,
		request: ApiRequestOptions,
		attempts: number | (() => void),
		next: () => void = () => {},
		resolve?: (value: unknown) => void,
		reject?: (err: unknown) => void,
	) {
		const retryAttempt = typeof attempts === 'number' ? attempts : 0;
		const callback = typeof attempts === 'function' ? attempts : next;
		const requestOptions = {
			...request,
			unshift: true,
			...(retryAttempt > 0 ? { _50xRetries: retryAttempt } : {}),
		};

		const wait = Math.floor(Math.random() * 1900 + 100);
		this.debugger?.warn(`Handling a 50X status, retrying in ${wait}ms`);
		callback();
		await delay(wait);
		return this.request(method, url, requestOptions as ApiRequestOptions)
			.then(value => {
				resolve?.(value);
				return value;
			})
			.catch(error => {
				reject?.(error);
				throw error;
			});
	}

	async handle429(
		route: string,
		method: HttpMethods,
		url: `/${string}`,
		request: ApiRequestOptions,
		response: Response,
		result: string,
		next: () => void,
		reject: (err: unknown) => void,
		now: number,
		notifyUrl: `/${string}`,
	) {
		const bucket = this.ratelimits.get(route)!;
		let retryAfter: number | undefined;

		let data: Record<string, unknown> | undefined;
		try {
			const parsed: unknown = JSON.parse(result);
			if (isPlainObject(parsed)) data = parsed;
		} catch {}
		if (typeof data?.retry_after === 'number' && Number.isFinite(data.retry_after) && data.retry_after >= 0) {
			retryAfter = Math.ceil(data.retry_after * 1000);
		}
		for (const header of ['retry-after', 'x-ratelimit-reset-after']) {
			if (retryAfter !== undefined) break;
			const raw = response.headers.get(header);
			if (raw === null || raw.trim() === '') continue;
			const value = Number(raw) * 1000;
			if (Number.isFinite(value) && value >= 0) retryAfter = value;
		}

		if (retryAfter === undefined) {
			await this.notifyRatelimit(response, request, method, notifyUrl);
			this.debugger?.warn(`${route} Could not extract retry_after from 429 response. ${result}`);
			next();
			reject(
				new SeyfertError('INVALID_RETRY_AFTER', {
					metadata: {
						...{
							route,
							method,
							status: response.status,
							result,
						},
						detail: 'Could not extract retry_after from 429 response.',
					},
				}),
			);
			return false;
		}
		if (
			data?.global === true ||
			response.headers.has('x-ratelimit-global') ||
			response.headers.get('x-ratelimit-scope') === 'global'
		) {
			this.blockGlobal(request, retryAfter);
		}
		await this.notifyRatelimit(response, request, method, notifyUrl);

		if (this.debugger) {
			const content = `${JSON.stringify(request)} `;
			this.debugger.info(
				`${response.headers.get('x-ratelimit-global') ? 'Global' : 'Unexpected'} 429: ${result.slice(0, 256)}\n${content} ${now} ${route} ${response.status}: ${bucket.remaining}/${bucket.limit} left | Reset ${retryAfter} (${bucket.reset - now}ms left) | Scope ${response.headers.get('x-ratelimit-scope')}`,
			);
		}
		if (retryAfter) await delay(retryAfter);
		const retry = this.request(method, url, {
			...request,
			unshift: true,
		});
		next();
		return retry.catch(reject);
	}

	clearResetInterval(route: string) {
		clearInterval(this.ratelimits.get(route)!.processingResetAfter as NodeJS.Timeout);
		this.ratelimits.get(route)!.processingResetAfter = undefined;
		this.ratelimits.get(route)!.resetAfter = 0;
	}

	setResetBucket(route: string, resp: Response, now: number, headerNow: number, normalizedRoute = route) {
		const retryAfterHeader = resp.headers.get('x-ratelimit-reset-after') ?? resp.headers.get('retry-after');
		const retryAfter = retryAfterHeader === null ? undefined : Number(retryAfterHeader) * 1000;

		if (retryAfter !== undefined && Number.isFinite(retryAfter) && retryAfter >= 0) {
			this.ratelimits.get(route)!.reset = (retryAfter || 1) + now;
		} else if (resp.headers.get('x-ratelimit-reset')) {
			let resetTime = +resp.headers.get('x-ratelimit-reset')! * 1000;
			if (
				normalizedRoute.endsWith('/reactions/:id') &&
				+resp.headers.get('x-ratelimit-reset')! * 1000 - headerNow === 1000
			) {
				resetTime = now + 250;
			}
			this.ratelimits.get(route)!.reset = Math.max(resetTime, now);
		} else {
			this.ratelimits.get(route)!.reset = now;
		}
	}

	setRatelimitsBucket(route: string, resp: Response) {
		if (resp.headers.has('x-ratelimit-limit')) {
			this.ratelimits.get(route)!.limit = +resp.headers.get('x-ratelimit-limit')!;
		}

		const raw = resp.headers.get('x-ratelimit-remaining');
		this.ratelimits.get(route)!.remaining = raw != null ? +raw : 1;

		if (this.options.smartBucket) {
			if (
				resp.headers.has('x-ratelimit-reset-after') &&
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

	parseRequest(options: { url: string; headers: RequestHeaders; request: ApiRequestOptions }) {
		let finalUrl = options.url;
		let data: string | FormData | undefined;
		if (options.request.auth) {
			const token = options.request.token || this.options.token;
			if (token === 'INVALID' || typeof token !== 'string' || token.length === 0) {
				throw new SeyfertError('INVALID_TOKEN', { metadata: { detail: 'token is not a string' } });
			}
			options.headers.Authorization = `${this.options.type} ${token}`;
		}
		if (options.request.query) {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(options.request.query)) {
				if (value === null || value === undefined) continue;
				if (Array.isArray(value)) {
					for (const item of value) {
						if (item === null || item === undefined) continue;
						params.append(key, String(item));
					}
				} else {
					params.append(key, String(value));
				}
			}
			const query = params.toString();
			if (query) finalUrl += `${finalUrl.includes('?') ? '&' : '?'}${query}`;
		}

		if (options.request.files?.length || options.request.appendToFormData) {
			const formData = new FormData();

			for (const [index, file] of options.request.files?.entries() ?? []) {
				const fileKey = file.key ?? `files[${index}]`;
				const blobContent = isBufferLike(file.data)
					? file.data instanceof ArrayBuffer
						? file.data
						: toArrayBuffer(file.data)
					: `${file.data}`;
				const blob = new Blob([blobContent], { type: file.contentType });
				formData.append(fileKey, blob, file.filename);
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
			const createdAt = snowflakeToTimestamp(messageID);
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

export type RequestOptions = Pick<ApiRequestOptions, 'reason' | 'auth' | 'appendToFormData' | 'token'>;

export type RestArguments<
	B extends ApiRequestBody | undefined,
	Q extends never | Record<string, any> = never,
	F extends RawFile[] = RawFile[],
> = (
	| {
			body: B;
			files?: F;
	  }
	| (Q extends never | undefined
			? {}
			: {
					query?: Q;
				})
) &
	RequestOptions;

export type RestArgumentsNoBody<Q extends never | Record<string, any> = never> = {
	query?: Q;
	files?: RawFile[];
} & RequestOptions;

export type RestArgumentsRequiredQuery<Q extends Record<string, any>> = Omit<RestArgumentsNoBody<Q>, 'query'> & {
	query: Q;
};

function freezeRestPayload<T extends object>(payload: T): Readonly<T> {
	return Object.freeze(payload);
}

function readonlyRequestOptions(request: ApiRequestOptions): Readonly<ApiRequestOptions> {
	const clone: ApiRequestOptions = deepClonePlain({
		...request,
		body: request.body ? deepClonePlain(request.body) : undefined,
		query: request.query ? deepClonePlain(request.query) : undefined,
		files: request.files?.map(file => deepClonePlain(file)),
	});
	return deepFreezePlain(clone);
}

function deepClonePlain<T>(value: T): T {
	if (Array.isArray(value)) return value.map(deepClonePlain) as T;
	if (!isPlainObject(value)) return value;
	return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, deepClonePlain(entry)])) as T;
}

function deepFreezePlain<T>(value: T): Readonly<T> {
	if (Array.isArray(value)) {
		for (const entry of value) deepFreezePlain(entry);
		return Object.freeze(value) as Readonly<T>;
	}
	if (!isPlainObject(value)) return value as Readonly<T>;
	for (const entry of Object.values(value)) deepFreezePlain(entry);
	return Object.freeze(value) as Readonly<T>;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	if (typeof value !== 'object' || value === null) return false;
	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}

function normalizeErrorResult(result: unknown): string | Record<string, any> {
	if (typeof result === 'string' || isPlainObject(result)) return result;
	return JSON.stringify(result) ?? String(result);
}

async function decodeResponse(response: Response) {
	const contentType = response.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase();
	if (response.status < 300 && contentType && !contentType.startsWith('text/') && !isJsonContentType(contentType)) {
		return response.arrayBuffer();
	}
	const text = await response.text();
	if (!text.length) return undefined;
	return isJsonContentType(contentType) ? JSON.parse(text) : text;
}

function isJsonContentType(contentType: string | undefined) {
	return contentType === 'application/json' || contentType?.endsWith('+json') === true;
}

function majorParameter(url: string) {
	const channel = url.match(/^\/channels\/([^/]+)/)?.[1];
	if (channel) return `channels:${channel}`;
	const guild = url.match(/^\/guilds\/([^/]+)/)?.[1];
	if (guild) return `guilds:${guild}`;
	const webhook = url.match(/^\/webhooks\/([^/]+)(?:\/([^/?]+))?/)?.slice(1);
	if (webhook?.[0]) return `webhooks:${webhook.filter(Boolean).join(':')}`;
	return '';
}
