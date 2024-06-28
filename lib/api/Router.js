"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CDNRouter = exports.Router = exports.ProxyRequestMethod = void 0;
exports.parseCDNURL = parseCDNURL;
const common_1 = require("../common");
var ProxyRequestMethod;
(function (ProxyRequestMethod) {
    ProxyRequestMethod["Delete"] = "delete";
    ProxyRequestMethod["Get"] = "get";
    ProxyRequestMethod["Patch"] = "patch";
    ProxyRequestMethod["Post"] = "post";
    ProxyRequestMethod["Put"] = "put";
})(ProxyRequestMethod || (exports.ProxyRequestMethod = ProxyRequestMethod = {}));
const ArrRequestsMethods = Object.freeze(Object.values(ProxyRequestMethod));
class Router {
    rest;
    noop = () => {
        return;
    };
    constructor(rest) {
        this.rest = rest;
    }
    createProxy(route = []) {
        return new Proxy(this.noop, {
            get: (_, key) => {
                if (ArrRequestsMethods.includes(key)) {
                    return (...options) => this.rest.request(key.toUpperCase(), `/${route.join('/')}`, ...options);
                }
                return this.createProxy([...route, key]);
            },
            apply: (...[, _, args]) => {
                return this.createProxy([...route, ...args]);
            },
        });
    }
}
exports.Router = Router;
exports.CDNRouter = {
    createProxy(route = []) {
        const noop = () => {
            return;
        };
        return new Proxy(noop, {
            get: (_, key) => {
                if (key === 'get') {
                    return (value, options) => {
                        const lastRoute = `${common_1.CDN_URL}/${route.join('/')}`;
                        let routeResult = lastRoute;
                        if (typeof value === 'string' || typeof value === 'number') {
                            routeResult = `${lastRoute}${value ? `/${value}` : ''}`;
                            return parseCDNURL(routeResult, options);
                        }
                        return parseCDNURL(routeResult, value);
                    };
                }
                return this.createProxy([...route, key]);
            },
            apply: (...[, _, args]) => {
                return this.createProxy([...route, ...args]);
            },
        });
    },
};
function parseCDNURL(route, options = {}) {
    if (options.forceStatic && route.includes('a_'))
        options.extension = 'png';
    if (!options.extension && route.includes('a_'))
        options.extension = 'gif';
    const url = new URL(`${route}.${options.extension || 'png'}`);
    if (options.size)
        url.searchParams.set('size', `${options.size}`);
    return url.toString();
}
