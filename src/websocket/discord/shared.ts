import type { InternalRuntimeConfig, InternalRuntimeConfigHTTP } from '../../client/base';
import type { Awaitable, DeepPartial, Logger } from '../../common';
import type {
	APIGatewayBotInfo,
	GatewayDispatchPayload,
	GatewayIntentBits,
	GatewayPresenceUpdateData,
	GatewaySendPayload,
} from '../../types';
import type { IdentifyProperties } from '../constants';
import type { WorkerMessages } from './worker';

export interface ShardDisconnectData {
	shardId: number;
	code: number;
	reason: string;
}

export interface ShardReconnectData {
	shardId: number;
}

export interface ShardManagerOptions extends ShardDetails {
	/** Important data which is used by the manager to connect shards to the gateway. */
	info: APIGatewayBotInfo;
	/**
	 * Delay in milliseconds to wait before spawning next shard. OPTIMAL IS ABOVE 5100. YOU DON'T WANT TO HIT THE RATE LIMIT!!!
	 * @default 5300
	 */
	spawnShardDelay?: number;
	/**
	 * Total amount of shards your bot uses. Useful for coordinated updates or resharding.
	 * @default 1
	 */
	totalShards?: number;
	shardStart?: number;
	shardEndExclusive?: number;
	/**
	 * The payload handlers for messages on the shard.
	 */
	handlePayload(shardId: number, packet: GatewayDispatchPayload): unknown;
	handleSendPayload?(
		shardId: number,
		payload: GatewaySendPayload,
	): Awaitable<GatewaySendPayload | null | undefined | void>;
	onShardDisconnect?(data: ShardDisconnectData): Awaitable<unknown>;
	onShardReconnect?(data: ShardReconnectData): Awaitable<unknown>;
	/**
	 * wheter to send debug information to the console
	 */
	debug?: boolean;
	/**
	 * Set a presence.
	 */
	presence?: (shardId: number) => GatewayPresenceUpdateData;

	compress?: boolean;
	resharding?: {
		/**
		 * @returns the gateway connection info
		 */
		getInfo(): Promise<APIGatewayBotInfo>;
		interval: number;
		percentage: number;
	};
	reconnectTimeout?: number;
	connectionTimeout?: number;
}

export interface CustomManagerAdapter {
	/**
	 * Declares that this adapter coordinates worker generations externally.
	 * WorkerManager disables its native total-shard resharder while this contract is active.
	 */
	readonly managesWorkerGenerations?: true;
	postMessage(workerId: number, body: unknown, context?: WorkerGenerationContext): Awaitable<unknown>;
	spawn(workerData: WorkerData, env: Record<string, any>): Awaitable<unknown>;
	/** Required when using WorkerManager's generation transition APIs. */
	terminate?(workerId: number, context?: WorkerGenerationContext): Awaitable<unknown>;
}

/** Identifies one physical allocation of a logical worker. */
export interface WorkerGenerationTarget {
	generation: number;
	allocationId: string;
}

/** A generation target together with its stable logical worker id. */
export interface WorkerGenerationContext extends WorkerGenerationTarget {
	workerId: number;
}

export type WorkerGenerationStatus =
	| 'preparing'
	| 'ready'
	| 'activating'
	| 'active'
	| 'draining'
	| 'drained'
	| 'aborting'
	| 'aborted';

export type WorkerGenerationReadiness = 'app' | 'shards' | 'ready' | 'cutover' | 'active' | 'drained' | 'aborted';

/** Read-only lifecycle state reported by WorkerManager. */
export interface WorkerGenerationState extends WorkerGenerationContext {
	status: WorkerGenerationStatus;
	appReady: boolean;
	shardsReady: boolean;
	/** The candidate is buffering dispatches for bounded replay during a healthy cutover. */
	cutoverReady: boolean;
	shadow: boolean;
}

/** Effective runtime shard topology resolved before WorkerManager creates any workers. */
export interface ResolvedWorkerShardTopology {
	readonly info: Readonly<
		Omit<APIGatewayBotInfo, 'session_start_limit'> & {
			readonly session_start_limit: Readonly<APIGatewayBotInfo['session_start_limit']>;
		}
	>;
	readonly totalShards: number;
	readonly shardStart: number;
	readonly shardEndExclusive: number;
	readonly shardsPerWorker: number;
	readonly workers: number;
}

interface WorkerManagerOptionsBase extends Omit<ShardManagerOptions, 'handlePayload' | 'presence' | 'properties'> {
	workers?: number;

	/**
	 * @default 16
	 */
	shardsPerWorker?: number;

	workerProxy?: boolean;

	/** @default 15000 */
	heartbeaterInterval?: number;

	handlePayload?(shardId: number, workerId: number, packet: GatewayDispatchPayload): any;

	presence?: (shardId: number, workerId: number) => GatewayPresenceUpdateData;

	handleWorkerMessage?(message: WorkerMessages): any;

	properties?: DeepPartial<NonNullable<ShardManagerOptions['properties']>>;

	getRC?(): Awaitable<InternalRuntimeConfig | InternalRuntimeConfigHTTP>;
}

export type WorkerManagerOptions =
	| (WorkerManagerOptionsBase & {
			mode?: 'threads';
			path: string;
			adapter?: CustomManagerAdapter;
	  })
	| (WorkerManagerOptionsBase & {
			mode: 'clusters';
			path: string;
			adapter?: CustomManagerAdapter;
	  })
	| (WorkerManagerOptionsBase & {
			mode: 'custom';
			adapter: CustomManagerAdapter;
			path?: string;
	  });

export interface ShardData {
	/** resume seq to resume connections */
	resume_seq: number | null;

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
	onShardDisconnect?(data: ShardDisconnectData): Awaitable<unknown>;
	onShardReconnect?(data: ShardReconnectData): Awaitable<unknown>;
	ratelimitOptions?: {
		maxRequestsPerRateLimitTick: number;
		rateLimitResetInterval: number;
	};
	debugger?: Logger;
	compress: boolean;
	presence?: GatewayPresenceUpdateData;
	reconnectTimeout?: number;
	connectionTimeout?: number;
}

export enum ShardSocketCloseCodes {
	Shutdown = 3000,
	ZombiedConnection = 3010,
	Reconnect = 3020,
	Resharding = 3030,
	ShutdownAll = 3040,
	Timeout = 3050,
}

export interface WorkerData {
	intents: number;
	token: string;
	path: string;
	shards: number[];
	totalShards: number;
	totalWorkers: number;
	mode: 'custom' | 'clusters' | 'threads';
	workerId: number;
	debug: boolean;
	workerProxy: boolean;
	info: APIGatewayBotInfo;
	compress: boolean;
	__USING_WATCHER__?: boolean;
	resharding: boolean;
	/** Physical generation of this logical worker. Omitted by legacy workers. */
	generation?: number;
	/** Unique allocation attempt within a generation. Omitted by legacy workers. */
	allocationId?: string;
	/** Keep gateway dispatch gated until the manager activates this allocation. */
	shadow?: boolean;
	/**
	 * Initial monotonic supervisor lease TTL. The worker exits unless ordered renewals from its local supervisor extend it.
	 * This is a secondary in-process watchdog and does not replace supervisor hard-kill or allocation lease fencing.
	 */
	supervisorTimeoutMs?: number;
	/** Same-host `process.hrtime` milliseconds captured by the local supervisor when the initial TTL was issued. */
	supervisorIssuedAtMonotonicMs?: number;
}
