import { type AllChannels, Embed, type ReturnCache, componentFactory } from '..';
import type { ListenerOptions } from '../builders';
import {
	type GuildMemberStructure,
	type GuildStructure,
	type MessageStructure,
	type PollStructure,
	Transformers,
	type UserStructure,
	type WebhookMessageStructure,
	type WebhookStructure,
} from '../client/transformers';
import type { UsingClient } from '../commands';
import { type ObjectToLower, toCamelCase } from '../common';
import { Formatter } from '../common';
import type { EmojiResolvable } from '../common/types/resolvables';
import type { MessageCreateBodyRequest, MessageUpdateBodyRequest } from '../common/types/write';
import type { TopLevelComponents } from '../components';
import type {
	APIChannelMention,
	APIEmbed,
	APIGuildMember,
	APIMessage,
	APIUser,
	GatewayMessageCreateDispatchData,
} from '../types';
import type { MessageWebhookMethodEditParams, MessageWebhookMethodWriteParams } from './Webhook';
import { DiscordBase } from './extra/DiscordBase';

export type MessageData = APIMessage | GatewayMessageCreateDispatchData;

export interface BaseMessage
	extends DiscordBase,
		ObjectToLower<Omit<MessageData, 'timestamp' | 'author' | 'mentions' | 'components' | 'poll' | 'embeds'>> {
	timestamp?: number;
	guildId?: string;
	author: UserStructure;
	member?: GuildMemberStructure;
	components: TopLevelComponents[];
	poll?: PollStructure;
	mentions: {
		roles: string[];
		channels: APIChannelMention[];
		users: (GuildMemberStructure | UserStructure)[];
	};
}
export class BaseMessage extends DiscordBase {
	embeds: InMessageEmbed[];

	constructor(client: UsingClient, data: MessageData) {
		super(client, data);
		this.mentions = {
			roles: data.mention_roles ?? [],
			channels: data.mention_channels ?? [],
			users: [],
		};
		this.components = (data.components?.map(componentFactory) as TopLevelComponents[]) ?? [];
		this.embeds = data.embeds.map(embed => new InMessageEmbed(embed));
		this.patch(data);
	}

	get user(): UserStructure {
		return this.author;
	}

	createComponentCollector(options?: ListenerOptions) {
		return this.client.components.createComponentCollector(this.id, this.channelId, this.guildId, options);
	}

	get url() {
		return Formatter.messageLink(this.guildId ?? '@me', this.channelId, this.id);
	}

	guild(mode?: 'rest' | 'flow'): Promise<GuildStructure<'cached' | 'api'> | undefined>;
	guild(mode: 'cache'): ReturnCache<GuildStructure<'cached'> | undefined>;
	guild(mode: 'cache' | 'rest' | 'flow' = 'flow') {
		if (!this.guildId)
			return (
				mode === 'cache' ? (this.client.cache.adapter.isAsync ? Promise.resolve() : undefined) : Promise.resolve()
			) as any;
		switch (mode) {
			case 'cache':
				return (
					this.client.cache.guilds?.get(this.guildId) ||
					(this.client.cache.adapter.isAsync ? (Promise.resolve() as any) : undefined)
				);
			default:
				return this.client.guilds.fetch(this.guildId, mode === 'rest');
		}
	}

	channel(mode?: 'rest' | 'flow'): Promise<AllChannels>;
	channel(mode: 'cache'): ReturnCache<AllChannels | undefined>;
	channel(mode: 'cache' | 'rest' | 'flow' = 'flow') {
		switch (mode) {
			case 'cache':
				return (
					this.client.cache.channels?.get(this.channelId) ||
					(this.client.cache.adapter.isAsync ? (Promise.resolve() as any) : undefined)
				);
			default:
				return this.client.channels.fetch(this.channelId, mode === 'rest');
		}
	}

	react(emoji: EmojiResolvable) {
		return this.client.reactions.add(this.id, this.channelId, emoji);
	}

