import type {
	RESTPatchAPIChannelMessageJSONBody,
	RESTPostAPIChannelMessageJSONBody,
	RESTPostAPIChannelMessagesThreadsJSONBody,
} from 'discord-api-types/v10';
import { resolveFiles } from '../../builders';
import { Message, MessagesMethods, ThreadChannel } from '../../structures';
import type { MessageCreateBodyRequest, MessageUpdateBodyRequest } from '../types/write';
import { BaseShorter } from './base';

export class MessageShorter extends BaseShorter {
	async write(channelId: string, { files, ...body }: MessageCreateBodyRequest) {
		const parsedFiles = files ? await resolveFiles(files) : [];

		const transformedBody = MessagesMethods.transformMessageBody<RESTPostAPIChannelMessageJSONBody>(body);
		return this.client.proxy
			.channels(channelId)
			.messages.post({
				body: transformedBody,
				files: parsedFiles,
			})
			.then(message => {
				return new Message(this.client, message);
			});
	}
	async edit(messageId: string, channelId: string, { files, ...body }: MessageUpdateBodyRequest) {
		const parsedFiles = files ? await resolveFiles(files) : [];
		return this.client.proxy
			.channels(channelId)
			.messages(messageId)
			.patch({
				body: MessagesMethods.transformMessageBody<RESTPatchAPIChannelMessageJSONBody>(body),
				files: parsedFiles,
			})
			.then(message => {
				return new Message(this.client, message);
			});
	}

	crosspost(messageId: string, channelId: string, reason?: string) {
		return this.client.proxy
			.channels(channelId)
			.messages(messageId)
			.crosspost.post({ reason })
			.then(m => new Message(this.client, m));
	}
	delete(messageId: string, channelId: string, reason?: string) {
		return this.client.proxy
			.channels(channelId)
			.messages(messageId)
			.delete({ reason })
			.then(() => {
				return this.client.components.onMessageDelete(messageId);
			});
	}
	fetch(messageId: string, channelId: string) {
		return this.client.proxy
			.channels(channelId)
			.messages(messageId)
			.get()
			.then(x => new Message(this.client, x));
	}
	purge(messages: string[], channelId: string, reason?: string) {
		return this.client.proxy.channels(channelId).messages['bulk-delete'].post({ body: { messages }, reason });
	}

	thread(
		channelId: string,
		messageId: string,
		options: RESTPostAPIChannelMessagesThreadsJSONBody & { reason?: string },
	) {
		const { reason, ...body } = options;

		return this.client.proxy
			.channels(channelId)
			.messages(messageId)
			.threads.post({ body, reason })
			.then(x => new ThreadChannel(this.client, x));
	}
}
