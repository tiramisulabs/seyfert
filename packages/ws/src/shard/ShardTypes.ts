import { GatewayPresenceUpdateData, GatewayReceivePayload } from '@biscuitland/common';
import { Logger } from '../SharedTypes';

export interface ShardGatewayConfig {
	/** The calculated intent value of the events which the shard should receive.
	 *
	 * @default 0
	 */
	intents: number;
	/** Identify properties to use */
	properties: {
		/** Operating system the shard runs on.
		 *
		 * @default "darwin" | "linux" | "windows"
		 */
		os: string;
		/** The "browser" where this shard is running on.
		 *
		 * @default "Biscuit"
		 */
		browser: string;
		/** The device on which the shard is running.
		 *
		 * @default "Biscuit"
		 */
		device: string;
	};
	/** Bot token which is used to connect to Discord */
	token: string;
	/** The URL of the gateway which should be connected to.
	 *
	 * @default "wss://gateway.discord.gg"
	 */
	url: string;
	/** The gateway version which should be used.
	 *
	 * @default 10
	 */
	version: number;
	/**
	 * The total number of shards to connect to across the entire bot.
	 * @default 1
	 */
	totalShards: number;

	presence?: GatewayPresenceUpdateData;
}

export interface ShardCreateOptions {
	/** The shard id */
	id: number;
	/** The connection details */
	connection: ShardGatewayConfig;
	/** The payload handlers for messages on the shard. */
	handlePayload: (shardId: number, data: GatewayReceivePayload) => Promise<unknown>;
	/** The handler to request a space to make an identify request. */
	requestIdentify?: () => Promise<void>;
	/** The handler to alert the gateway manager that this shard has received a READY event. */
	shardIsReady?: () => Promise<void>;
	logger: Logger;
}

export interface ShardHeart {
	/** Whether or not the heartbeat was acknowledged by Discord in time. */
	acknowledged: boolean;
	/** Interval between heartbeats requested by Discord. */
	interval: number;
	/** Id of the interval, which is used for sending the heartbeats. */
	intervalId?: NodeJS.Timer;
	/** Unix (in milliseconds) timestamp when the last heartbeat ACK was received from Discord. */
	lastAck?: number;
	/** Unix timestamp (in milliseconds) when the last heartbeat was sent. */
	lastBeat?: number;
	/** Round trip time (in milliseconds) from Shard to Discord and back.
	 * Calculated using the heartbeat system.
	 * Note: this value is undefined until the first heartbeat to Discord has happened.
	 */
	rtt?: number;
	/** Id of the timeout which is used for sending the first heartbeat to Discord since it's "special". */
	timeoutId?: NodeJS.Timeout;
}
