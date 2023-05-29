import type { RawFile, RequestData } from '@discordjs/rest';
import { REST } from '@discordjs/rest';
import type { Identify } from '@biscuitland/common';
import type { RequestMethod } from './Router';
export class BiscuitREST {
  api: REST;
  constructor(public options: BiscuitRESTOptions) {
    const { token, ...restOptions } = this.options;
    this.api = new REST(restOptions).setToken(token);
  }

  async get<T>(route: string, options?: RequestObject<RequestMethod.Get>): Promise<T> {
    const data = await this.api.get(route as `/${string}`, {
      ...options,
      query: options?.query ? new URLSearchParams(options.query) : undefined
    });

    return data as T;
  }

  async post<T>(route: string, body?: RequestObject<RequestMethod.Post>): Promise<T> {
    const data = await this.api.post(route as `/${string}`, {
      ...body,
      body: body?.body,
      query: body?.query ? new URLSearchParams(body.query) : undefined,
      files: body?.files
    });

    return data as T;
  }

  async put<T>(route: string, body?: RequestObject<RequestMethod.Put>): Promise<T> {
    const data = await this.api.put(route as `/${string}`, {
      ...body,
      body: body?.body,
      query: body?.query ? new URLSearchParams(body.query) : undefined,
      files: body?.files
    });

    return data as T;
  }

  async patch<T>(route: string, body?: RequestObject<RequestMethod.Patch>): Promise<T> {
    const data = await this.api.patch(route as `/${string}`, {
      ...body,
      body: body?.body,
      query: body?.query ? new URLSearchParams(body.query) : undefined,
      files: body?.files
    });

    return data as T;
  }

  async delete<T>(route: string, options?: RequestObject<RequestMethod.Delete>): Promise<T> {
    const data = await this.api.delete(route as `/${string}`, {
      ...options,
      query: options?.query ? new URLSearchParams(options.query) : undefined
    });

    return data as T;
  }
}

export type BiscuitRESTOptions = Identify<ConstructorParameters<typeof REST>[0] & { token: string }>;

export type RequestOptions = Pick<RequestData, 'passThroughBody' | 'reason'>;

export type RequestObject<M extends RequestMethod, B = Record<string, any>, Q = Record<string, any>> = {
  query?: Q;
} & RequestOptions &
  (M extends `${RequestMethod.Get}`
    ? unknown
    : {
        body?: B;
        files?: RawFile[];
      });

export type RestArguments<M extends RequestMethod, B = any, Q extends never | Record<string, any> = any> = M extends RequestMethod.Get
  ? Q extends never
    ? RequestObject<M, never, B>
    : never
  : RequestObject<M, B, Q>;
