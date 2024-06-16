import type {
	APIChannelMention,
	APIEmbed,
	APIGuildMember,
	APIMessage,
	APIUser,
	GatewayMessageCreateDispatchData,
} from 'discord-api-types/v10';
import type { ListenerOptions } from '../builders';
import type { UsingClient } from '../commands';
import { toCamelCase, type ObjectToLower } from '../common';
import type { EmojiResolvable } from '../common/types/resolvables';
import type { MessageCreateBodyRequest, MessageUpdateBodyRequest } from '../common/types/write';
import type { ActionRowMessageComponents } from '../components';
import { MessageActionRowComponent } from '../components/ActionRow';
import type { MessageWebhookMethodEditParams, MessageWebhookMethodWriteParams } from './Webhook';
import { DiscordBase } from './extra/DiscordBase';
import { messageLink } from './extra/functions';
import { Embed } from '..';
import {
	type PollStructure,
	Transformers,
	type GuildMemberStructure,
	type UserStructure,
} from '../client/transformers';

export type MessageData = APIMessage | GatewayMessageCreateDispatchData;

export interface BaseMessage
	extends DiscordBase,
		ObjectToLower<Omit<MessageData, 'timestamp' | 'author' | 'mentions' | 'components' | 'poll' | 'embeds'>> {
	timestamp?: number;
	guildId?: string;
	author: UserStructure;
	member?: GuildMemberStructure;
	components: MessageActionRowComponent<ActionRowMessageComponents>[];
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
		this.components = data.components?.map(x => new MessageActionRowComponent(x)) ?? [];
		this.embeds = data.embeds.map(embed => new InMessageEmbed(embed));
		this.patch(data);
	}

	get user() {
		return this.author;
	}

	createComponentCollector(options?: ListenerOptions) {
		return this.client.components!.createComponentCollector(this.id, options);
	}

	get url() {
		return messageLink(this.channelId, this.id, this.guildId);
	}

	guild(force = false) {
		if (!this.guildId) return;
		return this.client.guilds.fetch(this.guildId, force);
	}

	async channel(force = false) {
		return this.client.channels.fetch(this.channelId, force);
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

	fetch() {
		return this.client.messages.fetch(this.id, this.channelId);
	}

	reply(body: Omit<MessageCreateBodyRequest, 'message_reference'>, fail = true) {
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

	edit(body: MessageUpdateBodyRequest) {
		return this.client.messages.edit(this.id, this.channelId, body);
	}

	write(body: MessageCreateBodyRequest) {
		return this.client.messages.write(this.channelId, body);
	}

	delete(reason?: string) {
		return this.client.messages.delete(this.id, this.channelId, reason);
	}

	crosspost(reason?: string) {
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

	fetch() {
		return this.api.webhooks(this.webhookId)(this.webhookToken).get({ query: this.thread?.id });
	}

	edit(body: EditMessageWebhook) {
		const { query, ...rest } = body;
		return this.client.webhooks.editMessage(this.webhookId, this.webhookToken, {
			body: rest,
			query,
			messageId: this.id,
		});
	}

	write(body: WriteMessageWebhook) {
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

	/**
	 * @deprecated
	 */
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
