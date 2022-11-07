import type { DiscordGatewayPayload, DiscordGetGatewayBot, GatewayIntents, DiscordActivity } from '@biscuitland/api-types';

import type { ShardManager } from './services/shard-manager';
import type { Shard } from './services/shard';

/** ShardManager */

export type ShardManagerOptions = Pick<SMO, Exclude<keyof SMO, keyof typeof ShardManager.DEFAULTS>> & Partial<SMO>;

export interface SMO {
	/** Function for interpretation of messages from discord */
	handleDiscordPayload: (shard: Shard, payload: DiscordGatewayPayload) => unknown;

	/** Based on the information in Get Gateway */
	gateway: DiscordGetGatewayBot;

	/** Workers options */
	workers: ShardManagerWorkersOptions;

	/** Authentication */
	config: {
		intents?: GatewayIntents;
		token: string;
	};

	/** Presence on identify */
	makePresence?: {
		status: 'idle' | 'dnd' | 'online' | 'offline';
		afk: boolean;
		since: number | null;
		activities: DiscordActivity[];
	};

	/** Options shards */
	shards: ShardManagerShardsOptions;
}

export interface ShardManagerWorkersOptions {
	/**
	 * Number of shards per worker
	 * @default 25
	 */
	shards: number;

	/**
	 * Number of workers
	 * @default 5
	 */
	amount: number;

	/**
	 * Waiting time between workers
	 * @default 5000
	 */
	delay: number;
}

export interface ShardManagerShardsOptions {
	/**
	 * Waiting time to receive the ready event.
	 * @default 15000
	 */
	timeout: number;

	/**
	 * Waiting time between shards
	 * @default 5000
	 */
	delay: number;
}

/** Shard */

export type ShardOptions = Pick<SO, Exclude<keyof SO, keyof typeof Shard.DEFAULTS>> & Partial<SO>;

export interface SO {
	/** Shard Id */
	id: number;

	/** Based on the information in Get Gateway */
	gateway: DiscordGetGatewayBot;

	/** Options shards */
	shards: ShardManagerShardsOptions;

	/** Authentication */
	config: {
		intents?: GatewayIntents;
		token: string;
	};

	/** Presence on identify */
	presence?: ShardManagerOptions['makePresence'];

	/** Function for interpretation of messages from discord */
    handlePayloads: (shard: Shard, data: DiscordGatewayPayload) => Promise<void>;

	/** Notify the manager if the shard is ready. */
	handleIdentify: (id: number) => Promise<void>;
}

export type ShardStatus = 'Disconnected' | 'Handshaking' | 'Connecting' | 'Heartbeating' | 'Identifying' | 'Resuming' | 'Ready';
