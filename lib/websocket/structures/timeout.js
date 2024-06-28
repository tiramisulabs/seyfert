"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectQueue = exports.ConnectTimeout = void 0;
class ConnectTimeout {
    intervalTime;
    promises = [];
    interval = undefined;
    constructor(intervalTime = 5000) {
        this.intervalTime = intervalTime;
    }
    wait() {
        return new Promise(res => {
            if (!this.promises.length) {
                this.interval = setInterval(() => {
                    this.shift();
                }, this.intervalTime);
                res(true);
            }
            this.promises.push(res);
        });
    }
    shift() {
        this.promises.shift()?.(true);
        if (!this.promises.length) {
            clearInterval(this.interval);
            this.interval = undefined;
        }
    }
}
exports.ConnectTimeout = ConnectTimeout;
class ConnectQueue {
    intervalTime;
    concurrency;
    queue = [];
    interval = undefined;
    constructor(intervalTime = 5000, concurrency = 1) {
        this.intervalTime = intervalTime;
        this.concurrency = concurrency;
    }
    async push(callback) {
        this.queue.push({ cb: callback });
        if (this.queue.length === this.concurrency) {
            for (let i = 0; i < this.concurrency; i++) {
                await this.queue[i].cb?.();
                this.queue[i].cb = undefined;
            }
            this.interval = setInterval(() => {
                for (let i = 0; i < this.concurrency; i++) {
                    this.shift();
                }
            }, this.intervalTime);
        }
    }
    async shift() {
        const shift = this.queue.shift();
        if (!shift) {
            if (!this.queue.length) {
                clearInterval(this.interval);
                this.interval = undefined;
            }
            return;
        }
        if (!shift.cb)
            return this.shift();
        await shift.cb?.();
        if (!this.queue.length) {
            clearInterval(this.interval);
            this.interval = undefined;
        }
    }
}
exports.ConnectQueue = ConnectQueue;
