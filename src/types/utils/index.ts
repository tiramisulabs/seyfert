export type Nullable<T> = {
	[P in keyof T]: T[P] | null;
};

export type NonNullableFields<T> = {
	[P in keyof T]: NonNullable<T[P]>;
};

export type AddUndefinedToPossiblyUndefinedPropertiesOfInterface<Base> = {
	[K in keyof Base]: Base[K] extends Exclude<Base[K], undefined>
		? AddUndefinedToPossiblyUndefinedPropertiesOfInterface<Base[K]>
		: AddUndefinedToPossiblyUndefinedPropertiesOfInterface<Base[K]> | undefined;
};

export type StrictPartial<Base> = AddUndefinedToPossiblyUndefinedPropertiesOfInterface<Partial<Base>>;

export type StrictRequired<Base> = Required<{ [K in keyof Base]: Exclude<Base[K], undefined> }>;

export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

type Keys<T> = keyof T;
type DistributiveKeys<T> = T extends unknown ? Keys<T> : never;
/**
 * Allows picking of keys from unions that are disjoint
 */
export type DistributivePick<T, K extends DistributiveKeys<T>> = T extends unknown
	? keyof Pick_<T, K> extends never
		? never
		: { [P in keyof Pick_<T, K>]: Pick_<T, K>[P] }
	: never;

type Pick_<T, K> = Pick<T, Extract<keyof T, K>>;

/**
 * Allows omitting of keys from unions that are disjoint
 */
export type DistributiveOmit<T, K extends DistributiveKeys<T>> = T extends unknown
	? { [P in keyof Omit_<T, K>]: Omit_<T, K>[P] }
	: never;

type Omit_<T, K> = Omit<T, Extract<keyof T, K>>;

// https://github.com/discordjs/discord-api-types

export const APIVersion = '10';

export const StickerPackApplicationId = '710982414301790216';

export enum ImageFormat {
	JPEG = 'jpeg',
	PNG = 'png',
	WebP = 'webp',
	GIF = 'gif',
	Lottie = 'json',
}

/**
 * https://discord.com/developers/docs/reference#message-formatting-formats
 */
