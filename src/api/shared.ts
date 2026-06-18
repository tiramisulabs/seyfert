import type { Awaitable, MakeRequired } from '../common';

export * from './api';
export * from './utils/constants';
export * from './utils/types';
export { calculateUserDefaultAvatarIndex } from './utils/utils';

export interface ApiHandlerOptions {
	baseUrl?: string;
	domain?: string;
	token: string;
	debug?: boolean;
	agent?: string;
	smartBucket?: boolean;
	workerProxy?: boolean;
	type?: 'Bearer' | 'Bot';
}

export interface ApiHandlerInternalOptions extends MakeRequired<ApiHandlerOptions, 'baseUrl' | 'domain' | 'type'> {
	userAgent: string;
}

export interface RawFile {
	contentType?: string;
	data: ArrayBuffer | Buffer | Uint8Array | Uint8ClampedArray | boolean | number | string;
	key?: string;
	filename: string;
}

export interface ApiRequestOptions {
	body?: Record<string, any>;
	query?: Record<string, any>;
	files?: RawFile[];
	auth?: boolean;
	reason?: string;
	route?: `/${string}`;
	unshift?: boolean;
	appendToFormData?: boolean;
	token?: string;
}

export type HttpMethods = 'GET' | 'DELETE' | 'PUT' | 'POST' | 'PATCH';

export interface RestObserverRequestPayload<TClient = unknown> {
	readonly client: TClient;
	readonly method: HttpMethods;
	readonly url: `/${string}`;
	readonly request: Readonly<ApiRequestOptions>;
}

export interface RestObserverSuccessPayload<TClient = unknown> extends RestObserverRequestPayload<TClient> {
	readonly response: Response;
}

export interface RestObserverFailPayload<TClient = unknown> extends RestObserverRequestPayload<TClient> {
	readonly error: unknown;
	readonly statusCode?: number;
}

export interface RestObserverRatelimitPayload<TClient = unknown> extends RestObserverRequestPayload<TClient> {
	readonly response: Response;
}

export interface RestObserver<TClient = unknown> {
	onRequest?(payload: RestObserverRequestPayload<TClient>): Awaitable<unknown>;
	onSuccess?(payload: RestObserverSuccessPayload<TClient>): Awaitable<unknown>;
	onFail?(payload: RestObserverFailPayload<TClient>): Awaitable<unknown>;
	onRatelimit?(payload: RestObserverRatelimitPayload<TClient>): Awaitable<unknown>;
}

export interface RestObserverEntry<TClient = unknown> {
	readonly plugin?: string;
	readonly observer: RestObserver<TClient>;
}

export interface RestObserveOptions {}

export type RestObserverDisposer = () => void;
