"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseSocket = void 0;
const node_crypto_1 = require("node:crypto");
const ws_1 = __importDefault(require("ws"));
class BaseSocket {
    internal;
    constructor(kind, url) {
        this.internal = kind === 'ws' ? new ws_1.default(url) : new WebSocket(url);
    }
    set onopen(callback) {
        this.internal.onopen = callback;
    }
    set onmessage(callback) {
        this.internal.onmessage = callback;
    }
    set onclose(callback) {
        this.internal.onclose = callback;
    }
    set onerror(callback) {
        this.internal.onerror = callback;
    }
    send(data) {
        return this.internal.send(data);
    }
    close(...args) {
        // @ts-expect-error
        return this.internal.close(...args);
    }
    async ping() {
        if (!('ping' in this.internal))
            throw new Error('Unexpected: Method ping not implemented');
        return new Promise(res => {
            const nonce = (0, node_crypto_1.randomUUID)();
            const start = performance.now();
            const listener = (data) => {
                if (data.toString() !== nonce)
                    return;
                this.internal.removeListener('pong', listener);
                res(performance.now() - start);
            };
            this.internal.on('pong', listener);
            this.internal.ping(nonce);
        });
    }
    get readyState() {
        return this.internal.readyState;
    }
}
exports.BaseSocket = BaseSocket;
