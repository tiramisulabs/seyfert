"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerAdapter = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("../../common");
let parentPort;
class WorkerAdapter {
    workerData;
    isAsync = true;
    promises = new Map();
    constructor(workerData) {
        this.workerData = workerData;
        const worker_threads = (0, common_1.lazyLoadPackage)('node:worker_threads');
        if (worker_threads?.parentPort)
            parentPort = worker_threads.parentPort;
    }
    postMessage(body) {
        if (parentPort)
            return parentPort.postMessage(body);
        return process.send(body);
    }
    send(method, ...args) {
        const nonce = (0, node_crypto_1.randomUUID)();
        if (this.promises.has(nonce))
            return this.send(method, ...args);
        this.postMessage({
            type: 'CACHE_REQUEST',
            args,
            nonce,
            method,
            workerId: this.workerData.workerId,
        });
        return new Promise((res, rej) => {
            const timeout = setTimeout(() => {
                this.promises.delete(nonce);
                rej(new Error('Timeout cache request'));
            }, 60e3);
            this.promises.set(nonce, { resolve: res, timeout });
        });
    }
    scan(...rest) {
        return this.send('scan', ...rest);
    }
    bulkGet(...rest) {
        return this.send('bulkGet', ...rest);
    }
    get(...rest) {
        return this.send('get', ...rest);
    }
    bulkSet(...rest) {
        return this.send('bulkSet', ...rest);
    }
    set(...rest) {
        return this.send('set', ...rest);
    }
    bulkPatch(...rest) {
        return this.send('bulkPatch', ...rest);
    }
    patch(...rest) {
        return this.send('patch', ...rest);
    }
    values(...rest) {
        return this.send('values', ...rest);
    }
    keys(...rest) {
        return this.send('keys', ...rest);
    }
    count(...rest) {
        return this.send('count', ...rest);
    }
    bulkRemove(...rest) {
        return this.send('bulkRemove', ...rest);
    }
    remove(...rest) {
        return this.send('remove', ...rest);
    }
    flush() {
        return this.send('flush');
    }
    contains(...rest) {
        return this.send('contains', ...rest);
    }
    getToRelationship(...rest) {
        return this.send('getToRelationship', ...rest);
    }
    bulkAddToRelationShip(...rest) {
        return this.send('bulkAddToRelationShip', ...rest);
    }
    addToRelationship(...rest) {
        return this.send('addToRelationship', ...rest);
    }
    removeToRelationship(...rest) {
        return this.send('removeToRelationship', ...rest);
    }
    removeRelationship(...rest) {
        return this.send('removeRelationship', ...rest);
    }
}
exports.WorkerAdapter = WorkerAdapter;
