import {
	ChannelFlags,
	ChannelType,
	type RESTAPIAttachment,
	VideoQualityMode,
	type APIChannelBase,
	type APIDMChannel,
	type APIGuildCategoryChannel,
	type APIGuildChannel,
	type APIGuildForumChannel,
	type APIGuildForumDefaultReactionEmoji,
	type APIGuildForumTag,
	type APIGuildMediaChannel,
	type APIGuildStageVoiceChannel,
	type APIGuildVoiceChannel,
	type APINewsChannel,
	type APITextChannel,
	type APIThreadChannel,
	type RESTGetAPIChannelMessageReactionUsersQuery,
	type RESTPatchAPIChannelJSONBody,
	type RESTPatchAPIGuildChannelPositionsJSONBody,
	type RESTPostAPIChannelWebhookJSONBody,
	type RESTPostAPIGuildChannelJSONBody,
	type RESTPostAPIGuildForumThreadsJSONBody,
	type SortOrderType,
	type ThreadAutoArchiveDuration,
} from 'discord-api-types/v10';
import { mix } from 'ts-mixer';
import { ActionRow, Embed, PollBuilder, resolveAttachment } from '../builders';
import type { UsingClient } from '../commands';
import type {
	EmojiResolvable,
	MessageCreateBodyRequest,
	MessageUpdateBodyRequest,
	MethodContext,
	ObjectToLower,
	StringToNumber,
	ToClass,
} from '../common';
import type { GuildMember } from './GuildMember';
import type { GuildRole } from './GuildRole';
import { DiscordBase } from './extra/DiscordBase';
import { channelLink } from './extra/functions';
import { Collection, Formatter, type RawFile } from '..';
import {
	type BaseChannelStructure,
	type BaseGuildChannelStructure,
	type CategoryChannelStructure,
	type DMChannelStructure,
	type DirectoryChannelStructure,
	type ForumChannelStructure,
	type GuildMemberStructure,
	type MediaChannelStructure,
	type NewsChannelStructure,
	type StageChannelStructure,
	type TextGuildChannelStructure,
	type ThreadChannelStructure,
	Transformers,
	type VoiceChannelStructure,
} from '../client/transformers';

export class BaseChannel<T extends ChannelType> extends DiscordBase<APIChannelBase<ChannelType>> {
	declare type: T;

	constructor(client: UsingClient, data: APIChannelBase<ChannelType>) {
		super(client, data);
	}

	static __intent__(id: '@me'): 'DirectMessages';
	static __intent__(id: string): 'DirectMessages' | 'Guilds';
	static __intent__(id: string) {
		return id === '@me' ? 'DirectMessages' : 'Guilds';
	}

	/** The URL to the channel */
	get url() {
		return channelLink(this.id);
	}

	fetch(force = false) {
		return this.client.channels.fetch(this.id, force);
	}

	delete(reason?: string) {
		return this.client.channels.delete(this.id, { reason });
	}

	edit(body: RESTPatchAPIChannelJSONBody, reason?: string) {
		return this.client.channels.edit(this.id, body, {
			reason,
			guildId: 'guildId' in this ? (this.guildId as string) : '@me',
		});
	}

	toString() {
		return Formatter.channelMention(this.id);
	}

	isStage(): this is StageChannel {
		return this.type === ChannelType.GuildStageVoice;
	}

	isMedia(): this is MediaChannel {
		return this.type === ChannelType.GuildMedia;
	}

	isDM(): this is DMChannel {
		return [ChannelType.DM, ChannelType.GroupDM].includes(this.type);
	}

	isForum(): this is ForumChannel {
		return this.type === ChannelType.GuildForum;
	}

	isThread(): this is ThreadChannel {
		return [ChannelType.PublicThread, ChannelType.PrivateThread, ChannelType.AnnouncementThread].includes(this.type);
	}

	isDirectory(): this is DirectoryChannel {
		return this.type === ChannelType.GuildDirectory;
	}

	isVoice(): this is VoiceChannel {
		return this.type === ChannelType.GuildVoice;
	}

	isTextGuild(): this is TextGuildChannel {
		return this.type === ChannelType.GuildText;
	}

	isCategory(): this is CategoryChannel {
		return this.type === ChannelType.GuildCategory;
	}

	isNews(): this is NewsChannel {
		return this.type === ChannelType.GuildAnnouncement;
	}

	isTextable(): this is AllTextableChannels {
		return 'messages' in this;
	}

	isGuildTextable(): this is AllGuildTextableChannels {
		return !this.isDM() && this.isTextable();
	}

