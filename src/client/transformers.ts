import { type CustomStructures, OptionResolver } from '../commands';
import type { StructStates } from '../common/';
import {
	AnonymousGuild,
	AutoModerationRule,
	BaseChannel,
	BaseGuildChannel,
	CategoryChannel,
	ClientUser,
	DMChannel,
	DirectoryChannel,
	ForumChannel,
	Guild,
	GuildEmoji,
	GuildMember,
	GuildRole,
	GuildTemplate,
	InteractionGuildMember,
	MediaChannel,
	Message,
	NewsChannel,
	Poll,
	StageChannel,
	Sticker,
	TextGuildChannel,
	ThreadChannel,
	User,
	VoiceChannel,
	VoiceState,
	Webhook,
	WebhookMessage,
} from '../structures';
import { Entitlement } from '../structures/Entitlement';
import { GuildBan } from '../structures/GuildBan';
import type { ChannelType } from '../types';

export type PollStructure = InferCustomStructure<Poll, 'Poll'>;
export type ClientUserStructure = InferCustomStructure<ClientUser, 'ClientUser'>;
export type AnonymousGuildStructure = InferCustomStructure<AnonymousGuild, 'AnonymousGuild'>;
export type AutoModerationRuleStructure = InferCustomStructure<AutoModerationRule, 'AutoModerationRule'>;
export type BaseChannelStructure = InferCustomStructure<BaseChannel<ChannelType>, 'BaseChannel'>;
export type BaseGuildChannelStructure = InferCustomStructure<BaseGuildChannel, 'BaseGuildChannel'>;
export type TextGuildChannelStructure = InferCustomStructure<TextGuildChannel, 'TextGuildChannel'>;
export type DMChannelStructure = InferCustomStructure<DMChannel, 'DMChannel'>;
export type VoiceChannelStructure = InferCustomStructure<VoiceChannel, 'VoiceChannel'>;
export type StageChannelStructure = InferCustomStructure<StageChannel, 'StageChannel'>;
export type MediaChannelStructure = InferCustomStructure<MediaChannel, 'MediaChannel'>;
export type ForumChannelStructure = InferCustomStructure<ForumChannel, 'ForumChannel'>;
export type ThreadChannelStructure = InferCustomStructure<ThreadChannel, 'ThreadChannel'>;
export type CategoryChannelStructure = InferCustomStructure<CategoryChannel, 'CategoryChannel'>;
export type NewsChannelStructure = InferCustomStructure<NewsChannel, 'NewsChannel'>;
export type DirectoryChannelStructure = InferCustomStructure<DirectoryChannel, 'DirectoryChannel'>;
export type GuildStructure<State extends StructStates = 'api'> = InferCustomStructure<Guild<State>, 'Guild'>;
export type GuildBanStructure = InferCustomStructure<GuildBan, 'GuildBan'>;
export type GuildEmojiStructure = InferCustomStructure<GuildEmoji, 'GuildEmoji'>;
export type GuildMemberStructure = InferCustomStructure<GuildMember, 'GuildMember'>;
export type InteractionGuildMemberStructure = InferCustomStructure<InteractionGuildMember, 'InteractionGuildMember'>;
export type GuildRoleStructure = InferCustomStructure<GuildRole, 'GuildRole'>;
export type GuildTemplateStructure = InferCustomStructure<GuildTemplate, 'GuildTemplate'>;
export type MessageStructure = InferCustomStructure<Message, 'Message'>;
export type WebhookMessageStructure = InferCustomStructure<WebhookMessage, 'WebhookMessage'>;
export type StickerStructure = InferCustomStructure<Sticker, 'Sticker'>;
export type UserStructure = InferCustomStructure<User, 'User'>;
export type VoiceStateStructure = InferCustomStructure<VoiceState, 'VoiceState'>;
export type WebhookStructure = InferCustomStructure<Webhook, 'Webhook'>;
export type OptionResolverStructure = InferCustomStructure<OptionResolver, 'OptionResolver'>;
export type EntitlementStructure = InferCustomStructure<Entitlement, 'Entitlement'>;

