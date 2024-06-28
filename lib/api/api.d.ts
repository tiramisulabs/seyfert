import { Logger } from '../common';
import { type ProxyRequestMethod } from './Router';
import { Bucket } from './bucket';
import { type ApiHandlerInternalOptions, type ApiHandlerOptions, type ApiRequestOptions, type HttpMethods, type RawFile, type RequestHeaders } from './shared';
export declare class ApiHandler {
    #private;
    options: ApiHandlerInternalOptions;
    globalBlock: boolean;
    ratelimits: Map<string, Bucket>;
    readyQueue: (() => void)[];
    cdn: import("..").CDNRoute;
    debugger?: Logger;
    workerPromises?: Map<string, {
        resolve: (value: any) => any;
        reject: (error: any) => any;
    }>;
    constructor(options: ApiHandlerOptions);
    globalUnblock(): void;
    request<T = any>(method: HttpMethods, url: `/${string}`, { auth, ...request }?: ApiRequestOptions): Promise<T>;
    parseError(response: Response, result: unknown): Error;
    handle50X(method: HttpMethods, url: `/${string}`, request: ApiRequestOptions, next: () => void): Promise<any>;
    handle429(route: string, method: HttpMethods, url: `/${string}`, request: ApiRequestOptions, response: Response, result: any, next: () => void, reject: (err: unknown) => void, now: number): Promise<any>;
    clearResetInterval(route: string): void;
    setResetBucket(route: string, resp: Response, now: number, headerNow: number): void;
    setRatelimitsBucket(route: string, resp: Response): void;
    parseRequest(options: {
        url: string;
        headers: RequestHeaders;
        request: ApiRequestOptions;
    }): {
        data: string | FormData | undefined;
        finalUrl: `/${string}`;
    };
    routefy(url: string, method: HttpMethods): `/${string}`;
}
export type RequestOptions = Pick<ApiRequestOptions, 'reason' | 'auth' | 'appendToFormData'>;
export type RequestObject<M extends ProxyRequestMethod, B = Record<string, any>, Q = Record<string, any>, F extends RawFile[] = RawFile[]> = {
    query?: Q;
} & RequestOptions & (M extends `${ProxyRequestMethod.Get}` ? unknown : {
    body?: B;
    files?: F;
});
export type RestArguments<M extends ProxyRequestMethod, B = any, Q extends never | Record<string, any> = any, F extends RawFile[] = RawFile[]> = M extends ProxyRequestMethod.Get ? Q extends never ? RequestObject<M, never, B, never> : never : RequestObject<M, B, Q, F>;