export const FormattingPatterns = {
	/**
	 * Regular expression for matching a user mention, strictly without a nickname
	 *
	 * The `id` group property is present on the `exec` result of this expression
	 */
	User: /<@(?<id>\d{17,20})>/,
	/**
	 * Regular expression for matching a user mention, strictly with a nickname
	 *
	 * The `id` group property is present on the `exec` result of this expression
	 *
	 * @deprecated Passing `!` in user mentions is no longer necessary / supported, and future message contents won't have it
	 */
	UserWithNickname: /<@!(?<id>\d{17,20})>/,
	/**
	 * Regular expression for matching a user mention, with or without a nickname
	 *
	 * The `id` group property is present on the `exec` result of this expression
	 *
	 * @deprecated Passing `!` in user mentions is no longer necessary / supported, and future message contents won't have it
	 */
	UserWithOptionalNickname: /<@!?(?<id>\d{17,20})>/,
	/**
	 * Regular expression for matching a channel mention
	 *
	 * The `id` group property is present on the `exec` result of this expression
	 */
	Channel: /<#(?<id>\d{17,20})>/,
	/**
	 * Regular expression for matching a role mention
	 *
	 * The `id` group property is present on the `exec` result of this expression
	 */
	Role: /<@&(?<id>\d{17,20})>/,
	/**
	 * Regular expression for matching a application command mention
	 *
	 * The `fullName` (possibly including `name`, `subcommandOrGroup` and `subcommand`) and `id` group properties are present on the `exec` result of this expression
	 */
	SlashCommand:
		/<\/(?<fullName>(?<name>[-_\p{Letter}\p{Number}\p{sc=Deva}\p{sc=Thai}]{1,32})(?: (?<subcommandOrGroup>[-_\p{Letter}\p{Number}\p{sc=Deva}\p{sc=Thai}]{1,32}))?(?: (?<subcommand>[-_\p{Letter}\p{Number}\p{sc=Deva}\p{sc=Thai}]{1,32}))?):(?<id>\d{17,20})>/u,
	/**
	 * Regular expression for matching a custom emoji, either static or animated
	 *
	 * The `animated`, `name` and `id` group properties are present on the `exec` result of this expression
	 */
	Emoji: /<(?<animated>a)?:(?<name>\w{2,32}):(?<id>\d{17,20})>/,
	/**
	 * Regular expression for matching strictly an animated custom emoji
	 *
	 * The `animated`, `name` and `id` group properties are present on the `exec` result of this expression
	 */
	AnimatedEmoji: /<(?<animated>a):(?<name>\w{2,32}):(?<id>\d{17,20})>/,
	/**
	 * Regular expression for matching strictly a static custom emoji
	 *
	 * The `name` and `id` group properties are present on the `exec` result of this expression
	 */
	StaticEmoji: /<:(?<name>\w{2,32}):(?<id>\d{17,20})>/,
	/**
	 * Regular expression for matching a timestamp, either default or custom styled
	 *
	 * The `timestamp` and `style` group properties are present on the `exec` result of this expression
	 */
	Timestamp: /<t:(?<timestamp>-?\d{1,13})(:(?<style>[DFRTdft]))?>/,
	/**
	 * Regular expression for matching strictly default styled timestamps
	 *
	 * The `timestamp` group property is present on the `exec` result of this expression
	 */
	DefaultStyledTimestamp: /<t:(?<timestamp>-?\d{1,13})>/,
	/**
	 * Regular expression for matching strictly custom styled timestamps
	 *
	 * The `timestamp` and `style` group properties are present on the `exec` result of this expression
	 */
	StyledTimestamp: /<t:(?<timestamp>-?\d{1,13}):(?<style>[DFRTdft])>/,
} as const;

/**
 * Freezes the formatting patterns
 *
 * @internal
 */
Object.freeze(FormattingPatterns);

export const GatewayVersion = '10';

/**
 * https://discord.com/developers/docs/topics/opcodes-and-status-codes#gateway-gateway-opcodes
 */
export enum GatewayOpcodes {
	/**
	 * An event was dispatched
	 */
	Dispatch = 0,
	/**
	 * A bidirectional opcode to maintain an active gateway connection.
	 * Fired periodically by the client, or fired by the gateway to request an immediate heartbeat from the client.
	 */
	Heartbeat = 1,
	/**
	 * Starts a new session during the initial handshake
	 */
	Identify = 2,
	/**
	 * Update the client's presence
	 */
	PresenceUpdate = 3,
	/**
	 * Used to join/leave or move between voice channels
	 */
	VoiceStateUpdate = 4,
	/**
	 * Resume a previous session that was disconnected
	 */
	Resume = 6,
	/**
	 * You should attempt to reconnect and resume immediately
	 */
	Reconnect = 7,
	/**
	 * Request information about offline guild members in a large guild
	 */
	RequestGuildMembers = 8,
	/**
	 * The session has been invalidated. You should reconnect and identify/resume accordingly
	 */
	InvalidSession = 9,
	/**
	 * Sent immediately after connecting, contains the `heartbeat_interval` to use
	 */
	Hello = 10,
	/**
	 * Sent in response to receiving a heartbeat to acknowledge that it has been received
	 */
	HeartbeatAck = 11,
	/**
	 * Used to request soundboard sounds for a list of guilds. The server will send Soundboard Sounds events for each guild in response.
	 */
	RequestSoundboardSounds = 31,
}

/**
 * https://discord.com/developers/docs/topics/opcodes-and-status-codes#gateway-gateway-close-event-codes
 */
