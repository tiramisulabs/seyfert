import {
	APIChannel,
	APIMessage,
	RESTPostAPIChannelMessageJSONBody,
	APIWebhook,
	RESTPatchAPIChannelJSONBody,
} from "@biscuitland/common";

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
	async createMessage(id: string, data: RESTPostAPIChannelMessageJSONBody) {
		return this.session.api.channels(id).messages().post<APIMessage>({ body: data });
	}

	async sendTyping(id: string) {
		await this.session.api.channels(id).typing.post();
	}
}
