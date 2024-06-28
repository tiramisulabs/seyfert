import type { APIRoutes, ApiHandler, CDNRoute } from './index';
import type { ImageExtension, ImageSize, StickerExtension } from './shared';
export declare enum ProxyRequestMethod {
    Delete = "delete",
    Get = "get",
    Patch = "patch",
    Post = "post",
    Put = "put"
}
export declare class Router {
    private rest;
    noop: () => void;
    constructor(rest: ApiHandler);
    createProxy(route?: string[]): APIRoutes;
}
export declare const CDNRouter: {
    createProxy(route?: string[]): CDNRoute;
};
export interface BaseCDNUrlOptions {
    extension?: ImageExtension | StickerExtension | undefined;
    size?: ImageSize;
}
export interface CDNUrlOptions extends BaseCDNUrlOptions {
    forceStatic?: boolean;
}
export declare function parseCDNURL(route: string, options?: CDNUrlOptions): string;