export enum GatewayCloseCodes {
	/**
	 * We're not sure what went wrong. Try reconnecting?
	 */
	UnknownError = 4_000,
	/**
	 * You sent an invalid Gateway opcode or an invalid payload for an opcode. Don't do that!
	 *
	 * See https://discord.com/developers/docs/topics/gateway-events#payload-structure
	 */
	UnknownOpcode,
	/**
	 * You sent an invalid payload to us. Don't do that!
	 *
	 * See https://discord.com/developers/docs/topics/gateway#sending-events
	 */
	DecodeError,
	/**
	 * You sent us a payload prior to identifying
	 *
	 * See https://discord.com/developers/docs/topics/gateway-events#identify
	 */
	NotAuthenticated,
	/**
	 * The account token sent with your identify payload is incorrect
	 *
	 * See https://discord.com/developers/docs/topics/gateway-events#identify
	 */
	AuthenticationFailed,
	/**
	 * You sent more than one identify payload. Don't do that!
	 */
	AlreadyAuthenticated,
	/**
	 * The sequence sent when resuming the session was invalid. Reconnect and start a new session
	 *
	 * See https://discord.com/developers/docs/topics/gateway-events#resume
	 */
	InvalidSeq = 4_007,
	/**
	 * Woah nelly! You're sending payloads to us too quickly. Slow it down! You will be disconnected on receiving this
	 */
	RateLimited,
	/**
	 * Your session timed out. Reconnect and start a new one
	 */
	SessionTimedOut,
	/**
	 * You sent us an invalid shard when identifying
	 *
	 * See https://discord.com/developers/docs/topics/gateway#sharding
	 */
	InvalidShard,
	/**
	 * The session would have handled too many guilds - you are required to shard your connection in order to connect
	 *
	 * See https://discord.com/developers/docs/topics/gateway#sharding
	 */
	ShardingRequired,
	/**
	 * You sent an invalid version for the gateway
	 */
	InvalidAPIVersion,
	/**
	 * You sent an invalid intent for a Gateway Intent. You may have incorrectly calculated the bitwise value
	 *
	 * See https://discord.com/developers/docs/topics/gateway#gateway-intents
	 */
	InvalidIntents,
	/**
	 * You sent a disallowed intent for a Gateway Intent. You may have tried to specify an intent that you have not
	 * enabled or are not whitelisted for
	 *
	 * See https://discord.com/developers/docs/topics/gateway#gateway-intents
	 *
	 * See https://discord.com/developers/docs/topics/gateway#privileged-intents
	 */
	DisallowedIntents,
}

/**
 * https://discord.com/developers/docs/topics/gateway#list-of-intents
 */
export enum GatewayIntentBits {
	Guilds = 1 << 0,
	GuildMembers = 1 << 1,
	GuildModeration = 1 << 2,
	GuildExpressions = 1 << 3,
	GuildIntegrations = 1 << 4,
	GuildWebhooks = 1 << 5,
	GuildInvites = 1 << 6,
	GuildVoiceStates = 1 << 7,
	GuildPresences = 1 << 8,
	GuildMessages = 1 << 9,
	GuildMessageReactions = 1 << 10,
	GuildMessageTyping = 1 << 11,
	DirectMessages = 1 << 12,
	DirectMessageReactions = 1 << 13,
	DirectMessageTyping = 1 << 14,
	MessageContent = 1 << 15,
	GuildScheduledEvents = 1 << 16,
	AutoModerationConfiguration = 1 << 20,
	AutoModerationExecution = 1 << 21,
	GuildMessagePolls = 1 << 24,
	DirectMessagePolls = 1 << 25,
	NonPrivilaged = 53575421,
	OnlyPrivilaged = 33026,
}

/**
 * https://discord.com/developers/docs/topics/gateway-events#receive-events
 */
