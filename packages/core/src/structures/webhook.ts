import type { Model } from './base';
import type { Session } from '../biscuit';
import type { Snowflake } from '../snowflakes';
import type {
	DiscordEmbed,
	DiscordMessage,
	DiscordMessageComponents,
	DiscordWebhook,
	FileContent,
	WebhookTypes,
	WebhookOptions,
} from '@biscuitland/api-types';
import type { Attachment } from './attachment';
import type { AllowedMentions, CreateMessage } from './message';
import { User } from './user';
import { Message } from './message';
import { Util } from '../utils/util';
import {
	WEBHOOK,
	WEBHOOK_TOKEN,
	WEBHOOK_MESSAGE,
	WEBHOOK_MESSAGE_ORIGINAL,
} from '@biscuitland/api-types';
import { NewEmbed } from './embed';

export type ExecuteWebhookOptions = WebhookOptions &
	CreateMessage & { avatarUrl?: string; username?: string };
export type EditMessageWithThread = EditWebhookMessage & {
	threadId?: Snowflake;
};

/**
 * @link https://discord.com/developers/docs/resources/webhook#edit-webhook-message-jsonform-params
 */
export interface EditWebhookMessage {
	content?: string;
	embeds?: DiscordEmbed[];
	files?: FileContent[];
	allowedMentions?: AllowedMentions;
	attachments?: Attachment[];
	components?: DiscordMessageComponents;
}

export class Webhook implements Model {
	constructor(session: Session, data: DiscordWebhook) {
		this.session = session;
		this.id = data.id;
		this.type = data.type;
		this.token = data.token;

		if (data.avatar) {
			this.avatar = Util.iconHashToBigInt(data.avatar);
		}

		if (data.user) {
			this.user = new User(session, data.user);
		}

		if (data.guild_id) {
			this.guildId = data.guild_id;
		}

		if (data.channel_id) {
			this.channelId = data.channel_id;
		}

		if (data.application_id) {
			this.applicationId = data.application_id;
		}
	}

	readonly session: Session;
	readonly id: Snowflake;
	type: WebhookTypes;
	token?: string;
	avatar?: bigint;
	applicationId?: Snowflake;
	channelId?: Snowflake;
	guildId?: Snowflake;
	user?: User;

	async execute(
		options?: ExecuteWebhookOptions
	): Promise<Message | undefined> {
		if (!this.token) {
			return;
		}

		const data = {
			content: options?.content,
			embeds: options?.embeds?.map(NewEmbed),
			tts: options?.tts,
			allowed_mentions: options?.allowedMentions,
			components: options?.components,
			file: options?.files,
		};

		const message = await this.session.rest.post<DiscordMessage>(
			WEBHOOK(this.id, this.token, {
				wait: options?.wait,
				threadId: options?.threadId,
			}),
			data
		);

		return options?.wait ?? true
			? new Message(this.session, message)
			: undefined;
	}

	async fetch(): Promise<Webhook> {
		const message = await this.session.rest.get<DiscordWebhook>(
			WEBHOOK_TOKEN(this.id, this.token)
		);

		return new Webhook(this.session, message);
	}

	async fetchMessage(
		messageId: Snowflake,
		threadId?: Snowflake
	): Promise<Message | undefined> {
		if (!this.token) {
			return;
		}

		const message = await this.session.rest.get<DiscordMessage>(
			WEBHOOK_MESSAGE(this.id, this.token, messageId, { threadId })
		);

		return new Message(this.session, message);
	}

	async deleteMessage(
		messageId: Snowflake,
		threadId?: Snowflake
	): Promise<void> {
		if (!this.token) {
			throw new Error('No token found');
		}

		await this.session.rest.delete<undefined>(
			WEBHOOK_MESSAGE(this.id, this.token, messageId, { threadId }),
			{}
		);
	}

	async editMessage(
		messageId?: Snowflake,
		options?: EditMessageWithThread
	): Promise<Message> {
		if (!this.token) {
			throw new Error('No token found');
		}

		const message = await this.session.rest.patch<DiscordMessage>(
			messageId
				? WEBHOOK_MESSAGE(this.id, this.token, messageId)
				: WEBHOOK_MESSAGE_ORIGINAL(this.id, this.token),
			{
				content: options?.content,
				embeds: options?.embeds?.map(NewEmbed),
				file: options?.files,
				components: options?.components,
				allowed_mentions: options?.allowedMentions && {
					parse: options?.allowedMentions.parse,
					replied_user: options?.allowedMentions.repliedUser,
					users: options?.allowedMentions.users,
					roles: options?.allowedMentions.roles,
				},
				attachments: options?.attachments?.map(attachment => {
					return {
						id: attachment.id,
						filename: attachment.name,
						content_type: attachment.contentType,
						size: attachment.size,
						url: attachment.attachment,
						proxy_url: attachment.proxyUrl,
						height: attachment.height,
						width: attachment.width,
						ephemeral: attachment.ephemeral,
					};
				}),
			}
		);

		return new Message(this.session, message);
	}
}
