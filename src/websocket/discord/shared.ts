import type {
	APIGatewayBotInfo,
	GatewayDispatchPayload,
	GatewayIntentBits,
	GatewayPresenceUpdateData,
} from 'discord-api-types/v10';
import type { Logger } from '../../common';
import type { IdentifyProperties } from '../constants';

export interface ShardManagerOptions extends ShardDetails {
	/** Important data which is used by the manager to connect shards to the gateway. */
	info: APIGatewayBotInfo;
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
	shardStart?: number;
	shardEnd?: number;
	/**
	 * The payload handlers for messages on the shard.
	 */
	handlePayload(shardId: number, packet: GatewayDispatchPayload): unknown;
	/**
	 * wheter to send debug information to the console
	 */
	debug?: boolean;
	/**
	 * Set a presence.
	 */
	presence?: (shardId: number, workerId: number) => GatewayPresenceUpdateData;

	compress?: boolean;
}

export interface WorkerManagerOptions extends Omit<ShardManagerOptions, 'handlePayload'> {
	mode: 'threads' | 'clusters';

	workers?: number;

	/**
	 * @default 32
	 */
	shardsPerWorker?: number;

	workerProxy?: boolean;

	path: string;

	handlePayload(shardId: number, workerId: number, packet: GatewayDispatchPayload): unknown;
}

export interface ShardData {
	/** resume seq to resume connections */
	resumeSeq: number | null;

	/**
	 * resume_gateway_url is the url to resume the connection
	 * @link https://discord.com/developers/docs/topics/gateway#ready-event
	 */
	resume_gateway_url?: string;

	/**
	 * session_id is the unique session id of the gateway
	 * do not mistake with the seyfert client which is named Client
	 */
	session_id?: string;
}

export interface ShardDetails {
	/** Bot token which is used to connect to Discord */
	token: string;
	/**
	 * The URL of the gateway which should be connected to.
	 * @default "wss://gateway.discord.gg"
	 */
	url?: string;
	/**
	 * The gateway version which should be used.
	 * @default 10
	 */
	version?: number;
	/**
	 * The calculated intent value of the events which the shard should receive.
	 */
	intents: GatewayIntentBits | number;
	/**
	 * Identify properties to use
	 */
	properties?: IdentifyProperties;
}

export interface ShardOptions extends ShardDetails {
	info: APIGatewayBotInfo;
	handlePayload(shardId: number, packet: GatewayDispatchPayload): unknown;
	ratelimitOptions?: {
		maxRequestsPerRateLimitTick: number;
		rateLimitResetInterval: number;
	};
	debugger?: Logger;
	compress: boolean;
	presence?: GatewayPresenceUpdateData;
}

export enum ShardSocketCloseCodes {
	Shutdown = 3000,
	ZombiedConnection = 3010,
}

export interface WorkerData {
	intents: number;
	token: string;
	path: string;
	shards: number[];
	workerId: number;
	debug: boolean;
	workerProxy: boolean;
	__USING_WATCHER__?: boolean;
}
