import { ObjectToLower } from "@biscuitland/common";
import { APIChannel, APIEmbed, APIMessage, APIWebhook, RESTPatchAPIChannelJSONBody } from "discord-api-types/v10";
import { Session } from "../../session";
import { BiscuitActionRowMessageComponents } from "../../utils/types";
import { Message, MessageActionRowComponent } from "../mod";
import { Webhook } from "../Webhook";

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

	async fetchWebhooks(channelId: string): Promise<Map<string, Webhook> | null> {
		const webhooks = await this.session.api.channels(channelId).webhooks.get<APIWebhook[]>();

		if (!webhooks.length) return null;

		return webhooks.reduce((data, webhook) => data.set(webhook.id, new Webhook(this.session, webhook)), new Map());
	}

	async modify(id: string, data: ObjectToLower<RESTPatchAPIChannelJSONBody>): Promise<APIChannel> {
		return this.session.api.channels(id).patch({ body: data });
	}

	async delete(id: string): Promise<APIChannel> {
		return this.session.api.channels(id).delete();
	}

	async fetchMessages(id: string, limit = 50): Promise<Map<string, Message>> {
		const messages = await this.session.api
			.channels(id)
			.messages()
			.get<APIMessage[]>({ query: this.session.utils.objectToParams({ limit }) });

		return messages.reduce((data, message) => data.set(message.id, new Message(this.session, message)), new Map());
	}

	async fetchMessage(id: string, messageId: string): Promise<Message | null> {
		const message = await this.session.api.channels(id).messages(messageId).get<APIMessage>();

		if (!message) return null;
		return new Message(this.session, message);
	}

	async createMessage(id: string, data: ChannelCreateMessage): Promise<Message> {
		const message = await this.session.api.channels(id).messages().post<APIMessage>({ body: data });
		return new Message(this.session, message);
	}

	async sendTyping(id: string): Promise<void> {
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
	allowedMentions?: ChannelMessageAllowedMentions;
	messageReference?: ChannelMessageReference;
	components?: MessageActionRowComponent<BiscuitActionRowMessageComponents>[];
	stickerIds?: string[];
	files?: any; // TODO
	payloadJson?: string;
	attachment?: any[]; // TODO
	flags?: number;
}
