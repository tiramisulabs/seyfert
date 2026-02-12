import type { RestToKeys } from '../common';
import type {
	APIAuditLogEntry,
	APIAutoModerationRule,
	APIChannel,
	APIEntitlement,
	APIGuild,
	APIGuildMember,
	APIGuildScheduledEvent,
	APIStageInstance,
	APISubscription,
	APIUser,
	GatewayActivity,
	GatewayAutoModerationActionExecutionDispatchData,
	GatewayChannelPinsUpdateDispatchData,
	GatewayChannelUpdateDispatchData,
	GatewayDispatchEvents,
	GatewayEntitlementCreateDispatchData,
	GatewayGuildBanAddDispatchData,
	GatewayGuildBanRemoveDispatchData,
	GatewayGuildCreateDispatchData,
	GatewayGuildDeleteDispatchData,
	GatewayGuildEmojisUpdateDispatchData,
	GatewayGuildIntegrationsUpdateDispatchData,
	GatewayGuildMemberAddDispatchData,
	GatewayGuildMemberRemoveDispatchData,
	GatewayGuildMembersChunkDispatchData,
	GatewayGuildMemberUpdateDispatchData,
	GatewayGuildRoleCreateDispatchData,
	GatewayGuildRoleDeleteDispatchData,
	GatewayGuildRoleUpdateDispatchData,
	GatewayGuildScheduledEventUserRemoveDispatchData,
	GatewayGuildSoundboardSoundDeleteDispatchData,
	GatewayGuildSoundboardSoundsUpdateDispatchData,
	GatewayGuildStickersUpdateDispatchData,
	GatewayIntegrationCreateDispatchData,
	GatewayIntegrationDeleteDispatchData,
	GatewayInteractionCreateDispatchData,
	GatewayInviteCreateDispatchData,
	GatewayInviteDeleteDispatchData,
	GatewayMessageCreateDispatchData,
	GatewayMessageDeleteBulkDispatchData,
	GatewayMessageDeleteDispatchData,
	GatewayMessagePollVoteDispatchData,
	GatewayMessageReactionAddDispatchData,
	GatewayMessageReactionRemoveAllDispatchData,
	GatewayMessageReactionRemoveDispatchData,
	GatewayMessageReactionRemoveEmojiDispatchData,
	GatewayMessageUpdateDispatchData,
	GatewayPresenceUpdateData,
	GatewayPresenceUpdateDispatchData,
	GatewayReadyDispatchData,
	GatewayRequestGuildMembersDataWithQuery,
	GatewayRequestGuildMembersDataWithUserIds,
	GatewaySoundboardSoundsDispatchData,
	GatewayThreadCreateDispatchData,
	GatewayThreadDeleteDispatchData,
	GatewayThreadListSyncDispatchData,
	GatewayThreadMembersUpdateDispatchData,
	GatewayThreadMemberUpdateDispatchData,
	GatewayTypingStartDispatchData,
	GatewayUserUpdateDispatchData,
	GatewayVoiceChannelEffectSendDispachData,
	GatewayVoiceServerUpdateDispatchData,
	GatewayVoiceStateUpdateData,
	GatewayWebhooksUpdateDispatchData,
	PresenceUpdateStatus,
} from '../types';
import type { APISoundBoard } from '../types/payloads/soundboard';