	isThreadOnly(): this is ForumChannel | MediaChannel {
		return this.isForum() || this.isMedia();
	}

	is<T extends (keyof IChannelTypes)[]>(channelTypes: T): this is IChannelTypes[T[number]] {
		return channelTypes.some(x => ChannelType[x] === this.type);
	}

	static allMethods(ctx: MethodContext<{ guildId: string }>) {
		return {
			list: (force = false) => ctx.client.guilds.channels.list(ctx.guildId, force),
			fetch: (id: string, force = false) => ctx.client.guilds.channels.fetch(ctx.guildId, id, force),
			create: (body: RESTPostAPIGuildChannelJSONBody) => ctx.client.guilds.channels.create(ctx.guildId, body),
			delete: (id: string, reason?: string) => ctx.client.guilds.channels.delete(ctx.guildId, id, reason),
			edit: (id: string, body: RESTPatchAPIChannelJSONBody, reason?: string) =>
				ctx.client.guilds.channels.edit(ctx.guildId, id, body, reason),
			editPositions: (body: RESTPatchAPIGuildChannelPositionsJSONBody) =>
				ctx.client.guilds.channels.editPositions(ctx.guildId, body),
		};
	}
}

interface IChannelTypes {
	GuildStageVoice: StageChannel;
	GuildMedia: MediaChannel;
	DM: DMChannel;
	GuildForum: ForumChannel;
	AnnouncementThread: ThreadChannel;
	PrivateThread: ThreadChannel;
	PublicThread: ThreadChannel;
	GuildDirectory: DirectoryChannel;
	GuildVoice: VoiceChannel;
	GuildText: TextGuildChannel;
	GuildCategory: CategoryChannel;
	GuildAnnouncement: NewsChannel;
}

export interface BaseGuildChannel extends ObjectToLower<Omit<APIGuildChannel<ChannelType>, 'permission_overwrites'>> {}
export class BaseGuildChannel extends BaseChannel<ChannelType> {
	constructor(client: UsingClient, data: APIGuildChannel<ChannelType>) {
		const { permission_overwrites, ...rest } = data;
		super(client, rest);
	}

	permissionOverwrites = {
		fetch: () => this.client.cache.overwrites?.get(this.id),
		values: () => (this.guildId ? this.client.cache.overwrites?.values(this.guildId) ?? [] : []),
	};

	memberPermissions(member: GuildMember, checkAdmin = true) {
		return this.client.channels.memberPermissions(this.id, member, checkAdmin);
	}

	rolePermissions(role: GuildRole, checkAdmin = true) {
		return this.client.channels.rolePermissions(this.id, role, checkAdmin);
	}

	overwritesFor(member: GuildMember) {
		return this.client.channels.overwritesFor(this.id, member);
	}

	guild(force = false) {
		return this.client.guilds.fetch(this.guildId!, force);
	}

	get url() {
		return channelLink(this.id, this.guildId);
	}

	setPosition(position: number, reason?: string) {
		return this.edit({ position }, reason);
	}

	setName(name: string, reason?: string) {
		return this.edit({ name }, reason);
	}

	setParent(parent_id: string | null, reason?: string) {
		return this.edit({ parent_id }, reason);
	}
}

export interface MessagesMethods extends BaseChannel<ChannelType> {}
export class MessagesMethods extends DiscordBase {
	typing() {
		return this.client.channels.typing(this.id);
	}

	messages = MessagesMethods.messages({
		client: this.client,
		channelId: this.id,
	});
	pins = MessagesMethods.pins({ client: this.client, channelId: this.id });
	reactions = MessagesMethods.reactions({
		client: this.client,
		channelId: this.id,
	});

	static messages(ctx: MethodContext<{ channelId: string }>) {
		return {
			write: (body: MessageCreateBodyRequest) => ctx.client.messages.write(ctx.channelId, body),
			edit: (messageId: string, body: MessageUpdateBodyRequest) =>
				ctx.client.messages.edit(messageId, ctx.channelId, body),
			crosspost: (messageId: string, reason?: string) =>
				ctx.client.messages.crosspost(messageId, ctx.channelId, reason),
			delete: (messageId: string, reason?: string) => ctx.client.messages.delete(messageId, ctx.channelId, reason),
			fetch: (messageId: string) => ctx.client.messages.fetch(messageId, ctx.channelId),
			purge: (messages: string[], reason?: string) => ctx.client.messages.purge(messages, ctx.channelId, reason),
		};
	}

