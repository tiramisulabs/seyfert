"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BiscuitREST = void 0;
const rest_1 = require("@discordjs/rest");
class BiscuitREST {
    constructor(options) {
        this.options = options;
        this.rest = new rest_1.REST(this.options);
    }
    async get(route, body, options) {
        const data = await this.rest.get(route, {
            ...options,
            ...body,
        });
        return data;
    }
    async post(route, body, options) {
        const data = await this.rest.post(route, {
            ...options,
            ...body,
        });
        return data;
    }
    async put(route, body, options) {
        const data = await this.rest.put(route, {
            ...options,
            ...body,
        });
        return data;
    }
    async patch(route, body, options) {
        const data = await this.rest.patch(route, {
            ...options,
            ...body,
        });
        return data;
    }
    async delete(route, body, options) {
        const data = await this.rest.delete(route, {
            ...options,
            ...body,
        });
        return data;
    }
    setToken(token = this.options.token) {
        if (!token || token?.length) {
            throw new Error('[REST] The token has not been provided');
        }
        this.rest.setToken(token);
        return this;
    }
}
exports.BiscuitREST = BiscuitREST;
