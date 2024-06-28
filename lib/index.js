"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.WorkerManager = exports.ShardManager = exports.LimitedCollection = exports.Collection = exports.Formatter = exports.Watcher = exports.Logger = void 0;
exports.throwError = throwError;
exports.createEvent = createEvent;
exports.extendContext = extendContext;
const v10_1 = require("discord-api-types/gateway/v10");
const base_1 = require("./client/base");
const common_1 = require("./common");
var common_2 = require("./common");
Object.defineProperty(exports, "Logger", { enumerable: true, get: function () { return common_2.Logger; } });
Object.defineProperty(exports, "Watcher", { enumerable: true, get: function () { return common_2.Watcher; } });
Object.defineProperty(exports, "Formatter", { enumerable: true, get: function () { return common_2.Formatter; } });
//
var collection_1 = require("./collection");
Object.defineProperty(exports, "Collection", { enumerable: true, get: function () { return collection_1.Collection; } });
Object.defineProperty(exports, "LimitedCollection", { enumerable: true, get: function () { return collection_1.LimitedCollection; } });
//
__exportStar(require("./api"), exports);
__exportStar(require("./builders"), exports);
__exportStar(require("./cache"), exports);
__exportStar(require("./commands"), exports);
__exportStar(require("./components"), exports);
__exportStar(require("./events"), exports);
__exportStar(require("./langs"), exports);
//
var discord_1 = require("./websocket/discord");
Object.defineProperty(exports, "ShardManager", { enumerable: true, get: function () { return discord_1.ShardManager; } });
Object.defineProperty(exports, "WorkerManager", { enumerable: true, get: function () { return discord_1.WorkerManager; } });
//
__exportStar(require("./structures"), exports);
//
__exportStar(require("./client"), exports);
///
function throwError(msg) {
    throw new Error(msg);
}
/**
 * Creates an event with the specified data and run function.
 *
 * @param data - The event data.
 * @returns The created event.
 *
 * @example
 * const myEvent = createEvent({
 *   data: { name: 'ready', once: true },
 *   run: (user, client, shard) => {
 *     client.logger.info(`Start ${user.username} on shard #${shard}`);
 *   }
 * });
 */
function createEvent(data) {
    data.data.once ??= false;
    return data;
}
exports.config = {
    /**
     * Configurations for the bot.
     *
     * @param data - The runtime configuration data for gateway connections.
     * @returns The internal runtime configuration.
     */
    bot(data) {
        return {
            ...data,
            intents: 'intents' in data
                ? typeof data.intents === 'number'
                    ? data.intents
                    : data.intents?.reduce((pr, acc) => pr | (typeof acc === 'number' ? acc : v10_1.GatewayIntentBits[acc]), 0) ?? 0
                : 0,
        };
    },
    /**
     * Configurations for the HTTP server.
     *
     * @param data - The runtime configuration data for http server.
     * @returns The internal runtime configuration for HTTP.
     */
    http(data) {
        const obj = {
            port: 8080,
            ...data,
        };
        if ((0, common_1.isCloudfareWorker)())
            base_1.BaseClient._seyfertConfig = obj;
        return obj;
    },
};
/**
 * Extends the context of a command interaction.
 *
 * @param cb - The callback function to extend the context.
 * @returns The extended context.
 *
 * @example
 * const customContext = extendContext((interaction) => {
 * 	return {
 * 		owner: '123456789012345678',
 * 		// Add your custom properties here
 * 	};
 * });
 */
function extendContext(cb) {
    return cb;
}
