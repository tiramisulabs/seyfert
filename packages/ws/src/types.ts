import type { APIGatewayBotInfo, GatewayReceivePayload, GatewayIntentBits } from 'discord-api-types/v10';

import type { ShardManager } from './services/shard-manager';
import type { Shard } from './services/shard';

/** ShardManager */

export type ShardManagerOptions = Pick<SMO, Exclude<keyof SMO, keyof typeof ShardManager.DEFAULTS>> & Partial<SMO>;

export interface SMO {
	/** Function for interpretation of messages from discord */
	handleDiscordPayload: (shard: Shard, payload: GatewayReceivePayload) => unknown;

	/** Based on the information in Get Gateway */
	gateway: APIGatewayBotInfo;

	/** Workers options */
	workers: ShardManagerWorkersOptions;

	/** Authentication */
	config: {
		intents?: GatewayIntentBits;
		token: string;
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
	gateway: APIGatewayBotInfo;

	/** Options shards */
	shards: ShardManagerShardsOptions;

	/** Authentication */
	config: {
		intents?: GatewayIntentBits;
		token: string;
	};

	/** Function for interpretation of messages from discord */
    handlePayloads: (shard: Shard, data: GatewayReceivePayload) => Promise<void>;

	/** Notify the manager if the shard is ready. */
	handleIdentify: (id: number) => Promise<void>;
}

export type ShardStatus = 'Disconnected' | 'Handshaking' | 'Connecting' | 'Heartbeating' | 'Identifying' | 'Resuming' | 'Ready';

export type PickPartial<T, K extends keyof T> = {
	[P in keyof T]?: T[P] | undefined;
} & { [P in K]: T[P] };
