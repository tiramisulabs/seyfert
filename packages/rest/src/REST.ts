import type { RequestData } from '@discordjs/rest';
import { REST } from '@discordjs/rest';
import type { Identify, Tail } from '@biscuitland/common';
import type { RequestMethod } from './Router';
export class BiscuitREST {
	api: REST;
	constructor(public options: BiscuitRESTOptions) {
		const { token, ...restOptions } = this.options;
		this.api = new REST(restOptions).setToken(token);
	}

	async get<T>(route: string, options?: RequestOptions): Promise<T> {
		const data = await this.api.get(route as `/${string}`, {
			...options
		});

		return data as T;
	}

	async post<T>(route: string, body?: RequestBody, options?: RequestOptions): Promise<T> {
		const data = await this.api.post(route as `/${string}`, {
			...options,
			...body
		});

		return data as T;
	}

	async put<T>(route: string, body?: RequestBody, options?: RequestOptions): Promise<T> {
		const data = await this.api.put(route as `/${string}`, {
			...options,
			...body
		});

		return data as T;
	}

	async patch<T>(route: string, body?: RequestBody, options?: RequestOptions): Promise<T> {
		const data = await this.api.patch(route as `/${string}`, {
			...options,
			...body
		});

		return data as T;
	}

	async delete<T>(route: string, options?: RequestOptions): Promise<T> {
		const data = await this.api.delete(route as `/${string}`, {
			...options
		});

		return data as T;
	}
}

export type BiscuitRESTOptions = Identify<ConstructorParameters<typeof REST>[0] & { token: string }>;

export type RequestOptions = Pick<RequestData, 'passThroughBody' | 'query' | 'reason'>;

export type RequestBody = Pick<RequestData, 'files' | 'body'>;

export type RestArguments<RA extends BiscuitREST, M extends `${RequestMethod}`> = Tail<Parameters<RA[M]>>;