	static reactions(ctx: MethodContext<{ channelId: string }>) {
		return {
			add: (messageId: string, emoji: EmojiResolvable) => ctx.client.reactions.add(messageId, ctx.channelId, emoji),
			delete: (messageId: string, emoji: EmojiResolvable, userId = '@me') =>
				ctx.client.reactions.delete(messageId, ctx.channelId, emoji, userId),
			fetch: (messageId: string, emoji: EmojiResolvable, query?: RESTGetAPIChannelMessageReactionUsersQuery) =>
				ctx.client.reactions.fetch(messageId, ctx.channelId, emoji, query),
			purge: (messageId: string, emoji?: EmojiResolvable) =>
				ctx.client.reactions.purge(messageId, ctx.channelId, emoji),
		};
	}
	static pins(ctx: MethodContext<{ channelId: string }>) {
		return {
			fetch: () => ctx.client.channels.pins(ctx.channelId),
			set: (messageId: string, reason?: string) => ctx.client.channels.setPin(messageId, ctx.channelId, reason),
			delete: (messageId: string, reason?: string) => ctx.client.channels.deletePin(messageId, ctx.channelId, reason),
		};
	}

	static transformMessageBody<T>(
		body: MessageCreateBodyRequest | MessageUpdateBodyRequest,
		files: RawFile[] | undefined,
		self: UsingClient,
	) {
		const poll = (body as MessageCreateBodyRequest).poll;
		const allow = {
			allowed_mentions: self.options?.allowedMentions,
			...body,
			components: body.components?.map(x => (x instanceof ActionRow ? x.toJSON() : x)) ?? undefined,
			embeds: body.embeds?.map(x => (x instanceof Embed ? x.toJSON() : x)) ?? undefined,
			poll: poll ? (poll instanceof PollBuilder ? poll.toJSON() : poll) : undefined,
		};

		if ('attachment' in body) {
			allow.attachments =
				body.attachments?.map((x, i) => ({
					id: i,
					...resolveAttachment(x),
				})) ?? undefined;
		} else if (files?.length) {
			allow.attachments = files?.map((x, id) => ({
				id,
				filename: x.name,
			})) as RESTAPIAttachment[];
		}
		return allow as unknown as T;
	}
}

export interface TextBaseGuildChannel
	extends ObjectToLower<Omit<APITextChannel, 'type' | 'permission_overwrites'>>,
		MessagesMethods {}
@mix(MessagesMethods)
export class TextBaseGuildChannel extends BaseGuildChannel {}

export default function channelFrom(data: APIChannelBase<ChannelType>, client: UsingClient): AllChannels {
	switch (data.type) {
		case ChannelType.GuildStageVoice:
			return Transformers.StageChannel(client, data);
		case ChannelType.GuildMedia:
			return Transformers.MediaChannel(client, data);
		case ChannelType.DM:
			return Transformers.DMChannel(client, data);
		case ChannelType.GuildForum:
			return Transformers.ForumChannel(client, data);
		case ChannelType.AnnouncementThread:
		case ChannelType.PrivateThread:
		case ChannelType.PublicThread:
			return Transformers.ThreadChannel(client, data);
		case ChannelType.GuildDirectory:
			return Transformers.DirectoryChannel(client, data);
		case ChannelType.GuildVoice:
			return Transformers.VoiceChannel(client, data);
		case ChannelType.GuildText:
			return Transformers.TextGuildChannel(client, data as APIGuildChannel<ChannelType>);
		case ChannelType.GuildCategory:
			return Transformers.CategoryChannel(client, data);
		case ChannelType.GuildAnnouncement:
			return Transformers.NewsChannel(client, data);
		default:
			if ('guild_id' in data) {
				return Transformers.BaseGuildChannel(client, data as APIGuildChannel<ChannelType>);
			}
			return Transformers.BaseChannel(client, data);
	}
}

export interface TopicableGuildChannel extends BaseChannel<ChannelType> {}
export class TopicableGuildChannel extends DiscordBase {
	setTopic(topic: string | null, reason?: string) {
		return this.edit({ topic }, reason);
	}
}

export interface ThreadOnlyMethods extends BaseChannel<ChannelType>, TopicableGuildChannel {}
@mix(TopicableGuildChannel)
export class ThreadOnlyMethods extends DiscordBase {
	setTags(tags: APIGuildForumTag[], reason?: string) {
		return this.edit({ available_tags: tags }, reason);
	}

	setAutoArchiveDuration(duration: ThreadAutoArchiveDuration, reason?: string) {
		return this.edit({ default_auto_archive_duration: duration }, reason);
	}

	setReactionEmoji(emoji: APIGuildForumDefaultReactionEmoji, reason?: string) {
		return this.edit({ default_reaction_emoji: emoji }, reason);
	}

