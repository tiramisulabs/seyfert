import type { LogDepth, LogLevels } from '@discordeno/utils';
import { Shard } from './shard/Shard';
import type {
	GatewayPresenceUpdateData,
	PresenceUpdateStatus,
	ActivityType,
	GatewayActivity,
	GatewayOpcodes,
	GatewayReceivePayload,
	APIGuildMember,
	GatewayRequestGuildMembersDataWithQuery,
	GatewayRequestGuildMembersDataWithUserIds
} from '@biscuitland/common';

export enum ShardState {
	/** Shard is fully connected to the gateway and receiving events from Discord. */
	Connected = 0,
	/** Shard started to connect to the gateway. This is only used if the shard is not currently trying to identify or resume. */
	Connecting = 1,
	/** Shard got disconnected and reconnection actions have been started. */
	Disconnected = 2,
	/** The shard is connected to the gateway but only heartbeating. At this state the shard has not been identified with discord. */
	Unidentified = 3,
	/** Shard is trying to identify with the gateway to create a new session. */
	Identifying = 4,
	/** Shard is trying to resume a session with the gateway. */
	Resuming = 5,
	/** Shard got shut down studied or due to a not (self) fixable error and may not attempt to reconnect on its own. */
	Offline = 6
}

export interface ShardEvents {
	/** A heartbeat has been send. */
	heartbeat?: (shard: Shard) => unknown;
	/** A heartbeat ACK was received. */
	heartbeatAck?: (shard: Shard) => unknown;
	/** Shard has received a Hello payload. */
	hello?: (shard: Shard) => unknown;
	/** The Shards session has been invalidated. */
	invalidSession?: (shard: Shard, resumable: boolean) => unknown;
	/** The shard has started a resume action. */
	resuming?: (shard: Shard) => unknown;
	/** The shard has successfully resumed an old session. */
	resumed?: (shard: Shard) => unknown;
	/** Discord has requested the Shard to reconnect. */
	requestedReconnect?: (shard: Shard) => unknown;
	/** The shard started to connect to Discord's gateway. */
	connecting?: (shard: Shard) => unknown;
	/** The shard is connected with Discord's gateway. */
	connected?: (shard: Shard) => unknown;
	/** The shard has been disconnected from Discord's gateway. */
	disconnected?: (shard: Shard) => unknown;
	/** The shard has started to identify itself to Discord. */
	identifying?: (shard: Shard) => unknown;
	/** The shard has successfully been identified itself with Discord. */
	identified?: (shard: Shard) => unknown;
	/** The shard has received a message from Discord. */
	message?: (shard: Shard, payload: GatewayReceivePayload) => unknown;
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

export interface ShardSocketRequest {
	/** The OP-Code for the payload to send. */
	op: GatewayOpcodes;
	/** Payload data. */
	d: unknown;
}

/** https://discord.com/developers/docs/topics/gateway-events#update-presence */
export interface BotStatusUpdate {
	// /** Unix time (in milliseconds) of when the client went idle, or null if the client is not idle */
	since: number | null;
	/** The user's activities */
	activities: BotActivity[];
	/** The user's new status */
	status: `${PresenceUpdateStatus}`;
}

/** https://discord.com/developers/docs/topics/gateway-events#activity-object */
export interface BotActivity {
	name: string;
	type: ActivityType;
	url?: string;
}

/** https://discord.com/developers/docs/topics/gateway#update-voice-state */
export interface UpdateVoiceState {
	/** id of the guild */
	guild_id: string;
	/** id of the voice channel client wants to join (null if disconnecting) */
	channel_id: string | null;
	/** Is the client muted */
	self_mute: boolean;
	/** Is the client deafened */
	self_deaf: boolean;
}

/** https://discord.com/developers/docs/topics/gateway-events#update-presence */
export interface StatusUpdate {
	// /** Unix time (in milliseconds) of when the client went idle, or null if the client is not idle */
	// since: number | null;
	/** The user's activities */
	activities?: Omit<GatewayActivity, 'created_at'>[];
	/** The user's new status */
	status: PresenceUpdateStatus;
	// /** Whether or not the client is afk */
	// afk: boolean;
}

export type BigString = bigint | string;

export type ShardStatusUpdate = Pick<GatewayPresenceUpdateData, 'activities' | 'status'>;

export interface RequestGuildMembersOptions
	extends GatewayRequestGuildMembersDataWithQuery,
		GatewayRequestGuildMembersDataWithUserIds {}

export interface GatewayMemberRequest {
	/** The unique nonce for this request. */
	nonce: string;
	/** The resolver handler to run when all members arrive. */
	resolve: (value: APIGuildMember[] | PromiseLike<APIGuildMember[]>) => void;
	/** The members that have already arrived for this request. */
	members: APIGuildMember[];
}

export type AtLeastOne<
	T,
	U = {
		[K in keyof T]: Pick<T, K>;
	}
> = Partial<T> & U[keyof U];

export interface Logger {
	log: (level: LogLevels, ...args: any[]) => void;
	setDepth: (level: LogDepth) => void;
	setLevel: (level: LogLevels) => void;
	debug: (...args: any[]) => void;
	info: (...args: any[]) => void;
	warn: (...args: any[]) => void;
	error: (...args: any[]) => void;
	fatal: (...args: any[]) => void;
}
