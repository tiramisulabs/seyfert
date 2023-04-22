import { APIGatewayBotInfo, GatewayReceivePayload } from '@biscuitland/common';
import { /**ShardEvents,*/ UpdateVoiceState } from '../SharedTypes';
import { MakeRequired } from '@biscuitland/common';

export interface CreateGatewayManagerOptions {
	/** Important data which is used by the manager to connect shards to the gateway. */
	connection: APIGatewayBotInfo;
	/**
	 * Id of the first Shard which should get controlled by this manager.
	 * @default 0
	 */
	firstShardId?: number;
	/**
	 * Id of the last Shard which should get controlled by this manager.
	 * @default 0
	 */
	lastShardId?: number;
	/**
	 * Delay in milliseconds to wait before spawning next shard. OPTIMAL IS ABOVE 5100. YOU DON'T WANT TO HIT THE RATE LIMIT!!!
	 * @default 5300
	 */
	spawnShardDelay?: number;
	/**
	 * Total amount of shards your bot uses. Useful for zero-downtime updates or resharding.
	 * @default 1
	 */
	totalShards?: number;
	/**
	 * The amount of shards to load per worker.
	 * @default 25
	 */
	shardsPerWorker?: number;
	/**
	 * The total amount of workers to use for your bot.
	 * @default 4
	 */
	totalWorkers?: number;
	/** The calculated intent value of the events which the shard should receive.
	 *
	 * @default 0
	 */
	intents?: number;
	/** Identify properties to use */
	properties?: {
		/** Operating system the shard runs on.
		 *
		 * @default "darwin" | "linux" | "windows"
		 */
		os: string;
		/** The "browser" where this shard is running on.
		 *
		 * @default "Discordeno"
		 */
		browser: string;
		/** The device on which the shard is running.
		 *
		 * @default "Discordeno"
		 */
		device: string;
	};
	/** Bot token which is used to connect to Discord */
	token: string;
	/** The URL of the gateway which should be connected to.
	 *
	 * @default "wss://gateway.discord.gg"
	 */
	url?: string;
	/** The gateway version which should be used.
	 *
	 * @default 10
	 */
	version?: number;
	/** The payload handlers for messages on the shard. */
	handlePayload: (shardId: number, data: GatewayReceivePayload) => Promise<unknown>;
	/** This managers cache related settings. */
	cache?: boolean;
	debug?: boolean;
}

export interface BucketData {
	workers: { id: number; queue: number[] }[];
	identifyRequest: ((value: void | PromiseLike<void>) => void)[];
}

export type JoinVoiceOptions = Omit<MakeRequired<Partial<UpdateVoiceState>, 'guild_id'>, 'channel_id'> & {
	channel_id: string;
};
