export * from './client';

import {
	BaseClient,
	type BaseClientOptions,
	type InternalRuntimeConfig,
	type InternalRuntimeConfigHTTP,
	type RuntimeConfig,
	type RuntimeConfigHTTP,
} from './client/base';
import { isCloudfareWorker } from './common';
import type { ClientNameEvents, CustomEventsKeys, ResolveEventParams } from './events';
import { GatewayIntentBits } from './types';

//
export * from './api';
export * from './builders';
export * from './cache';
//
export { Collection, LimitedCollection } from './collection';
export * from './commands';
export { Formatter, Logger, PermissionStrings } from './common';
export * from './components';
export * from './events';
export * from './langs';
//
export * from './structures';
//
export { ShardManager, WorkerManager } from './websocket/discord';

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
export function createEvent<E extends ClientNameEvents | CustomEventsKeys>(data: {
	data: { name: E; once?: boolean };
	run: (...args: ResolveEventParams<E>) => any;
}) {
	data.data.once ??= false;
	return data;
}

export const config = {
	/**
	 * Configurations for the bot.
	 *
	 * @param data - The runtime configuration data for gateway connections.
	 * @returns The internal runtime configuration.
	 */
	bot(data: RuntimeConfig) {
		return {
			...data,
			intents:
				'intents' in data
					? typeof data.intents === 'number'
						? data.intents
						: (data.intents?.reduce<number>(
								(pr, acc) =>
									pr | (typeof acc === 'number' ? acc : GatewayIntentBits[acc as keyof typeof GatewayIntentBits]),
								0,
							) ?? 0)
					: 0,
		} as InternalRuntimeConfig;
	},
	/**
	 * Configurations for the HTTP server.
	 *
	 * @param data - The runtime configuration data for http server.
	 * @returns The internal runtime configuration for HTTP.
	 */
	http(data: RuntimeConfigHTTP) {
		const obj = {
			port: 8080,
			...data,
		} as InternalRuntimeConfigHTTP;
		if (isCloudfareWorker()) BaseClient._seyfertCfWorkerConfig = obj;
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
export function extendContext<T extends {}>(
	cb: (interaction: Parameters<NonNullable<BaseClientOptions['context']>>[0]) => T,
) {
	return cb;
}
