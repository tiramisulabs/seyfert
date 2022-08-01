import type {
	CreateRequestBodyOptions,
	RestAdapter,
	RestPayload,
	RestRateLimitedPath,
	RestRequest,
	RestRequestRejection,
	RestRequestResponse,
	RestSendRequestOptions,
} from './rest-adapter';

import type { FileContent } from '@biscuitland/api-types';

import { Constants, HTTPResponseCodes } from '@biscuitland/api-types';

export class DefaultRestAdapter implements RestAdapter {
	static readonly DEFAULTS = {
		url: '',

		version: Constants.API_VERSION,

		maxRetryCount: 10,
	};

	options: Options;

	/** current invalid amount */
	protected invalidRequests = 0;

	/** max invalid requests allowed until ban */
	protected maxInvalidRequests = 10000;

	/** 10 minutes */
	protected invalidRequestsInterval = 600000;

	/** timer to reset to 0 */
	protected invalidRequestsTimeoutId = 0;

	/** how safe to be from max */
	protected invalidRequestsSafetyAmount = 1;

	/** when first request in this period was made */
	protected invalidRequestErrorStatuses = [401, 403, 429];

	protected processingQueue = false;

	protected processingRateLimitedPaths = false;

	protected globallyRateLimited = false;

	protected globalQueueProcessing = false;

	private rateLimitedPaths = new Map<string, RestRateLimitedPath>();

	private globalQueue = [] as {
		request: RestRequest;
		payload: RestPayload;
		basicURL: string;
		urlToUse: string;
	}[];

	private pathQueues = new Map<
		string,
		{
			isWaiting: boolean;
			requests: {
				request: RestRequest;
				payload: RestPayload;
			}[];
		}
	>();

	private url: string;

	constructor(options: DefaultRestOptions) {
		this.options = Object.assign(options, DefaultRestAdapter.DEFAULTS);

		if (this.options.url) {
			this.url = `${options.url}/v${this.options.version}`;
		} else {
			this.url = `${Constants.BASE_URL}/v${this.options.version}`;
		}
	}

	/**
	 * @inheritDoc
	 */

	async get<T>(
		route: string,
		body?: any,
		options?: {
			retryCount?: number;
			bucketId?: string;
			headers?: Record<string, string>;
		}
	): Promise<T> {
		const url = route[0] === '/' ? `${this.url}${route}` : route;

		return new Promise((resolve, reject) => {
			this.processRequest(
				{
					url,
					method: 'GET',
					reject: (data: RestRequestRejection) => {
						const restError = this.convertRestError(
							new Error('Location:'),
							data
						);
						reject(restError);
					},
					resolve: (data: RestRequestResponse) =>
						resolve(
							data.status !== 204
								? JSON.parse(data.body ?? '{}')
								: (undefined as unknown as T)
						),
				},
				{
					bucketId: options?.bucketId,
					body: body as Record<string, unknown> | undefined,
					retryCount: options?.retryCount ?? 0,
					headers: options?.headers,
				}
			);
		});
	}

	/**
	 * @inheritDoc
	 */

	async put<T>(
		route: string,
		body?: any,
		options?: {
			retryCount?: number;
			bucketId?: string;
			headers?: Record<string, string>;
		}
	): Promise<T> {
		const url = route[0] === '/' ? `${this.url}${route}` : route;

		return new Promise((resolve, reject) => {
			this.processRequest(
				{
					url,
					method: 'PUT',
					reject: (data: RestRequestRejection) => {
						const restError = this.convertRestError(
							new Error('Location:'),
							data
						);
						reject(restError);
					},
					resolve: (data: RestRequestResponse) =>
						resolve(
							data.status !== 204
								? JSON.parse(data.body ?? '{}')
								: (undefined as unknown as T)
						),
				},
				{
					bucketId: options?.bucketId,
					body: body as Record<string, unknown> | undefined,
					retryCount: options?.retryCount ?? 0,
					headers: options?.headers,
				}
			);
		});
	}

	/**
	 * @inheritDoc
	 */

