import type { ListenerOptions } from '../builders';
import type { BaseClient } from '../client/base';
import type {
	APIChannelMention,
	APIGuildMember,
	APIMessage,
	APIUser,
	GatewayMessageCreateDispatchData,
	ObjectToLower,
} from '../common';
import type { EmojiResolvable } from '../common/types/resolvables';
import type { MessageCreateBodyRequest, MessageUpdateBodyRequest } from '../common/types/write';
import type { ActionRowMessageComponents } from '../components';
import { MessageActionRowComponent } from '../components/ActionRow';
import { GuildMember } from './GuildMember';
import { User } from './User';
import type { MessageWebhookMethodEditParams, MessageWebhookMethodWriteParams } from './Webhook';
import { DiscordBase } from './extra/DiscordBase';
import { messageLink } from './extra/functions';

export type MessageData = APIMessage | GatewayMessageCreateDispatchData;

export interface BaseMessage
	extends DiscordBase,
		ObjectToLower<Omit<MessageData, 'timestamp' | 'author' | 'mentions' | 'components'>> {}
export class BaseMessage extends DiscordBase {
	guildId: string | undefined;
	timestamp?: number;
	author!: User;
	member?: GuildMember;
	components: MessageActionRowComponent<ActionRowMessageComponents>[];
	mentions: {
		roles: string[];
		channels: APIChannelMention[];
		users: (GuildMember | User)[];
	};

	constructor(client: BaseClient, data: MessageData) {
		super(client, data);
		this.mentions = {
			roles: data.mention_roles ?? [],
			channels: data.mention_channels ?? [],
			users: [],
		};
		this.components = data.components?.map(x => new MessageActionRowComponent(x)) ?? [];
		this.patch(data);
	}

	createComponentCollector(options?: ListenerOptions) {
		return this.client.components.createComponentCollector(this.id, options);
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
		return this.client.messages.reactions.add(this.id, this.channelId, emoji);
	}

	private patch(data: MessageData) {
		if ('guild_id' in data) {
			this.guildId = data.guild_id;
		}

		if (data.type !== undefined) {
			this.type = data.type;
		}

		if ('timestamp' in data && data.timestamp) {
			this.timestamp = Date.parse(data.timestamp);
		}

		if ('application_id' in data) {
			this.applicationId = data.application_id;
		}
		if ('author' in data && data.author) {
			this.author = new User(this.client, data.author);
		}

		if ('member' in data && data.member) {
			this.member = new GuildMember(this.client, data.member, this.author, this.guildId!);
		}

		if (data.mentions?.length) {
			this.mentions.users = this.guildId
				? data.mentions.map(
						m =>
							new GuildMember(
								this.client,
								{
									...(m as APIUser & { member?: Omit<APIGuildMember, 'user'> }).member!,
									user: m,
								},
								m,
								this.guildId!,
							),
				  )
				: data.mentions.map(u => new User(this.client, u));
		}
	}
}

export interface Message
	extends BaseMessage,
		ObjectToLower<Omit<MessageData, 'timestamp' | 'author' | 'mentions' | 'components'>> {}

export class Message extends BaseMessage {
	constructor(client: BaseClient, data: MessageData) {
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

export type EditMessageWebhook = Omit<MessageWebhookMethodEditParams, 'messageId'>;
export type WriteMessageWebhook = MessageWebhookMethodWriteParams;

export class WebhookMessage extends BaseMessage {
	constructor(
		client: BaseClient,
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
		return this.client.webhooks.messages.edit(this.webhookId, this.webhookToken, { ...body, messageId: this.id });
	}

	write(body: WriteMessageWebhook) {
		return this.client.webhooks.messages.write(this.webhookId, this.webhookToken, body);
	}

	delete(reason?: string) {
		return this.client.webhooks.messages.delete(this.webhookId, this.webhookToken, this.id, reason);
	}
}