export enum GatewayDispatchEvents {
	ApplicationCommandPermissionsUpdate = 'APPLICATION_COMMAND_PERMISSIONS_UPDATE',
	ChannelCreate = 'CHANNEL_CREATE',
	ChannelDelete = 'CHANNEL_DELETE',
	ChannelPinsUpdate = 'CHANNEL_PINS_UPDATE',
	ChannelUpdate = 'CHANNEL_UPDATE',
	GuildBanAdd = 'GUILD_BAN_ADD',
	GuildBanRemove = 'GUILD_BAN_REMOVE',
	GuildCreate = 'GUILD_CREATE',
	GuildDelete = 'GUILD_DELETE',
	GuildEmojisUpdate = 'GUILD_EMOJIS_UPDATE',
	GuildIntegrationsUpdate = 'GUILD_INTEGRATIONS_UPDATE',
	GuildMemberAdd = 'GUILD_MEMBER_ADD',
	GuildMemberRemove = 'GUILD_MEMBER_REMOVE',
	GuildMembersChunk = 'GUILD_MEMBERS_CHUNK',
	GuildMemberUpdate = 'GUILD_MEMBER_UPDATE',
	GuildRoleCreate = 'GUILD_ROLE_CREATE',
	GuildRoleDelete = 'GUILD_ROLE_DELETE',
	GuildRoleUpdate = 'GUILD_ROLE_UPDATE',
	GuildStickersUpdate = 'GUILD_STICKERS_UPDATE',
	GuildUpdate = 'GUILD_UPDATE',
	IntegrationCreate = 'INTEGRATION_CREATE',
	IntegrationDelete = 'INTEGRATION_DELETE',
	IntegrationUpdate = 'INTEGRATION_UPDATE',
	InteractionCreate = 'INTERACTION_CREATE',
	InviteCreate = 'INVITE_CREATE',
	InviteDelete = 'INVITE_DELETE',
	MessageCreate = 'MESSAGE_CREATE',
	MessageDelete = 'MESSAGE_DELETE',
	MessageDeleteBulk = 'MESSAGE_DELETE_BULK',
	MessageReactionAdd = 'MESSAGE_REACTION_ADD',
	MessageReactionRemove = 'MESSAGE_REACTION_REMOVE',
	MessageReactionRemoveAll = 'MESSAGE_REACTION_REMOVE_ALL',
	MessageReactionRemoveEmoji = 'MESSAGE_REACTION_REMOVE_EMOJI',
	MessageUpdate = 'MESSAGE_UPDATE',
	PresenceUpdate = 'PRESENCE_UPDATE',
	StageInstanceCreate = 'STAGE_INSTANCE_CREATE',
	StageInstanceDelete = 'STAGE_INSTANCE_DELETE',
	StageInstanceUpdate = 'STAGE_INSTANCE_UPDATE',
	SubscriptionCreate = 'SUBSCRIPTION_CREATE',
	SubscriptionUpdate = 'SUBSCRIPTION_UPDATE',
	SubscriptionDelete = 'SUBSCRIPTION_DELETE',
	Ready = 'READY',
	Resumed = 'RESUMED',
	ThreadCreate = 'THREAD_CREATE',
	ThreadDelete = 'THREAD_DELETE',
	ThreadListSync = 'THREAD_LIST_SYNC',
	ThreadMembersUpdate = 'THREAD_MEMBERS_UPDATE',
	ThreadMemberUpdate = 'THREAD_MEMBER_UPDATE',
	ThreadUpdate = 'THREAD_UPDATE',
	TypingStart = 'TYPING_START',
	UserUpdate = 'USER_UPDATE',
	VoiceChannelEffectSend = 'VOICE_CHANNEL_EFFECT_SEND',
	VoiceServerUpdate = 'VOICE_SERVER_UPDATE',
	VoiceStateUpdate = 'VOICE_STATE_UPDATE',
	WebhooksUpdate = 'WEBHOOKS_UPDATE',
	MessagePollVoteAdd = 'MESSAGE_POLL_VOTE_ADD',
	MessagePollVoteRemove = 'MESSAGE_POLL_VOTE_REMOVE',
	GuildScheduledEventCreate = 'GUILD_SCHEDULED_EVENT_CREATE',
	GuildScheduledEventUpdate = 'GUILD_SCHEDULED_EVENT_UPDATE',
	GuildScheduledEventDelete = 'GUILD_SCHEDULED_EVENT_DELETE',
	GuildScheduledEventUserAdd = 'GUILD_SCHEDULED_EVENT_USER_ADD',
	GuildScheduledEventUserRemove = 'GUILD_SCHEDULED_EVENT_USER_REMOVE',
	GuildSoundboardSoundCreate = 'GUILD_SOUNDBOARD_SOUND_CREATE',
	GuildSoundboardSoundUpdate = 'GUILD_SOUNDBOARD_SOUND_UPDATE',
	GuildSoundboardSoundDelete = 'GUILD_SOUNDBOARD_SOUND_DELETE',
	GuildSoundboardSoundsUpdate = 'GUILD_SOUNDBOARD_SOUNDS_UPDATE',
	SoundboardSounds = 'SOUNDBOARD_SOUNDS',
	AutoModerationRuleCreate = 'AUTO_MODERATION_RULE_CREATE',
	AutoModerationRuleUpdate = 'AUTO_MODERATION_RULE_UPDATE',
	AutoModerationRuleDelete = 'AUTO_MODERATION_RULE_DELETE',
	AutoModerationActionExecution = 'AUTO_MODERATION_ACTION_EXECUTION',
	GuildAuditLogEntryCreate = 'GUILD_AUDIT_LOG_ENTRY_CREATE',
	EntitlementCreate = 'ENTITLEMENT_CREATE',
	EntitlementUpdate = 'ENTITLEMENT_UPDATE',
	EntitlementDelete = 'ENTITLEMENT_DELETE',
}