	setSortOrder(sort: SortOrderType, reason?: string) {
		return this.edit({ default_sort_order: sort }, reason);
	}

	setThreadRateLimit(rate: number, reason?: string) {
		return this.edit({ default_thread_rate_limit_per_user: rate }, reason);
	}

	async thread(body: RESTPostAPIGuildForumThreadsJSONBody, reason?: string) {
		return this.client.channels.thread(this.id, body, reason);
	}
}

export interface VoiceChannelMethods extends BaseChannel<ChannelType> {}
export class VoiceChannelMethods extends DiscordBase {
	guildId?: string;
	setBitrate(bitrate: number | null, reason?: string) {
		return this.edit({ bitrate }, reason);
	}

	setUserLimit(user_limit: number | null, reason?: string) {
		return this.edit({ user_limit: user_limit ?? 0 }, reason);
	}

	setRTC(rtc_region: string | null, reason?: string) {
		return this.edit({ rtc_region }, reason);
	}

	setVideoQuality(quality: keyof typeof VideoQualityMode, reason?: string) {
		return this.edit({ video_quality_mode: VideoQualityMode[quality] }, reason);
	}

	setVoiceState(status: string | null = null) {
		return this.client.channels.setVoiceStatus(this.id, status);
	}

	async states() {
		if (!this.guildId) return [];
		const states = await this.cache.voiceStates?.values(this.guildId);
		if (!states?.length) return [];
		const filter = states.filter(state => state.channelId === this.id);
		return filter;
	}

	public async members(force?: boolean) {
		const collection = new Collection<string, GuildMemberStructure>();

		const states = await this.states();

		for (const state of states) {
			const member = await state.member(force);
			collection.set(member.id, member);
		}

		return collection;
	}
}

export class WebhookGuildMethods extends DiscordBase {
	webhooks = WebhookGuildMethods.guild({
		client: this.client,
		guildId: this.id,
	});

	static guild(ctx: MethodContext<{ guildId: string }>) {
		return {
			list: () => ctx.client.webhooks.listFromGuild(ctx.guildId),
		};
	}
}

export class WebhookChannelMethods extends DiscordBase {
	webhooks = WebhookChannelMethods.channel({
		client: this.client,
		channelId: this.id,
	});

	static channel(ctx: MethodContext<{ channelId: string }>) {
		return {
			list: () => ctx.client.webhooks.listFromChannel(ctx.channelId),
			create: async (body: RESTPostAPIChannelWebhookJSONBody) => ctx.client.webhooks.create(ctx.channelId, body),
		};
	}
}

export interface TextGuildChannel
	extends ObjectToLower<Omit<APITextChannel, 'type' | 'permission_overwrites'>>,
		BaseGuildChannel,
		TextBaseGuildChannel,
		WebhookChannelMethods {}
@mix(TextBaseGuildChannel, WebhookChannelMethods)
export class TextGuildChannel extends BaseGuildChannel {
	declare type: ChannelType.GuildText;

	setRatelimitPerUser(rate_limit_per_user: number | null | undefined) {
		return this.edit({ rate_limit_per_user });
	}

	setNsfw(nsfw = true, reason?: string) {
		return this.edit({ nsfw }, reason);
	}
}

export interface DMChannel extends ObjectToLower<APIDMChannel>, Omit<MessagesMethods, 'edit'> {}
@mix(MessagesMethods)
export class DMChannel extends (BaseChannel<ChannelType.DM> as unknown as ToClass<
	Omit<BaseChannel<ChannelType.DM>, 'edit'>,
	DMChannel
>) {
	declare type: ChannelType.DM;
}
export interface VoiceChannel
	extends ObjectToLower<Omit<APIGuildVoiceChannel, 'permission_overwrites'>>,
		Omit<TextGuildChannel, 'type'>,
		VoiceChannelMethods,
		WebhookChannelMethods {}
@mix(TextGuildChannel, WebhookChannelMethods, VoiceChannelMethods)
export class VoiceChannel extends BaseChannel<ChannelType.GuildVoice> {
	declare type: ChannelType.GuildVoice;
}

export interface StageChannel
	extends ObjectToLower<Omit<APIGuildStageVoiceChannel, 'type'>>,
		TopicableGuildChannel,
		VoiceChannelMethods {}
@mix(TopicableGuildChannel, VoiceChannelMethods)
export class StageChannel extends BaseChannel<ChannelType> {
	declare type: ChannelType.GuildStageVoice;
}

