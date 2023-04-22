import {
	APIAttachment,
	APIMessageActionRowComponent,
	ObjectToSnake,
	APIChannel,
	APIEmbed,
	APIMessage,
	APIWebhook,
	RESTPatchAPIChannelJSONBody,
} from "@biscuitland/common";
import { DJS } from "@biscuitland/rest";

import { Session } from "../../session";
import { objectToParams } from "../../utils/utils";

export class ChannelManager {
	readonly session!: Session;
	constructor(session: Session) {
		Object.defineProperty(this, "session", {
			value: session,
			writable: false,
		});
	}

	async fetch(id: string): Promise<APIChannel> {
		return this.session.api.channels(id).get();
	}

	async fetchWebhooks(channelId: string): Promise<Map<string, APIWebhook> | null> {
		const webhooks = await this.session.api.channels(channelId).webhooks.get<APIWebhook[]>();

		if (!webhooks.length) return null;

		return webhooks.reduce((data, webhook) => data.set(webhook.id, webhook), new Map());
	}

	async modify(id: string, data: RESTPatchAPIChannelJSONBody): Promise<APIChannel> {
		return this.session.api.channels(id).patch({ body: data });
	}

	async delete(id: string) {
		return this.session.api.channels(id).delete<APIChannel>();
	}

	async fetchMessages(id: string, limit = 50): Promise<Map<string, APIMessage> | null> {
		const messages = await this.session.api
			.channels(id)
			.messages()
			.get<APIMessage[]>({
				query: objectToParams({ limit }),
			});

		if (!messages.length) return null;

		return messages.reduce((data, message) => data.set(message.id, message), new Map());
	}

	async fetchMessage(id: string, messageId: string) {
		return this.session.api.channels(id).messages(messageId).get<APIMessage>();
	}
	async createMessage(id: string, data: ObjectToSnake<ChannelCreateMessage>) {
		return this.session.api.channels(id).messages().post<APIMessage>({ body: data });
	}

	async sendTyping(id: string) {
		await this.session.api.channels(id).typing.post();
	}
}

/**
 * @link https://discord.com/developers/docs/resources/channel#allowed-mentions-object
 */
export interface ChannelMessageAllowedMentions {
	parse?: ("roles" | "users" | "everyone")[];
	users?: string[];
	roles?: string[];
	repliedUser?: boolean;
}

/**
 * @link https://discord.com/developers/docs/resources/channel#message-reference-object-message-reference-structure
 */
export interface ChannelMessageReference {
	messageId?: string;
	channelId?: string;
	guildId?: string;
	failIfNotExists?: boolean;
}

/**
 * @link https://discord.com/developers/docs/resources/channel#create-message
 */
export interface ChannelCreateMessage {
	content?: string;
	nonce?: string | number;
	tts?: boolean;
	embeds?: APIEmbed[];
	allowedMentions?: ObjectToSnake<ChannelMessageAllowedMentions>;
	messageReference?: ObjectToSnake<ChannelMessageReference>;
	components?: APIMessageActionRowComponent[];
	stickerIds?: string[];
	files?: DJS.RawFile[];
	payloadJson?: string;
	attachment?: APIAttachment[];
	flags?: number;
}
