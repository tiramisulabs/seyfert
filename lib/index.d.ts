import { type BaseClientOptions, type InternalRuntimeConfig, type InternalRuntimeConfigHTTP, type RuntimeConfig, type RuntimeConfigHTTP } from './client/base';
import type { CustomEventsKeys, ClientNameEvents, EventContext } from './events';
export { Logger, PermissionStrings, Watcher, Formatter } from './common';
export { Collection, LimitedCollection } from './collection';
export * from './api';
export * from './builders';
export * from './cache';
export * from './commands';
export * from './components';
export * from './events';
export * from './langs';
export { ShardManager, WorkerManager } from './websocket/discord';
export * from './structures';
export * from './client';
export declare function throwError(msg: string): never;
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
export declare function createEvent<E extends ClientNameEvents | CustomEventsKeys>(data: {
    data: {
        name: E;
        once?: boolean;
    };
    run: (...args: EventContext<{
        data: {
            name: E;
        };
    }>) => any;
}): {
    data: {
        name: E;
        once?: boolean;
    };
    run: (...args: EventContext<{
        data: {
            name: E;
        };
    }>) => any;
};
export declare const config: {
    /**
     * Configurations for the bot.
     *
     * @param data - The runtime configuration data for gateway connections.
     * @returns The internal runtime configuration.
     */
    bot(data: RuntimeConfig): InternalRuntimeConfig;
    /**
     * Configurations for the HTTP server.
     *
     * @param data - The runtime configuration data for http server.
     * @returns The internal runtime configuration for HTTP.
     */
    http(data: RuntimeConfigHTTP): InternalRuntimeConfigHTTP;
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
export declare function extendContext<T extends {}>(cb: (interaction: Parameters<NonNullable<BaseClientOptions['context']>>[0]) => T): (interaction: Parameters<NonNullable<BaseClientOptions["context"]>>[0]) => T;
