export * from './client';

import {
	BaseClient,
	type BaseClientOptions,
	type InternalRuntimeConfig,
	type InternalRuntimeConfigHTTP,
	type RuntimeConfig,
	type RuntimeConfigHTTP,
} from './client/base';
import { resolveGatewayIntents } from './client/intents';
import { type Awaitable, isCloudflareWorker } from './common';
import type { ClientNameEvents, CustomEventsKeys, ResolveEventParams } from './events';

//
export * from './api';
export * from './builders';
export * from './cache';
//
export { Collection, LimitedCollection, type LimitedCollectionData } from './collection';
export * from './commands';
export {
	type AssignFilenameCallback,
	type BanOptions,
	type ChannelLink,
	type CustomizeLoggerCallback,
	createValidationMetadata,
	EmbedColors,
	Formatter,
	HeadingLevel,
	Logger,
	type LoggerOptions,
	LogLevels,
	type MessageLink,
	type OAuth2URLOptions,
	PermissionStrings,
	type PropWhen,
	SeyfertError,
	type SeyfertErrorCode,
	SeyfertErrorMessages,
	type StructPropState,
	type StructStates,
	type Timestamp,
	TimestampStyle,
} from './common';
export * from './components';
export * from './events';
export * from './langs';
//
export * from './structures';
export { GuildRole } from './structures/GuildRole';
export * from './types';
//
export { ShardManager, WorkerManager } from './websocket/discord';
export type { ShardData, ShardManagerOptions, WorkerData, WorkerManagerOptions } from './websocket/discord/shared';
export type { WorkerInfo, WorkerShardInfo } from './websocket/discord/worker';

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
	run: (...args: ResolveEventParams<E>) => Awaitable<unknown>;
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
			intents: resolveGatewayIntents(data.intents),
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
		if (isCloudflareWorker()) BaseClient._seyfertCfWorkerConfig = obj;
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
