"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Collectors = void 0;
const node_crypto_1 = require("node:crypto");
const node_console_1 = require("node:console");
class Collectors {
    values = new Map();
    generateRandomUUID(name) {
        const collectors = this.values.get(name);
        if (!collectors)
            return '*';
        let nonce = (0, node_crypto_1.randomUUID)();
        while (collectors.find(x => x.nonce === nonce)) {
            nonce = (0, node_crypto_1.randomUUID)();
        }
        return nonce;
    }
    create(options) {
        const nonce = this.generateRandomUUID(options.event);
        if (!this.values.has(options.event)) {
            this.values.set(options.event, []);
        }
        this.values.get(options.event).push({
            options: {
                ...options,
                name: options.event,
            },
            idle: options.idle && options.idle > 0
                ? setTimeout(() => {
                    return this.delete(options.event, nonce, 'idle');
                }, options.idle)
                : undefined,
            timeout: options.timeout && options.timeout > 0
                ? setTimeout(() => {
                    return this.delete(options.event, nonce, 'timeout');
                }, options.timeout)
                : undefined,
            nonce,
        });
        return options;
    }
    async delete(name, nonce, reason = 'unknown') {
        const collectors = this.values.get(name);
        if (!collectors?.length) {
            if (collectors)
                this.values.delete(name);
            return;
        }
        const index = collectors.findIndex(x => x.nonce === nonce);
        if (index === -1)
            return;
        const collector = collectors[index];
        clearTimeout(collector.idle);
        clearTimeout(collector.timeout);
        collectors.splice(index, 1);
        try {
            await collector.options.onStop?.(reason);
        }
        catch (e) {
            await collector.options.onStopError?.(reason, node_console_1.error);
        }
    }
    /**@internal */
    async run(name, data) {
        const collectors = this.values.get(name);
        if (!collectors)
            return;
        for (const i of collectors) {
            if (await i.options.filter(data)) {
                i.idle?.refresh();
                const stop = (reason = 'unknown') => {
                    return this.delete(i.options.event, i.nonce, reason);
                };
                try {
                    await i.options.run(data, stop);
                }
                catch (e) {
                    await i.options.onRunError?.(data, e, stop);
                }
                break;
            }
        }
    }
}
exports.Collectors = Collectors;