export const Transformers = {
	AnonymousGuild(...args: ConstructorParameters<typeof AnonymousGuild>): AnonymousGuildStructure {
		return new AnonymousGuild(...args);
	},
	AutoModerationRule(...args: ConstructorParameters<typeof AutoModerationRule>): AutoModerationRuleStructure {
		return new AutoModerationRule(...args);
	},
	BaseChannel(...args: ConstructorParameters<typeof BaseChannel>): BaseChannelStructure {
		return new BaseChannel(...args);
	},
	BaseGuildChannel(...args: ConstructorParameters<typeof BaseGuildChannel>): BaseGuildChannelStructure {
		return new BaseGuildChannel(...args);
	},
	TextGuildChannel(...args: ConstructorParameters<typeof TextGuildChannel>): TextGuildChannelStructure {
		return new TextGuildChannel(...args);
	},
	DMChannel(...args: ConstructorParameters<typeof DMChannel>): DMChannelStructure {
		return new DMChannel(...args);
	},
	VoiceChannel(...args: ConstructorParameters<typeof VoiceChannel>): VoiceChannelStructure {
		return new VoiceChannel(...args);
	},
	StageChannel(...args: ConstructorParameters<typeof StageChannel>): StageChannelStructure {
		return new StageChannel(...args);
	},
	MediaChannel(...args: ConstructorParameters<typeof MediaChannel>): MediaChannelStructure {
		return new MediaChannel(...args);
	},
	ForumChannel(...args: ConstructorParameters<typeof ForumChannel>): ForumChannelStructure {
		return new ForumChannel(...args);
	},
	ThreadChannel(...args: ConstructorParameters<typeof ThreadChannel>): ThreadChannelStructure {
		return new ThreadChannel(...args);
	},
	CategoryChannel(...args: ConstructorParameters<typeof CategoryChannel>): CategoryChannelStructure {
		return new CategoryChannel(...args);
	},
	NewsChannel(...args: ConstructorParameters<typeof NewsChannel>): NewsChannelStructure {
		return new NewsChannel(...args);
	},
	DirectoryChannel(...args: ConstructorParameters<typeof DirectoryChannel>): DirectoryChannelStructure {
		return new DirectoryChannel(...args);
	},
	ClientUser(...args: ConstructorParameters<typeof ClientUser>): ClientUserStructure {
		return new ClientUser(...args);
	},
	Guild<State extends StructStates = 'api'>(...args: ConstructorParameters<typeof Guild>): GuildStructure<State> {
		return new Guild<State>(...args);
	},
	GuildBan(...args: ConstructorParameters<typeof GuildBan>): GuildBanStructure {
		return new GuildBan(...args);
	},
	GuildEmoji(...args: ConstructorParameters<typeof GuildEmoji>): GuildEmojiStructure {
		return new GuildEmoji(...args);
	},
	GuildMember(...args: ConstructorParameters<typeof GuildMember>): GuildMemberStructure {
		return new GuildMember(...args);
	},
	InteractionGuildMember(
		...args: ConstructorParameters<typeof InteractionGuildMember>
	): InteractionGuildMemberStructure {
		return new InteractionGuildMember(...args);
	},
	GuildRole(...args: ConstructorParameters<typeof GuildRole>): GuildRoleStructure {
		return new GuildRole(...args);
	},
	GuildTemplate(...args: ConstructorParameters<typeof GuildTemplate>): GuildTemplateStructure {
		return new GuildTemplate(...args);
	},
	Message(...args: ConstructorParameters<typeof Message>): MessageStructure {
		return new Message(...args);
	},
	WebhookMessage(...args: ConstructorParameters<typeof WebhookMessage>): WebhookMessageStructure {
		return new WebhookMessage(...args);
	},
	Poll(...args: ConstructorParameters<typeof Poll>): PollStructure {
		return new Poll(...args);
	},
	Sticker(...args: ConstructorParameters<typeof Sticker>): StickerStructure {
		return new Sticker(...args);
	},
	User(...args: ConstructorParameters<typeof User>): UserStructure {
		return new User(...args);
	},
	VoiceState(...args: ConstructorParameters<typeof VoiceState>): VoiceStateStructure {
		return new VoiceState(...args);
	},
	Webhook(...args: ConstructorParameters<typeof Webhook>): WebhookStructure {
		return new Webhook(...args);
	},
	OptionResolver(...args: ConstructorParameters<typeof OptionResolver>): OptionResolverStructure {
		return new OptionResolver(...args);
	},
	Entitlement(...args: ConstructorParameters<typeof Entitlement>): EntitlementStructure {
		return new Entitlement(...args);
	},
};

export type InferCustomStructure<T, N extends string> = CustomStructures extends Record<N, infer P> ? P : T;
