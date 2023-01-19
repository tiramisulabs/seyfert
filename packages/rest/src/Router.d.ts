import type { RestAdapater } from '@biscuitland/common';
import type { Routes } from './Routes';
export declare enum RequestMethod {
    Delete = "delete",
    Get = "get",
    Patch = "patch",
    Post = "post",
    Put = "put"
}
export declare class Router<CustomRestAdapter extends RestAdapater<any>> {
    rest: CustomRestAdapter;
    noop: () => void;
    constructor(rest: CustomRestAdapter);
    createProxy<T extends CustomRestAdapter>(route?: string[]): Routes<T>;
}
