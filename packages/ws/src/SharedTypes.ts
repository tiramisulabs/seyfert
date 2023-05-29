import type {
  GatewayPresenceUpdateData,
  PresenceUpdateStatus,
  GatewayActivity,
  APIGuildMember,
  GatewayRequestGuildMembersDataWithQuery,
  GatewayRequestGuildMembersDataWithUserIds,
  APIAuditLogEntry,
  APIAutoModerationRule,
  APIChannel,
  APIGuild,
  APIGuildScheduledEvent,
  APIStageInstance,
  GatewayAutoModerationActionExecutionDispatchData,
  GatewayChannelPinsUpdateDispatchData,
  GatewayChannelUpdateDispatchData,
  GatewayDispatchEvents,
  GatewayGuildBanAddDispatchData,
  GatewayGuildBanRemoveDispatchData,
  GatewayGuildCreateDispatchData,
  GatewayGuildDeleteDispatchData,
  GatewayGuildEmojisUpdateDispatchData,
  GatewayGuildIntegrationsUpdateDispatchData,
  GatewayGuildMemberAddDispatchData,
  GatewayGuildMemberRemoveDispatchData,
  GatewayGuildMemberUpdateDispatchData,
  GatewayGuildMembersChunkDispatchData,
  GatewayGuildRoleCreateDispatchData,
  GatewayGuildRoleDeleteDispatchData,
  GatewayGuildRoleUpdateDispatchData,
  GatewayGuildScheduledEventUserRemoveDispatchData,
  GatewayGuildStickersUpdateDispatchData,
  GatewayIntegrationCreateDispatchData,
  GatewayIntegrationDeleteDispatchData,
  GatewayInteractionCreateDispatchData,
  GatewayInviteCreateDispatchData,
  GatewayInviteDeleteDispatchData,
  GatewayMessageCreateDispatchData,
  GatewayMessageDeleteBulkDispatchData,
  GatewayMessageDeleteDispatchData,
  GatewayMessageReactionAddDispatchData,
  GatewayMessageReactionRemoveAllDispatchData,
  GatewayMessageReactionRemoveDispatchData,
  GatewayMessageReactionRemoveEmojiDispatchData,
  GatewayMessageUpdateDispatchData,
  GatewayPresenceUpdateDispatchData,
  GatewayReadyDispatchData,
  GatewayThreadCreateDispatchData,
  GatewayThreadDeleteDispatchData,
  GatewayThreadListSyncDispatchData,
  GatewayThreadMemberUpdateDispatchData,
  GatewayThreadMembersUpdateDispatchData,
  GatewayTypingStartDispatchData,
  GatewayUserUpdateDispatchData,
  GatewayVoiceServerUpdateDispatchData,
  GatewayVoiceStateUpdateData,
  GatewayWebhooksUpdateDispatchData,
  RestToKeys,
  APIUser
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

/** https://discord.com/developers/docs/topics/gateway-events#update-presence */
export interface StatusUpdate {
  /** The user's activities */
  activities?: Omit<GatewayActivity, 'created_at'>[];
  /** The user's new status */
  status: PresenceUpdateStatus;
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

export type ShardStatusUpdate = Pick<GatewayPresenceUpdateData, 'activities' | 'status'>;

export interface RequestGuildMembersOptions extends GatewayRequestGuildMembersDataWithQuery, GatewayRequestGuildMembersDataWithUserIds {}

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

export type ClientUser = { bot: true } & APIUser;

export interface Events {
  [GatewayDispatchEvents.Ready]: GatewayReadyDispatchData & {
    user: ClientUser;
  };
  [GatewayDispatchEvents.ChannelUpdate]: GatewayChannelUpdateDispatchData;
  [GatewayDispatchEvents.AutoModerationActionExecution]: GatewayAutoModerationActionExecutionDispatchData;
  [GatewayDispatchEvents.ThreadCreate]: GatewayThreadCreateDispatchData;
  [GatewayDispatchEvents.ThreadDelete]: GatewayThreadDeleteDispatchData;
  [GatewayDispatchEvents.ThreadUpdate]: GatewayThreadDeleteDispatchData;
  [GatewayDispatchEvents.ThreadListSync]: GatewayThreadListSyncDispatchData;
  [GatewayDispatchEvents.ThreadMemberUpdate]: GatewayThreadMemberUpdateDispatchData;
  [GatewayDispatchEvents.ThreadMembersUpdate]: GatewayThreadMembersUpdateDispatchData;
  [GatewayDispatchEvents.ChannelPinsUpdate]: GatewayChannelPinsUpdateDispatchData;
  [GatewayDispatchEvents.GuildCreate]: GatewayGuildCreateDispatchData;
  [GatewayDispatchEvents.GuildUpdate]: APIGuild;
  [GatewayDispatchEvents.GuildDelete]: GatewayGuildDeleteDispatchData;
  [GatewayDispatchEvents.GuildAuditLogEntryCreate]: APIAuditLogEntry;
  [GatewayDispatchEvents.GuildBanAdd]: GatewayGuildBanAddDispatchData;
  [GatewayDispatchEvents.GuildBanRemove]: GatewayGuildBanRemoveDispatchData;
  [GatewayDispatchEvents.GuildEmojisUpdate]: GatewayGuildEmojisUpdateDispatchData;
  [GatewayDispatchEvents.GuildStickersUpdate]: GatewayGuildStickersUpdateDispatchData;
  [GatewayDispatchEvents.GuildIntegrationsUpdate]: GatewayGuildIntegrationsUpdateDispatchData;
  [GatewayDispatchEvents.GuildMemberAdd]: GatewayGuildMemberAddDispatchData;
  [GatewayDispatchEvents.GuildMemberRemove]: GatewayGuildMemberRemoveDispatchData;
  [GatewayDispatchEvents.GuildMemberUpdate]: GatewayGuildMemberUpdateDispatchData;
  [GatewayDispatchEvents.GuildMembersChunk]: GatewayGuildMembersChunkDispatchData;
  [GatewayDispatchEvents.GuildRoleCreate]: GatewayGuildRoleCreateDispatchData;
  [GatewayDispatchEvents.GuildRoleUpdate]: GatewayGuildRoleUpdateDispatchData;
  [GatewayDispatchEvents.GuildRoleDelete]: GatewayGuildRoleDeleteDispatchData;
  [GatewayDispatchEvents.IntegrationDelete]: GatewayIntegrationDeleteDispatchData;
  [GatewayDispatchEvents.InviteCreate]: GatewayInviteCreateDispatchData;
  [GatewayDispatchEvents.InviteDelete]: GatewayInviteDeleteDispatchData;
  [GatewayDispatchEvents.MessageCreate]: GatewayMessageCreateDispatchData;
  [GatewayDispatchEvents.MessageUpdate]: GatewayMessageUpdateDispatchData;
  [GatewayDispatchEvents.MessageDelete]: GatewayMessageDeleteDispatchData;
  [GatewayDispatchEvents.MessageDeleteBulk]: GatewayMessageDeleteBulkDispatchData;
  [GatewayDispatchEvents.MessageReactionAdd]: GatewayMessageReactionAddDispatchData;
  [GatewayDispatchEvents.MessageReactionRemove]: GatewayMessageReactionRemoveDispatchData;
  [GatewayDispatchEvents.MessageReactionRemoveAll]: GatewayMessageReactionRemoveAllDispatchData;
  [GatewayDispatchEvents.MessageReactionRemoveEmoji]: GatewayMessageReactionRemoveEmojiDispatchData;
  [GatewayDispatchEvents.PresenceUpdate]: GatewayPresenceUpdateDispatchData;
  [GatewayDispatchEvents.TypingStart]: GatewayTypingStartDispatchData;
  [GatewayDispatchEvents.UserUpdate]: GatewayUserUpdateDispatchData;
  [GatewayDispatchEvents.VoiceStateUpdate]: GatewayVoiceStateUpdateData;
  [GatewayDispatchEvents.VoiceServerUpdate]: GatewayVoiceServerUpdateDispatchData;
  [GatewayDispatchEvents.WebhooksUpdate]: GatewayWebhooksUpdateDispatchData;
  [GatewayDispatchEvents.InteractionCreate]: GatewayInteractionCreateDispatchData;
}

export type StageSameEvents = RestToKeys<
  [
    APIStageInstance,
    GatewayDispatchEvents.StageInstanceCreate,
    GatewayDispatchEvents.StageInstanceUpdate,
    GatewayDispatchEvents.StageInstanceDelete
  ]
>;

export type IntegrationSameEvents = RestToKeys<
  [GatewayIntegrationCreateDispatchData, GatewayDispatchEvents.IntegrationCreate, GatewayDispatchEvents.IntegrationUpdate]
>;

export type GuildScheduledUserSameEvents = RestToKeys<
  [
    GatewayGuildScheduledEventUserRemoveDispatchData,
    GatewayDispatchEvents.GuildScheduledEventUserRemove,
    GatewayDispatchEvents.GuildScheduledEventUserAdd
  ]
>;

export type GuildScheduledSameEvents = RestToKeys<
  [
    APIGuildScheduledEvent,
    GatewayDispatchEvents.GuildScheduledEventCreate,
    GatewayDispatchEvents.GuildScheduledEventDelete,
    GatewayDispatchEvents.GuildScheduledEventUpdate
  ]
>;

export type ChannelSameEvents = RestToKeys<
  [APIChannel, GatewayDispatchEvents.ChannelCreate, GatewayDispatchEvents.ChannelDelete, GatewayDispatchEvents.ChannelUpdate]
>;

export type AutoModetaractionRuleEvents = RestToKeys<
  [
    APIAutoModerationRule,
    GatewayDispatchEvents.AutoModerationRuleCreate,
    GatewayDispatchEvents.AutoModerationRuleDelete,
    GatewayDispatchEvents.AutoModerationRuleUpdate
  ]
>;

export type NormalizeEvents = Events &
  AutoModetaractionRuleEvents &
  ChannelSameEvents &
  GuildScheduledSameEvents &
  GuildScheduledUserSameEvents &
  IntegrationSameEvents &
  StageSameEvents;

export type GatewayEvents = { [x in keyof Events]: Events[x] };
