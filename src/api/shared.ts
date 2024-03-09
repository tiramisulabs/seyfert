export * from './api';
export * from './utils/constants';
export * from './utils/types';
export { calculateUserDefaultAvatarIndex } from './utils/utils';

export interface ApiHandlerOptions {
	baseUrl: string;
	domain: string;
	token: string;
	debug?: boolean;
	agent?: string;
	smartBucket?: boolean;
}

export interface ApiHandlerInternalOptions extends ApiHandlerOptions {
	userAgent: string;
}

export interface RawFile {
	contentType?: string;
	data: Buffer | Uint8Array | boolean | number | string;
	key?: string;
	name: string;
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
}

export type HttpMethods = 'GET' | 'DELETE' | 'PUT' | 'POST' | 'PATCH';
