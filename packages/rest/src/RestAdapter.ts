import type { RequestData } from '@discordjs/rest';
import { REST } from '@discordjs/rest';
import type { Identify, Tail } from '@biscuitland/common';
import type { RequestMethod } from './Router';

export interface RestAdapater<AdapterOptions> {
	options: AdapterOptions;

	get<T>(route: string, data?: unknown, options?: any): Promise<T>;

	post<T>(route: string, data?: unknown, options?: any): Promise<T>;

	put<T>(route: string, data?: unknown, options?: any): Promise<T>;

	delete<T>(route: string, data?: unknown, options?: any): Promise<T>;

	patch<T>(route: string, data?: unknown, options?: any): Promise<T>;

	setToken(token?: string): this;
}

export class DefaultRestAdapter
	implements RestAdapater<DefaultRestAdapterOptions> {
	rest: REST;
	constructor(public options: DefaultRestAdapterOptions) {
		this.rest = new REST(this.options);
	}

	async get<T>(
		route: string,
		body?: RequestBody,
		options?: RequestOptions
	): Promise<T> {
		const data = await this.rest.get(route as `/${string}`, {
			...options,
			...body,
		});

		return data as T;
	}

	async post<T>(
		route: string,
		body?: RequestBody,
		options?: RequestOptions
	): Promise<T> {
		const data = await this.rest.post(route as `/${string}`, {
			...options,
			...body,
		});

		return data as T;
	}

	async put<T>(
		route: string,
		body?: RequestBody,
		options?: RequestOptions
	): Promise<T> {
		const data = await this.rest.put(route as `/${string}`, {
			...options,
			...body,
		});

		return data as T;
	}

	async patch<T>(
		route: string,
		body?: RequestBody,
		options?: RequestOptions
	): Promise<T> {
		const data = await this.rest.patch(route as `/${string}`, {
			...options,
			...body,
		});

		return data as T;
	}

	async delete<T>(
		route: string,
		body?: RequestBody,
		options?: RequestOptions
	): Promise<T> {
		const data = await this.rest.delete(route as `/${string}`, {
			...options,
			...body,
		});

		return data as T;
	}

	setToken(token = this.options.token): this {
		if (!token || token?.length) {
			throw new Error('[REST] The token has not been provided');
		}
		this.rest.setToken(token);
		return this;
	}
}

export type DefaultRestAdapterOptions = Identify<
	ConstructorParameters<typeof REST>[0] & { token?: string }
>;

export type RequestOptions = Pick<
	RequestData,
	'passThroughBody' | 'query' | 'reason'
>;

export type RequestBody = Pick<RequestData, 'files' | 'body'>;

export type RestArguments<
	RA extends RestAdapater<any>,
	M extends `${RequestMethod}`
> = Tail<Parameters<RA[M]>>;
