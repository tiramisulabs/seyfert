import type { RequestData } from '@discordjs/rest';
import { REST } from '@discordjs/rest';
import type { Identify, Tail, RestAdapater } from '@biscuitland/common';
import type { RequestMethod } from './Router';

export interface BiscuitREST extends RestAdapater<BiscuitRESTOptions> {
	cRest: REST;
}

export class BiscuitREST {
	constructor(public options: BiscuitRESTOptions) {
		this.cRest= new REST(this.options);
	}

	async get<T>(
		route: string,
		body?: RequestBody,
		options?: RequestOptions
	): Promise<T> {
		const data = await this.cRest.get(route as `/${string}`, {
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
		const data = await this.cRest.post(route as `/${string}`, {
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
		const data = await this.cRest.put(route as `/${string}`, {
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
		const data = await this.cRest.patch(route as `/${string}`, {
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
		const data = await this.cRest.delete(route as `/${string}`, {
			...options,
			...body,
		});

		return data as T;
	}

	setToken(token = this.options.token): this {
		if (!token || token?.length) {
			throw new Error('[REST] The token has not been provided');
		}
		this.cRest.setToken(token);
		return this;
	}
}

export type BiscuitRESTOptions = Identify<
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