/**
 * https://discord.com/developers/docs/topics/permissions#permissions-bitwise-permission-flags
 *
 * These flags are exported as `BigInt`s and NOT numbers. Wrapping them in `Number()`
 * may cause issues, try to use BigInts as much as possible or modules that can
 * replicate them in some way
 */
export const PermissionFlagsBits = {
	/**
	 * Allows creation of instant invites
	 *
	 * Applies to channel types: Text, Voice, Stage
	 */
	CreateInstantInvite: 1n << 0n,
	/**
	 * Allows kicking members
	 */
	KickMembers: 1n << 1n,
	/**
	 * Allows banning members
	 */
	BanMembers: 1n << 2n,
	/**
	 * Allows all permissions and bypasses channel permission overwrites
	 */
	Administrator: 1n << 3n,
	/**
	 * Allows management and editing of channels
	 *
	 * Applies to channel types: Text, Voice, Stage
	 */
	ManageChannels: 1n << 4n,
	/**
	 * Allows management and editing of the guild
	 */
	ManageGuild: 1n << 5n,
	/**
	 * Allows for the addition of reactions to messages
	 *
	 * Applies to channel types: Text, Voice, Stage
	 */
	AddReactions: 1n << 6n,
	/**
	 * Allows for viewing of audit logs
	 */
	ViewAuditLog: 1n << 7n,
	/**
	 * Allows for using priority speaker in a voice channel
	 *
	 * Applies to channel types: Voice
	 */
	PrioritySpeaker: 1n << 8n,
	/**
	 * Allows the user to go live
	 *
	 * Applies to channel types: Voice, Stage
	 */
	Stream: 1n << 9n,
	/**
	 * Allows guild members to view a channel, which includes reading messages in text channels and joining voice channels
	 *
	 * Applies to channel types: Text, Voice, Stage
	 */
	ViewChannel: 1n << 10n,
	/**
	 * Allows for sending messages in a channel and creating threads in a forum
	 * (does not allow sending messages in threads)
	 *
	 * Applies to channel types: Text, Voice, Stage
	 */
	SendMessages: 1n << 11n,
	/**
	 * Allows for sending of `/tts` messages
	 *
	 * Applies to channel types: Text, Voice, Stage
	 */
	SendTTSMessages: 1n << 12n,
	/**
	 * Allows for deletion of other users messages
	 *
	 * Applies to channel types: Text, Voice, Stage
	 */
	ManageMessages: 1n << 13n,
	/**
	 * Links sent by users with this permission will be auto-embedded
	 *
	 * Applies to channel types: Text, Voice, Stage
	 */
	EmbedLinks: 1n << 14n,
	/**
	 * Allows for uploading images and files
	 *
	 * Applies to channel types: Text, Voice, Stage
	 */
	AttachFiles: 1n << 15n,
	/**
	 * Allows for reading of message history
	 *
	 * Applies to channel types: Text, Voice, Stage
	 */
	ReadMessageHistory: 1n << 16n,
	/**
	 * Allows for using the `@everyone` tag to notify all users in a channel,
	 * and the `@here` tag to notify all online users in a channel
	 *
	 * Applies to channel types: Text, Voice, Stage
	 */
	MentionEveryone: 1n << 17n,
	/**
	 * Allows the usage of custom emojis from other servers
	 *
	 * Applies to channel types: Text, Voice, Stage
	 */
	UseExternalEmojis: 1n << 18n,
	/**
	 * Allows for viewing guild insights
	 */
	ViewGuildInsights: 1n << 19n,
	/**
	 * Allows for joining of a voice channel
	 *
	 * Applies to channel types: Voice, Stage
	 */
	Connect: 1n << 20n,
	/**
	 * Allows for speaking in a voice channel
	 *
	 * Applies to channel types: Voice
	 */
	Speak: 1n << 21n,
	/**
	 * Allows for muting members in a voice channel
	 *
	 * Applies to channel types: Voice, Stage
	 */
	MuteMembers: 1n << 22n,
	/**
	 * Allows for deafening of members in a voice channel
	 *
	 * Applies to channel types: Voice
	 */
	DeafenMembers: 1n << 23n,
	/**
	 * Allows for moving of members between voice channels
	 *
	 * Applies to channel types: Voice, Stage
	 */
	MoveMembers: 1n << 24n,
	/**
	 * Allows for using voice-activity-detection in a voice channel
	 *
	 * Applies to channel types: Voice
	 */
	UseVAD: 1n << 25n,
	/**
	 * Allows for modification of own nickname
	 */
	ChangeNickname: 1n << 26n,
	/**
	 * Allows for modification of other users nicknames
	 */
	ManageNicknames: 1n << 27n,
	/**
	 * Allows management and editing of roles
	 *
	 * Applies to channel types: Text, Voice, Stage
	 */
	ManageRoles: 1n << 28n,
	/**
	 * Allows management and editing of webhooks
	 *
	 * Applies to channel types: Text, Voice, Stage
	 */
	ManageWebhooks: 1n << 29n,
	/**
	 * Allows management and editing of emojis, stickers, and soundboard sounds
	 *
	 * @deprecated This is the old name for {@apilink PermissionFlagsBits#ManageGuildExpressions}
	 */
	ManageEmojisAndStickers: 1n << 30n,
	/**
	 * Allows for editing and deleting emojis, stickers, and soundboard sounds created by all users
	 */
	ManageGuildExpressions: 1n << 30n,
	/**
	 * Allows members to use application commands, including slash commands and context menu commands
	 *
	 * Applies to channel types: Text, Voice, Stage
	 */
	UseApplicationCommands: 1n << 31n,
	/**
	 * Allows for requesting to speak in stage channels
	 *
	 * Applies to channel types: Stage
	 */
	RequestToSpeak: 1n << 32n,
	/**
	 * Allows for editing and deleting scheduled events created by all users
	 *
	 * Applies to channel types: Voice, Stage
	 */
	ManageEvents: 1n << 33n,
	/**
	 * Allows for deleting and archiving threads, and viewing all private threads
	 *
	 * Applies to channel types: Text
	 */
	ManageThreads: 1n << 34n,
	/**
	 * Allows for creating public and announcement threads
	 *
	 * Applies to channel types: Text
	 */
	CreatePublicThreads: 1n << 35n,
	/**
	 * Allows for creating private threads
	 *
	 * Applies to channel types: Text
	 */
	CreatePrivateThreads: 1n << 36n,
	/**
	 * Allows the usage of custom stickers from other servers
	 *
	 * Applies to channel types: Text, Voice, Stage
	 */
	UseExternalStickers: 1n << 37n,
	/**
	 * Allows for sending messages in threads
	 *
	 * Applies to channel types: Text
	 */
	SendMessagesInThreads: 1n << 38n,
	/**
	 * Allows for using Activities (applications with the {@apilink ApplicationFlags.Embedded} flag) in a voice channel
	 *
	 * Applies to channel types: Voice
	 */
	UseEmbeddedActivities: 1n << 39n,
	/**
	 * Allows for timing out users to prevent them from sending or reacting to messages in chat and threads,
	 * and from speaking in voice and stage channels
	 */
	ModerateMembers: 1n << 40n,
	/**
	 * Allows for viewing role subscription insights
	 */
	ViewCreatorMonetizationAnalytics: 1n << 41n,
	/**
	 * Allows for using soundboard in a voice channel
	 *
	 * Applies to channel types: Voice
	 */
	UseSoundboard: 1n << 42n,
	/**
	 * Allows for creating emojis, stickers, and soundboard sounds, and editing and deleting those created by the current user
	 */
	CreateGuildExpressions: 1n << 43n,
	/**
	 * Allows for creating scheduled events, and editing and deleting those created by the current user
	 *
	 * Applies to channel types: Voice, Stage
	 */
	CreateEvents: 1n << 44n,
	/**
	 * Allows the usage of custom soundboard sounds from other servers
	 *
	 * Applies to channel types: Voice
	 */
	UseExternalSounds: 1n << 45n,
	/**
	 * Allows sending voice messages
	 *
	 * Applies to channel types: Text, Voice, Stage
	 */
	SendVoiceMessages: 1n << 46n,
	/**
	 * Allows sending polls
	 *
	 * Applies to channel types: Text, Voice, Stage
	 */
	SendPolls: 1n << 49n,
	/**
	 * Allows user-installed apps to send public responses. When disabled, users will still be allowed to use their apps but the responses will be ephemeral. This only applies to apps not also installed to the server
	 *
	 * Applies to channel types: Text, Voice, Stage
	 */
	UseExternalApps: 1n << 50n,
} as const;