	async post<T>(
		route: string,
		body?: any,
		options?: {
			retryCount?: number;
			bucketId?: string;
			headers?: Record<string, string>;
		}
	): Promise<T> {
		const url = route[0] === '/' ? `${this.url}${route}` : route;

		return new Promise((resolve, reject) => {
			this.processRequest(
				{
					url,
					method: 'POST',
					reject: err => reject(err),
					resolve: (data: RestRequestResponse) =>
						resolve(
							data.status !== 204
								? JSON.parse(data.body ?? '{}')
								: (undefined as unknown as T)
						),
				},
				{
					bucketId: options?.bucketId,
					body: body as Record<string, unknown> | undefined,
					retryCount: options?.retryCount ?? 0,
					headers: options?.headers,
				}
			);
		});
	}

	/**
	 * @inheritDoc
	 */

	async patch<T>(
		route: string,
		body?: any,
		options?: {
			retryCount?: number;
			bucketId?: string;
			headers?: Record<string, string>;
		}
	): Promise<T> {
		const url = route[0] === '/' ? `${this.url}${route}` : route;

		return new Promise((resolve, reject) => {
			this.processRequest(
				{
					url,
					method: 'PATCH',
					reject: (data: RestRequestRejection) => {
						const restError = this.convertRestError(
							new Error('Location:'),
							data
						);
						reject(restError);
					},
					resolve: (data: RestRequestResponse) =>
						resolve(
							data.status !== 204
								? JSON.parse(data.body ?? '{}')
								: (undefined as unknown as T)
						),
				},
				{
					bucketId: options?.bucketId,
					body: body as Record<string, unknown> | undefined,
					retryCount: options?.retryCount ?? 0,
					headers: options?.headers,
				}
			);
		});
	}

	/**
	 * @inheritDoc
	 */

	async delete<T>(
		route: string,
		body?: any,
		options?: {
			retryCount?: number;
			bucketId?: string;
			headers?: Record<string, string>;
		}
	): Promise<T> {
		const url = route[0] === '/' ? `${this.url}${route}` : route;
		return new Promise((resolve, reject) => {
			this.processRequest(
				{
					url,
					method: 'DELETE',
					reject: (data: RestRequestRejection) => {
						const restError = this.convertRestError(
							new Error('Location:'),
							data
						);
						reject(restError);
					},
					resolve: (data: any) => resolve(data.body ? JSON.parse(data.body) : {}),
				},
				{
					bucketId: options?.bucketId,
					body: body as Record<string, unknown> | undefined,
					retryCount: options?.retryCount ?? 0,
					headers: options?.headers,
				}
			);
		});
	}

	/**
	 * @inheritDoc
	 */

	private async sendRequest(options: RestSendRequestOptions) {
		try {
			const response = await fetch(
				new Request(options.url, {
					method: options.method,
					headers: options.payload?.headers,
					body: options.payload?.body,
				})
			);
			const bucketIdFromHeaders = this.processRequestHeaders(
				options.url,
				response.headers
			);

			if (bucketIdFromHeaders) {
				options.bucketId = bucketIdFromHeaders;
			}

			if (response.status === 204) {
				options.resolve?.({
					ok: true,
					status: 204,
				});

				return;
			}

			if (response.status < 200 || response.status >= 400) {
				let error = 'REQUEST_UNKNOWN_ERROR';

				switch (response.status) {
					case HTTPResponseCodes.BadRequest:
						error =
							"The options was improperly formatted, or the server couldn't understand it.";
						break;
					case HTTPResponseCodes.Unauthorized:
						error =
							'The Authorization header was missing or invalid.';
						break;
					case HTTPResponseCodes.Forbidden:
						error =
							'The Authorization token you passed did not have permission to the resource.';
						break;
					case HTTPResponseCodes.NotFound:
						error =
							"The resource at the location specified doesn't exist.";
						break;
					case HTTPResponseCodes.MethodNotAllowed:
						error =
							'The HTTP method used is not valid for the location specified.';
						break;
					case HTTPResponseCodes.GatewayUnavailable:
						error =
							'There was not a gateway available to process your options. Wait a bit and retry.';
						break;
				}

				if (
					this.invalidRequestErrorStatuses.includes(
						response.status
					) &&
					!(
						response.status === 429 &&
						response.headers.get('X-RateLimit-Scope')
					)
				) {
					++this.invalidRequests;

					if (!this.invalidRequestsTimeoutId) {
						const it: any = setTimeout(() => {
							this.invalidRequests = 0;
							this.invalidRequestsTimeoutId = 0;
						}, this.invalidRequestsInterval);

						this.invalidRequestsTimeoutId = it;
					}
				}

				if (response.status !== 429) {
					options.reject?.({
						ok: false,
						status: response.status,
						error,
						body: response.type
							? JSON.stringify(await response.json())
							: undefined,
					});

					throw new Error(
						JSON.stringify({
							ok: false,
							status: response.status,
							error,
							body: response.type
								? JSON.stringify(await response.json())
								: undefined,
						})
					);
				} else {
					if (
						options.retryCount &&
						options.retryCount++ >= this.options.maxRetryCount
					) {
						options.reject?.({
							ok: false,
							status: response.status,
							error: 'The options was rate limited and it maxed out the retries limit.',
						});

						return;
					}
				}
			}

			const json = JSON.stringify(await response.json());

			options.resolve?.({
				ok: true,
				status: 200,
				body: json,
			});

			return JSON.parse(json);
		} catch (error) {
			options.reject?.({
				ok: false,
				status: 599,
				error: 'Internal Error',
			});

			throw new Error('Something went wrong in sendRequest');
		}
	}

