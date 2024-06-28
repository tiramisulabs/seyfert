"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Base = void 0;
const api_1 = require("../../api");
const common_1 = require("../../common");
/** */
class Base {
    constructor(client) {
        Object.assign(this, { client });
    }
    /**@internal */
    get rest() {
        return this.client.rest;
    }
    /**@internal */
    get cache() {
        return this.client.cache;
    }
    /**@internal */
    get api() {
        const rest = this.rest;
        return api_1.Router.prototype.createProxy.call({
            rest,
            noop: () => {
                return;
            },
            createProxy(route) {
                return api_1.Router.prototype.createProxy.call({ ...this, rest }, route);
            },
        });
    }
    /**@internal */
    __patchThis(data) {
        Object.assign(this, (0, common_1.toCamelCase)(data));
        return this;
    }
    client;
}
exports.Base = Base;