/**
 * Freeze the object of bits, preventing any modifications to it
 *
 * @internal
 */
Object.freeze(PermissionFlagsBits);

/**
 * https://discord.com/developers/docs/resources/channel#channel-object-channel-types
 */
export enum ChannelType {
	/**
	 * A text channel within a guild
	 */
	GuildText,
	/**
	 * A direct message between users
	 */
	DM,
	/**
	 * A voice channel within a guild
	 */
	GuildVoice,
	/**
	 * A direct message between multiple users
	 */
	GroupDM,
	/**
	 * An organizational category that contains up to 50 channels
	 *
	 * See https://support.discord.com/hc/articles/115001580171
	 */
	GuildCategory,
	/**
	 * A channel that users can follow and crosspost into their own guild
	 *
	 * See https://support.discord.com/hc/articles/360032008192
	 */
	GuildAnnouncement,
	/**
	 * A temporary sub-channel within a Guild Announcement channel
	 */
	AnnouncementThread = 10,
	/**
	 * A temporary sub-channel within a Guild Text or Guild Forum channel
	 */
	PublicThread,
	/**
	 * A temporary sub-channel within a Guild Text channel that is only viewable by those invited and those with the Manage Threads permission
	 */
	PrivateThread,
	/**
	 * A voice channel for hosting events with an audience
	 *
	 * See https://support.discord.com/hc/articles/1500005513722
	 */
	GuildStageVoice,
	/**
	 * The channel in a Student Hub containing the listed servers
	 *
	 * See https://support.discord.com/hc/articles/4406046651927
	 */
	GuildDirectory,
	/**
	 * A channel that can only contain threads
	 */
	GuildForum,
	/**
	 * A channel like forum channels but contains media for server subscriptions
	 *
	 * See https://creator-support.discord.com/hc/articles/14346342766743
	 */
	GuildMedia,

