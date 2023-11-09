import { APIGatewayBotInfo, GatewayDispatchPayload, GatewayIntentBits, Logger } from '@biscuitland/common';
import { IdentifyProperties, ShardState } from '../constants';

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
  /**
   * The payload handlers for messages on the shard.
   */
  handlePayload(shardId: number, packet: GatewayDispatchPayload): unknown;
  /**
   * wheter to send debug information to the console
   */
  debug?: boolean;
}

export interface ShardData {
  /** state */
  shardState: ShardState;

  /** resume seq to resume connections */
  resumeSeq: number | null;

  /**
   * resume_gateway_url is the url to resume the connection
   * @link https://discord.com/developers/docs/topics/gateway#ready-event
   */
  resume_gateway_url?: string;

  /**
   * session_id is the unique session id of the gateway
   * do not mistake with the biscuit client which is named Session
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
  logger: Logger;
  compress: boolean;
}

export enum ShardSocketCloseCodes {
  /** A regular Shard shutdown. */
  Shutdown = 3000,
  /** A resume has been requested and therefore the old connection needs to be closed. */
  ResumeClosingOldConnection = 3024,
  /** Did not receive a heartbeat ACK in time.
   * Closing the shard and creating a new session.
   */
  ZombiedConnection = 3010,
  /** Discordeno's gateway tests hae been finished, therefore the Shard can be turned off. */
  TestingFinished = 3064,
  /** Special close code reserved for Discordeno's zero-downtime resharding system. */
  Resharded = 3065,
  /** Shard is re-identifying therefore the old connection needs to be closed. */
  ReIdentifying = 3066
}
