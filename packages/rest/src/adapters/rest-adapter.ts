export interface RestRequest {
	url: string;
	method: RequestMethod;
	reject: (payload: RestRequestRejection) => unknown;
	resolve: (payload: RestRequestResponse) => unknown;
}

export interface RestRequestResponse {
	ok: boolean;
	status: number;
	body?: string;
}

export interface RestRequestRejection extends RestRequestResponse {
	error: string;
}

export interface RestPayload {
	bucketId?: string;
	body?: Record<string, unknown>;
	retryCount: number;
	headers?: Record<string, string>;
}

export interface RestRateLimitedPath {
	url: string;
	resetTimestamp: number;
	bucketId?: string;
}

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface RestSendRequestOptions {
	url: string;
	method: RequestMethod;
	bucketId?: string;
	reject?: CallableFunction;
	resolve?: CallableFunction;
	retryCount?: number;
	payload?: {
		headers: Record<string, string>;
		body: string | FormData;
	};
}

export interface CreateRequestBodyOptions {
	headers?: Record<string, string>;
	method: RequestMethod;
	body?: Record<string, unknown>;
	unauthorized?: boolean;
}

export interface RestAdapter {
	options: any;

	/**
	 * @inheritDoc
	 */

	get<T>(
		route: string,
		data?: unknown,
		options?: {
			retryCount?: number;
			bucketId?: string;
			headers?: Record<string, string>;
		}
	): Promise<T>;

	/**
	 * @inheritDoc
	 */

	put<T>(
		router: string,
		data: unknown,
		options?: {
			retryCount?: number;
			bucketId?: string;
			headers?: Record<string, string>;
		}
	): Promise<T>;

	/**
	 * @inheritDoc
	 */

	post<T>(
		router: string,
		data: unknown,
		options?: {
			retryCount?: number;
			bucketId?: string;
			headers?: Record<string, string>;
		}
	): Promise<T>;

	/**
	 * @inheritDoc
	 */

	patch<T>(
		router: string,
		data: unknown,
		options?: {
			retryCount?: number;
			bucketId?: string;
			headers?: Record<string, string>;
		}
	): Promise<T>;

	/**
	 * @inheritDoc
	 */

	delete<T>(
		router: string,
		data: unknown,
		options?: {
			retryCount?: number;
			bucketId?: string;
			headers?: Record<string, string>;
		}
	): Promise<T>;
}