	// EVERYTHING BELOW THIS LINE SHOULD BE OLD NAMES FOR RENAMED ENUM MEMBERS //

	/**
	 * A channel that users can follow and crosspost into their own guild
	 *
	 * @deprecated This is the old name for {@apilink ChannelType#GuildAnnouncement}
	 *
	 * See https://support.discord.com/hc/articles/360032008192
	 */
	GuildNews = 5,
	/**
	 * A temporary sub-channel within a Guild Announcement channel
	 *
	 * @deprecated This is the old name for {@apilink ChannelType#AnnouncementThread}
	 */
	GuildNewsThread = 10,
	/**
	 * A temporary sub-channel within a Guild Text channel
	 *
	 * @deprecated This is the old name for {@apilink ChannelType#PublicThread}
	 */
	GuildPublicThread = 11,
	/**
	 * A temporary sub-channel within a Guild Text channel that is only viewable by those invited and those with the Manage Threads permission
	 *
	 * @deprecated This is the old name for {@apilink ChannelType#PrivateThread}
	 */
	GuildPrivateThread = 12,
}

export enum VideoQualityMode {
	/**
	 * Discord chooses the quality for optimal performance
	 */
	Auto = 1,
	/**
	 * 720p
	 */
	Full,
}

/**
 * https://discord.com/developers/docs/resources/guild#guild-member-object-guild-member-flags
 */