	/**
	 * @inheritDoc
	 */

	private processRequest(request: RestRequest, payload: RestPayload) {
		const queue = this.pathQueues.get(request.url);

		if (queue) {
			queue.requests.push({ request, payload });
		} else {
			this.pathQueues.set(request.url, {
				isWaiting: false,
				requests: [
					{
						request,
						payload,
					},
				],
			});

			this.processQueue(request.url);
		}
	}

	/**
	 * @inheritDoc
	 */

	private processQueue(id: string) {
		const queue = this.pathQueues.get(id);

		if (!queue) {
			return;
		}

		while (queue.requests.length) {
			const request = queue.requests[0];

			if (!request) {
				break;
			}

			const basicURL = request.request.url + '@' + request.request.method;
			const urlResetIn = this.checkRateLimits(basicURL);

			if (urlResetIn) {
				if (!queue.isWaiting) {
					queue.isWaiting = true;

					setTimeout(() => {
						queue.isWaiting = false;

						this.processQueue(id);
					}, urlResetIn);
				}

				break;
			}

			const bucketResetIn = request.payload.bucketId
				? this.checkRateLimits(request.payload.bucketId)
				: false;

			if (bucketResetIn) {
				continue;
			}

			this.globalQueue.push({
				...request,
				urlToUse: request.request.url,
				basicURL,
			});

			this.processGlobalQueue();
			queue.requests.shift();
		}

		this.cleanupQueues();
	}

	/**
	 * @inheritDoc
	 */

	private async processGlobalQueue() {
		if (!this.globalQueue.length) {
			return;
		}

		if (this.globalQueueProcessing) {
			return;
		}

		this.globalQueueProcessing = true;

		while (this.globalQueue.length) {
			if (this.globallyRateLimited) {
				setTimeout(() => {
					this.processGlobalQueue();
				}, 1000);

				break;
			}

			if (
				this.invalidRequests ===
				this.maxInvalidRequests - this.invalidRequestsSafetyAmount
			) {
				setTimeout(() => {
					this.processGlobalQueue();
				}, 1000);

				break;
			}

			const request = this.globalQueue.shift();

			if (!request) {
				continue;
			}

			const urlResetIn = this.checkRateLimits(request.basicURL);

			const bucketResetIn = request.payload.bucketId
				? this.checkRateLimits(request.payload.bucketId)
				: false;

			if (urlResetIn || bucketResetIn) {
				setTimeout(() => {
					this.globalQueue.unshift(request);
					this.processGlobalQueue();
				}, urlResetIn || (bucketResetIn as number));

				continue;
			}

			await this.sendRequest({
				url: request.urlToUse,
				method: request.request.method,
				bucketId: request.payload.bucketId,
				reject: request.request.reject,
				resolve: request.request.resolve,
				retryCount: request.payload.retryCount ?? 0,
				payload: this.createRequestBody({
					method: request.request.method,
					body: request.payload.body,
				}),
			}).catch(() => null);
		}

		this.globalQueueProcessing = false;
	}

	/**
	 * @inheritDoc
	 */

