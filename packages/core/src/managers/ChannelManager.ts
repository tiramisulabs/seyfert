import {
	APIChannel,
	APIMessage,
	RESTPostAPIChannelMessageJSONBody,
	APIWebhook,
	RESTPatchAPIChannelJSONBody,
	RESTGetAPIChannelThreadsArchivedQuery
} from '@biscuitland/common';

import { Session } from '../session';

export class ChannelManager {
	readonly session!: Session;
	constructor(session: Session) {
		Object.defineProperty(this, 'session', {
			value: session,
			writable: false
		});
	}

	async fetch<T extends APIChannel = APIChannel>(id: string): Promise<T> {
		return (await this.session.api.channels(id).get()) as T;
	}

	async fetchWebhooks(channelId: string): Promise<Map<string, APIWebhook> | null> {
		const webhooks = await this.session.api.channels(channelId).webhooks.get();

		if (!webhooks.length) return null;

		return webhooks.reduce((data, webhook) => data.set(webhook.id, webhook), new Map());
	}

	async modify(id: string, data: RESTPatchAPIChannelJSONBody) {
		return this.session.api.channels(id).patch({ body: data });
	}

	async delete(id: string) {
		return this.session.api.channels(id).delete();
	}

	async fetchMessages(id: string, limit = 50): Promise<Map<string, APIMessage> | null> {
		const messages = await this.session.api.channels(id).messages.get({
			query: { limit }
		});

		if (!messages.length) return null;

		return messages.reduce((data, message) => data.set(message.id, message), new Map());
	}

	async fetchMessage(id: string, messageId: string) {
		return this.session.api.channels(id).messages(messageId).get();
	}

	async createMessage(id: string, data: RESTPostAPIChannelMessageJSONBody) {
		return this.session.api.channels(id).messages.post({ body: data });
	}

	async sendTyping(id: string) {
		await this.session.api.channels(id).typing.post();
	}

	async getArchivedThreads(channelId: string, options: RESTGetAPIChannelThreadsArchivedOptions) {
		const { type, ...query } = options;
		if (type === 'private') {
			return this.session.api.channels(channelId).threads.archived.private.get({ query });
		}

		return this.session.api.channels(channelId).threads.archived.public.get({ query });
	}
}

export type RESTGetAPIChannelThreadsArchivedOptions = ({ type: 'private' } | { type: 'public' }) &
	RESTGetAPIChannelThreadsArchivedQuery;
