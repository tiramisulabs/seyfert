import type { RequestData } from '@discordjs/rest';
import { REST } from '@discordjs/rest';
import type { Identify, Tail, RestAdapater } from '@biscuitland/common';
import type { RequestMethod } from './Router';
export declare class BiscuitREST implements RestAdapater<BiscuitRESTOptions> {
    options: BiscuitRESTOptions;
    rest: REST;
    constructor(options: BiscuitRESTOptions);
    get<T>(route: string, body?: RequestBody, options?: RequestOptions): Promise<T>;
    post<T>(route: string, body?: RequestBody, options?: RequestOptions): Promise<T>;
    put<T>(route: string, body?: RequestBody, options?: RequestOptions): Promise<T>;
    patch<T>(route: string, body?: RequestBody, options?: RequestOptions): Promise<T>;
    delete<T>(route: string, body?: RequestBody, options?: RequestOptions): Promise<T>;
    setToken(token?: string | undefined): this;
}
export declare type BiscuitRESTOptions = Identify<ConstructorParameters<typeof REST>[0] & {
    token?: string;
}>;
export declare type RequestOptions = Pick<RequestData, 'passThroughBody' | 'query' | 'reason'>;
export declare type RequestBody = Pick<RequestData, 'files' | 'body'>;
export declare type RestArguments<RA extends RestAdapater<any>, M extends `${RequestMethod}`> = Tail<Parameters<RA[M]>>;