	private processRequestHeaders(url: string, headers: Headers) {
		let rateLimited = false;

		const remaining = headers.get('x-ratelimit-remaining');
		const retryAfter = headers.get('x-ratelimit-reset-after');
		const reset = Date.now() + Number(retryAfter) * 1000;
		const global = headers.get('x-ratelimit-global');

		const bucketId = headers.get('x-ratelimit-bucket') || undefined;

		if (remaining === '0') {
			rateLimited = true;

			this.rateLimitedPaths.set(url, {
				url,
				resetTimestamp: reset,
				bucketId,
			});

			if (bucketId) {
				this.rateLimitedPaths.set(bucketId, {
					url,
					resetTimestamp: reset,
					bucketId,
				});
			}
		}

		if (global) {
			const retryAfter = headers.get('retry-after');
			const globalReset = Date.now() + Number(retryAfter) * 1000;

			this.globallyRateLimited = true;
			rateLimited = true;

			this.rateLimitedPaths.set('global', {
				url: 'global',
				resetTimestamp: globalReset,
				bucketId,
			});

			if (bucketId) {
				this.rateLimitedPaths.set(bucketId, {
					url: 'global',
					resetTimestamp: globalReset,
					bucketId,
				});
			}
		}

		if (rateLimited && !this.processingRateLimitedPaths) {
			this.processRateLimitedPaths();
		}

		return rateLimited ? bucketId : undefined;
	}

	/**
	 * @inheritDoc
	 */

	private processRateLimitedPaths() {
		const now = Date.now();

		for (const [key, value] of this.rateLimitedPaths.entries()) {
			if (value.resetTimestamp > now) {
				continue;
			}

			this.rateLimitedPaths.delete(key);

			if (key === 'global') {
				this.globallyRateLimited = false;
			}
		}

		if (!this.rateLimitedPaths.size) {
			this.processingRateLimitedPaths = false;
		} else {
			this.processingRateLimitedPaths = true;

			setTimeout(() => {
				this.processRateLimitedPaths();
			}, 1000);
		}
	}

	/**
	 * @inheritDoc
	 */

	private createRequestBody(options: CreateRequestBodyOptions) {
		const headers: Record<string, string> = {
			'user-agent': Constants.USER_AGENT,
		};

		if (!options.unauthorized) {
			headers.authorization = `Bot ${this.options.token}`;
		}

		if (options.headers) {
			for (const key in options.headers) {
				headers[key.toLowerCase()] = options.headers[key];
			}
		}

		if (options.method === 'GET') {
			options.body = undefined;
		}

		if (options.body?.reason) {
			headers['X-Audit-Log-Reason'] = encodeURIComponent(
				options.body.reason as string
			);
			options.body.reason = undefined;
		}

		if (options.body?.file) {
			if (!Array.isArray(options.body.file)) {
				options.body.file = [options.body.file];
			}

			const form = new FormData();

			for (
				let i = 0;
				i < (options.body.file as FileContent[]).length;
				i++
			) {
				form.append(
					`file${i}`,
					(options.body.file as FileContent[])[i].blob,
					(options.body.file as FileContent[])[i].name
				);
			}

			form.append(
				'payload_json',
				JSON.stringify({ ...options.body, file: undefined })
			);
			options.body.file = form;
		} else if (
			options.body &&
			!['GET', 'DELETE'].includes(options.method)
		) {
			headers['Content-Type'] = 'application/json';
		}

		return {
			headers,
			body: (options.body?.file ?? JSON.stringify(options.body)) as
				| FormData
				| string,
			method: options.method,
		};
	}

	/**
	 * @inheritDoc
	 */

	private checkRateLimits(url: string) {
		const limited = this.rateLimitedPaths.get(url);
		const global = this.rateLimitedPaths.get('global');

		const now = Date.now();

		if (limited && now < limited.resetTimestamp) {
			return limited.resetTimestamp - now;
		}

		if (global && now < global.resetTimestamp) {
			return global.resetTimestamp - now;
		}

		return false;
	}

	/**
	 * @inheritDoc
	 */

	private convertRestError(errorStack: Error, data: RestRequestRejection) {
		errorStack.message = `[${data.status}] ${data.error}\n${data.body}`;
		return errorStack;
	}

	/**
	 * @inheritDoc
	 */

	private cleanupQueues() {
		for (const [key, queue] of this.pathQueues) {
			if (queue.requests.length) {
				continue;
			}

			this.pathQueues.delete(key);
		}

		if (!this.pathQueues.size) {
			this.processingQueue = false;
		}
	}
}

export type DefaultRestOptions = Pick<
	Options,
	Exclude<keyof Options, keyof typeof DefaultRestAdapter.DEFAULTS>
> &
	Partial<Options>;

export interface Options {
	url: string;

	token: string;
	version: number;

	maxRetryCount: number;
}
