import type { ChannelType } from 'discord-api-types/v10';
import { type CustomStructures, OptionResolver } from '../commands';
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
import type { StructStates } from '../common/types/util';
import { GuildBan } from '../structures/GuildBan';

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

export class Transformers {
	static AnonymousGuild(...args: ConstructorParameters<typeof AnonymousGuild>): AnonymousGuildStructure {
		return new AnonymousGuild(...args);
	}

	static AutoModerationRule(...args: ConstructorParameters<typeof AutoModerationRule>): AutoModerationRuleStructure {
		return new AutoModerationRule(...args);
	}

	static BaseChannel(...args: ConstructorParameters<typeof BaseChannel>): BaseChannelStructure {
		return new BaseChannel(...args);
	}

	static BaseGuildChannel(...args: ConstructorParameters<typeof BaseGuildChannel>): BaseGuildChannelStructure {
		return new BaseGuildChannel(...args);
	}

	static TextGuildChannel(...args: ConstructorParameters<typeof TextGuildChannel>): TextGuildChannelStructure {
		return new TextGuildChannel(...args);
	}

	static DMChannel(...args: ConstructorParameters<typeof DMChannel>): DMChannelStructure {
		return new DMChannel(...args);
	}

	static VoiceChannel(...args: ConstructorParameters<typeof VoiceChannel>): VoiceChannelStructure {
		return new VoiceChannel(...args);
	}

	static StageChannel(...args: ConstructorParameters<typeof StageChannel>): StageChannelStructure {
		return new StageChannel(...args);
	}

	static MediaChannel(...args: ConstructorParameters<typeof MediaChannel>): MediaChannelStructure {
		return new MediaChannel(...args);
	}

	static ForumChannel(...args: ConstructorParameters<typeof ForumChannel>): ForumChannelStructure {
		return new ForumChannel(...args);
	}

	static ThreadChannel(...args: ConstructorParameters<typeof ThreadChannel>): ThreadChannelStructure {
		return new ThreadChannel(...args);
	}

	static CategoryChannel(...args: ConstructorParameters<typeof CategoryChannel>): CategoryChannelStructure {
		return new CategoryChannel(...args);
	}

	static NewsChannel(...args: ConstructorParameters<typeof NewsChannel>): NewsChannelStructure {
		return new NewsChannel(...args);
	}

	static DirectoryChannel(...args: ConstructorParameters<typeof DirectoryChannel>): DirectoryChannelStructure {
		return new DirectoryChannel(...args);
	}

	static ClientUser(...args: ConstructorParameters<typeof ClientUser>): ClientUserStructure {
		return new ClientUser(...args);
	}

	static Guild<State extends StructStates = 'api'>(
		...args: ConstructorParameters<typeof Guild>
	): GuildStructure<State> {
		return new Guild<State>(...args);
	}

	static GuildBan(...args: ConstructorParameters<typeof GuildBan>): GuildBanStructure {
		return new GuildBan(...args);
	}

	static GuildEmoji(...args: ConstructorParameters<typeof GuildEmoji>): GuildEmojiStructure {
		return new GuildEmoji(...args);
	}

	static GuildMember(...args: ConstructorParameters<typeof GuildMember>): GuildMemberStructure {
		return new GuildMember(...args);
	}

	static InteractionGuildMember(
		...args: ConstructorParameters<typeof InteractionGuildMember>
	): InteractionGuildMemberStructure {
		return new InteractionGuildMember(...args);
	}

	static GuildRole(...args: ConstructorParameters<typeof GuildRole>): GuildRoleStructure {
		return new GuildRole(...args);
	}

	static GuildTemplate(...args: ConstructorParameters<typeof GuildTemplate>): GuildTemplateStructure {
		return new GuildTemplate(...args);
	}

	static Message(...args: ConstructorParameters<typeof Message>): MessageStructure {
		return new Message(...args);
	}

	static WebhookMessage(...args: ConstructorParameters<typeof WebhookMessage>): WebhookMessageStructure {
		return new WebhookMessage(...args);
	}

	static Poll(...args: ConstructorParameters<typeof Poll>): PollStructure {
		return new Poll(...args);
	}

	static Sticker(...args: ConstructorParameters<typeof Sticker>): StickerStructure {
		return new Sticker(...args);
	}

	static User(...args: ConstructorParameters<typeof User>): UserStructure {
		return new User(...args);
	}

	static VoiceState(...args: ConstructorParameters<typeof VoiceState>): VoiceStateStructure {
		return new VoiceState(...args);
	}

	static Webhook(...args: ConstructorParameters<typeof Webhook>): WebhookStructure {
		return new Webhook(...args);
	}

	static OptionResolver(...args: ConstructorParameters<typeof OptionResolver>): OptionResolverStructure {
		return new OptionResolver(...args);
	}
}

export type InferCustomStructure<T, N extends string> = CustomStructures extends Record<N, infer P> ? P : T;
