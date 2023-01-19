"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Router = exports.RequestMethod = void 0;
var RequestMethod;
(function (RequestMethod) {
    RequestMethod["Delete"] = "delete";
    RequestMethod["Get"] = "get";
    RequestMethod["Patch"] = "patch";
    RequestMethod["Post"] = "post";
    RequestMethod["Put"] = "put";
})(RequestMethod = exports.RequestMethod || (exports.RequestMethod = {}));
class Router {
    constructor(rest) {
        this.rest = rest;
        this.noop = () => {
            return;
        };
    }
    createProxy(route = []) {
        return new Proxy(this.noop, {
            get: (_, key) => {
                if (RequestMethod[key]) {
                    return (...options) => this.rest[key](route, ...options);
                }
                route.push(key);
                return this.createProxy(route);
            },
            apply: (...[, _, args]) => {
                route.push(...args.filter(x => x != null));
                return this.createProxy(route);
            },
        });
    }
}
exports.Router = Router;