export interface MediaChannel extends ObjectToLower<Omit<APIGuildMediaChannel, 'type'>>, ThreadOnlyMethods {}
@mix(ThreadOnlyMethods)
export class MediaChannel extends BaseChannel<ChannelType> {
	declare type: ChannelType.GuildMedia;
}

export interface ForumChannel
	extends ObjectToLower<APIGuildForumChannel>,
		Omit<ThreadOnlyMethods, 'type'>,
		WebhookChannelMethods {}
@mix(ThreadOnlyMethods, WebhookChannelMethods)
export class ForumChannel extends BaseChannel<ChannelType.GuildForum> {
	declare type: ChannelType.GuildForum;
}

export interface ThreadChannel
	extends ObjectToLower<Omit<APIThreadChannel, 'permission_overwrites'>>,
		TextBaseGuildChannel {}
@mix(TextBaseGuildChannel)
export class ThreadChannel extends BaseChannel<
	ChannelType.PublicThread | ChannelType.AnnouncementThread | ChannelType.PrivateThread
> {
	declare type: ChannelType.PublicThread | ChannelType.AnnouncementThread | ChannelType.PrivateThread;
	webhooks = WebhookChannelMethods.channel({
		client: this.client,
		channelId: this.parentId!,
	});

	async join() {
		await this.client.threads.join(this.id);
		return this;
	}

	async leave() {
		await this.client.threads.leave(this.id);
		return this;
	}

	setRatelimitPerUser(rate_limit_per_user: number | null | undefined) {
		return this.edit({ rate_limit_per_user });
	}

	pin(reason?: string) {
		return this.edit({ flags: (this.flags ?? 0) | ChannelFlags.Pinned }, reason);
	}

	unpin(reason?: string) {
		return this.edit({ flags: (this.flags ?? 0) & ~ChannelFlags.Pinned }, reason);
	}

	setTags(applied_tags: string[], reason?: string) {
		/**
		 * The available_tags field can be set when creating or updating a channel.
		 * Which determines which tags can be set on individual threads within the thread's applied_tags field.
		 */
		return this.edit({ applied_tags }, reason);
	}

	setArchived(archived = true, reason?: string) {
		return this.edit({ archived }, reason);
	}

	setAutoArchiveDuration(auto_archive_duration: StringToNumber<`${ThreadAutoArchiveDuration}`>, reason?: string) {
		return this.edit({ auto_archive_duration }, reason);
	}

	setInvitable(invitable = true, reason?: string) {
		return this.edit({ invitable }, reason);
	}

	setLocked(locked = true, reason?: string) {
		return this.edit({ locked }, reason);
	}
}

export interface CategoryChannel extends ObjectToLower<Omit<APIGuildCategoryChannel, 'permission_overwrites'>> {}

export class CategoryChannel extends (BaseGuildChannel as unknown as ToClass<
	Omit<BaseGuildChannel, 'setParent' | 'type'>,
	CategoryChannel
>) {
	declare type: ChannelType.GuildCategory;
}

export interface NewsChannel extends ObjectToLower<APINewsChannel>, WebhookChannelMethods {}
@mix(WebhookChannelMethods)
export class NewsChannel extends BaseChannel<ChannelType.GuildAnnouncement> {
	declare type: ChannelType.GuildAnnouncement;

	addFollower(webhookChannelId: string, reason?: string) {
		return this.client.guilds.channels.addFollower(this.id, webhookChannelId, reason);
	}
}

export class DirectoryChannel extends BaseChannel<ChannelType.GuildDirectory> {}

export type AllGuildChannels =
	| TextGuildChannelStructure
	| VoiceChannelStructure
	| MediaChannelStructure
	| ForumChannelStructure
	| ThreadChannelStructure
	| CategoryChannelStructure
	| NewsChannelStructure
	| DirectoryChannelStructure
	| StageChannelStructure;

export type AllTextableChannels =
	| TextGuildChannelStructure
	| VoiceChannelStructure
	| DMChannelStructure
	| NewsChannelStructure
	| ThreadChannelStructure;
export type AllGuildTextableChannels =
	| TextGuildChannelStructure
	| VoiceChannelStructure
	| NewsChannelStructure
	| ThreadChannelStructure;
export type AllGuildVoiceChannels = VoiceChannelStructure | StageChannelStructure;

export type AllChannels =
	| BaseChannelStructure
	| BaseGuildChannelStructure
	| TextGuildChannelStructure
	| DMChannelStructure
	| VoiceChannelStructure
	| MediaChannelStructure
	| ForumChannelStructure
	| ThreadChannelStructure
	| CategoryChannelStructure
	| NewsChannelStructure
	| DirectoryChannelStructure
	| StageChannelStructure;
