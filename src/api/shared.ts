import type { MakeRequired } from '../common';

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