/** https://discord.com/developers/docs/topics/gateway-events#update-presence */
export interface StatusUpdate {
	/** The user's activities */
	activities?: Omit<GatewayActivity, 'created_at' | 'id'>[];
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

export type RawClientUser = { bot: true } & APIUser;

export interface Events {
	[GatewayDispatchEvents.Ready]: GatewayReadyDispatchData & {
		user: RawClientUser;
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
	[GatewayDispatchEvents.GuildSoundboardSoundsUpdate]: GatewayGuildSoundboardSoundsUpdateDispatchData;
	[GatewayDispatchEvents.GuildSoundboardSoundDelete]: GatewayGuildSoundboardSoundDeleteDispatchData;
	[GatewayDispatchEvents.SoundboardSounds]: GatewaySoundboardSoundsDispatchData;
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
	[GatewayDispatchEvents.VoiceChannelEffectSend]: GatewayVoiceChannelEffectSendDispachData;
	[GatewayDispatchEvents.VoiceStateUpdate]: GatewayVoiceStateUpdateData;
	[GatewayDispatchEvents.VoiceServerUpdate]: GatewayVoiceServerUpdateDispatchData;
	[GatewayDispatchEvents.WebhooksUpdate]: GatewayWebhooksUpdateDispatchData;
	[GatewayDispatchEvents.InteractionCreate]: GatewayInteractionCreateDispatchData;
	[GatewayDispatchEvents.EntitlementCreate]: GatewayEntitlementCreateDispatchData;
}

export type StageSameEvents = RestToKeys<
	[
		APIStageInstance,
		GatewayDispatchEvents.StageInstanceCreate,
		GatewayDispatchEvents.StageInstanceUpdate,
		GatewayDispatchEvents.StageInstanceDelete,
	]
>;

export type PollVoteSameEvents = RestToKeys<
	[
		GatewayMessagePollVoteDispatchData,
		GatewayDispatchEvents.MessagePollVoteRemove,
		GatewayDispatchEvents.MessagePollVoteAdd,
	]
>;

export type IntegrationSameEvents = RestToKeys<
	[
		GatewayIntegrationCreateDispatchData,
		GatewayDispatchEvents.IntegrationCreate,
		GatewayDispatchEvents.IntegrationUpdate,
	]
>;

export type GuildScheduledUserSameEvents = RestToKeys<
	[
		GatewayGuildScheduledEventUserRemoveDispatchData,
		GatewayDispatchEvents.GuildScheduledEventUserRemove,
		GatewayDispatchEvents.GuildScheduledEventUserAdd,
	]
>;

export type GuildScheduledSameEvents = RestToKeys<
	[
		APIGuildScheduledEvent,
		GatewayDispatchEvents.GuildScheduledEventCreate,
		GatewayDispatchEvents.GuildScheduledEventDelete,
		GatewayDispatchEvents.GuildScheduledEventUpdate,
	]
>;

export type ChannelSameEvents = RestToKeys<
	[
		APIChannel,
		GatewayDispatchEvents.ChannelCreate,
		GatewayDispatchEvents.ChannelDelete,
		GatewayDispatchEvents.ChannelUpdate,
	]
>;

export type AutoModetaractionRuleEvents = RestToKeys<
	[
		APIAutoModerationRule,
		GatewayDispatchEvents.AutoModerationRuleCreate,
		GatewayDispatchEvents.AutoModerationRuleDelete,
		GatewayDispatchEvents.AutoModerationRuleUpdate,
	]
>;

export type EntitlementEvents = RestToKeys<
	[APIEntitlement, GatewayDispatchEvents.EntitlementDelete, GatewayDispatchEvents.EntitlementUpdate]
>;

export type SubscriptionEvents = RestToKeys<
	[
		APISubscription,
		GatewayDispatchEvents.SubscriptionCreate,
		GatewayDispatchEvents.SubscriptionDelete,
		GatewayDispatchEvents.SubscriptionUpdate,
	]
>;

export type SoundboardSoundsEvents = RestToKeys<
	[APISoundBoard, GatewayDispatchEvents.GuildSoundboardSoundCreate, GatewayDispatchEvents.GuildSoundboardSoundUpdate]
>;

export type NormalizeEvents = Events &
	AutoModetaractionRuleEvents &
	ChannelSameEvents &
	GuildScheduledSameEvents &
	GuildScheduledUserSameEvents &
	IntegrationSameEvents &
	EntitlementEvents &
	PollVoteSameEvents &
	StageSameEvents &
	SubscriptionEvents &
	SoundboardSoundsEvents & {
		RAW: GatewayDispatchEvents;
	};

export type GatewayEvents = { [x in keyof NormalizeEvents]: NormalizeEvents[x] };