export enum GuildMemberFlags {
	/**
	 * Member has left and rejoined the guild
	 */
	DidRejoin = 1 << 0,
	/**
	 * Member has completed onboarding
	 */
	CompletedOnboarding = 1 << 1,
	/**
	 * Member bypasses guild verification requirements
	 */
	BypassesVerification = 1 << 2,
	/**
	 * Member has started onboarding
	 */
	StartedOnboarding = 1 << 3,
	/**
	 * Member is a guest and can only access the voice channel they were invited to
	 */
	IsGuest = 1 << 4,
	/**
	 * This guild member flag is currently not documented by Discord but has a known value which we will try to keep up to date.
	 */
	StartedHomeActions = 1 << 5,
	/**
	 * This guild member flag is currently not documented by Discord but has a known value which we will try to keep up to date.
	 */
	CompletedHomeActions = 1 << 6,
	/**
	 * This guild member flag is currently not documented by Discord but has a known value which we will try to keep up to date.
	 */
	AutomodQuarantinedUsernameOrGuildNickname = 1 << 7,
	/**
	 * @deprecated This guild member flag is currently not documented by Discord but has a known value which we will try to keep up to date.
	 */
	AutomodQuarantinedBio = 1 << 8,
	/**
	 * Member has dismissed the DM settings upsell
	 */
	DmSettingsUpsellAcknowledged = 1 << 9,
}

export enum OverwriteType {
	Role,
	Member,
}

/**
 * https://discord.com/developers/docs/topics/gateway-events#voice-channel-effect-send-animation-types
 */
export enum AnimationTypes {
	/** A fun animation, sent by a Nitro subscriber */
	PREMIUM = 0,
	/** The standard animation */
	BASIC,
}