	private patch(data: MessageData) {
		if ('timestamp' in data && data.timestamp) {
			this.timestamp = Date.parse(data.timestamp);
		}

		if ('author' in data && data.author) {
			this.author = Transformers.User(this.client, data.author);
		}

		if ('member' in data && data.member) {
			this.member = Transformers.GuildMember(this.client, data.member, data.author, this.guildId!);
		}

		if (data.mentions?.length) {
			this.mentions.users = this.guildId
				? data.mentions.map(m =>
						Transformers.GuildMember(
							this.client,
							{
								...(m as APIUser & { member?: Omit<APIGuildMember, 'user'> }).member!,
								user: m,
							},
							m,
							this.guildId!,
						),
					)
				: data.mentions.map(u => Transformers.User(this.client, u));
		}

		if (data.poll) {
			this.poll = Transformers.Poll(this.client, data.poll, this.channelId, this.id);
		}
	}
}

export interface Message
	extends BaseMessage,
		ObjectToLower<Omit<MessageData, 'timestamp' | 'author' | 'mentions' | 'components' | 'poll' | 'embeds'>> {}

export class Message extends BaseMessage {
	constructor(client: UsingClient, data: MessageData) {
		super(client, data);
	}

	fetch(force = false): Promise<MessageStructure> {
		return this.client.messages.fetch(this.id, this.channelId, force);
	}

	reply(body: Omit<MessageCreateBodyRequest, 'message_reference'>, fail = true): Promise<MessageStructure> {
		return this.write({
			...body,
			message_reference: {
				message_id: this.id,
				channel_id: this.channelId,
				guild_id: this.guildId,
				fail_if_not_exists: fail,
			},
		});
	}

	edit(body: MessageUpdateBodyRequest): Promise<MessageStructure> {
		return this.client.messages.edit(this.id, this.channelId, body);
	}

	write(body: MessageCreateBodyRequest): Promise<MessageStructure> {
		return this.client.messages.write(this.channelId, body);
	}

	delete(reason?: string) {
		return this.client.messages.delete(this.id, this.channelId, reason);
	}

	crosspost(reason?: string): Promise<MessageStructure> {
		return this.client.messages.crosspost(this.id, this.channelId, reason);
	}
}

export type EditMessageWebhook = Omit<MessageWebhookMethodEditParams, 'messageId'>['body'] &
	Pick<MessageWebhookMethodEditParams, 'query'>;
export type WriteMessageWebhook = MessageWebhookMethodWriteParams['body'] &
	Pick<MessageWebhookMethodWriteParams, 'query'>;

export class WebhookMessage extends BaseMessage {
	constructor(
		client: UsingClient,
		data: MessageData,
		readonly webhookId: string,
		readonly webhookToken: string,
	) {
		super(client, data);
	}

	fetchWebhook(): Promise<WebhookStructure> {
		return this.client.webhooks.fetch(this.webhookId, this.webhookToken);
	}

	fetch(): Promise<WebhookMessageStructure> {
		return this.client.webhooks.fetchMessage(this.webhookId, this.webhookToken, this.id, this.thread?.id);
	}

	edit(body: EditMessageWebhook): Promise<WebhookMessageStructure> {
		const { query, ...rest } = body;
		return this.client.webhooks.editMessage(this.webhookId, this.webhookToken, {
			body: rest,
			query,
			messageId: this.id,
		});
	}

	write(body: WriteMessageWebhook): Promise<WebhookMessageStructure | null> {
		const { query, ...rest } = body;
		return this.client.webhooks.writeMessage(this.webhookId, this.webhookToken, {
			body: rest,
			query,
		});
	}

	delete(reason?: string) {
		return this.client.webhooks.deleteMessage(this.webhookId, this.webhookToken, this.id, reason);
	}
}

export class InMessageEmbed {
	constructor(public data: APIEmbed) {}

	get title() {
		return this.data.title;
	}

	get type() {
		return this.data.type;
	}

	get description() {
		return this.data.description;
	}

	get url() {
		return this.data.url;
	}

	get timestamp() {
		return this.data.timestamp;
	}

	get color() {
		return this.data.color;
	}

	get footer() {
		return this.data.footer ? toCamelCase(this.data.footer) : undefined;
	}

	get image() {
		return this.data.image ? toCamelCase(this.data.image) : undefined;
	}

	get thumbnail() {
		return this.data.thumbnail ? toCamelCase(this.data.thumbnail) : undefined;
	}

	get video() {
		return this.data.video ? toCamelCase(this.data.video) : undefined;
	}

	get provider() {
		return this.data.provider;
	}

	get author() {
		return this.data.author ? toCamelCase(this.data.author) : undefined;
	}

	get fields() {
		return this.data.fields;
	}

	toBuilder() {
		return new Embed(this.data);
	}

	toJSON() {
		return { ...this.data };
	}
}
