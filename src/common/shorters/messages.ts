import { resolveFiles } from '../../builders';
import { MessagesMethods } from '../../structures';
import type {
	RESTGetAPIChannelMessagesQuery,
	RESTPatchAPIChannelMessageJSONBody,
	RESTPostAPIChannelMessageJSONBody,
	RESTPostAPIChannelMessagesThreadsJSONBody,
} from '../../types';

import type { ValidAnswerId } from '../../api/Routes/channels';
import { Transformers } from '../../client';
import type { MessageCreateBodyRequest, MessageUpdateBodyRequest } from '../types/write';
import { BaseShorter } from './base';

export class MessageShorter extends BaseShorter {
	async write(channelId: string, { files, ...body }: MessageCreateBodyRequest) {
		const parsedFiles = files ? await resolveFiles(files) : undefined;

		const transformedBody = MessagesMethods.transformMessageBody<RESTPostAPIChannelMessageJSONBody>(
			body,
			parsedFiles,
			this.client,
		);
		return this.client.proxy
			.channels(channelId)
			.messages.post({
				body: transformedBody,
				files: parsedFiles,
			})
			.then(async message => {
				await this.client.cache.messages?.setIfNI('GuildMessages', message.id, message.channel_id, message);
				return Transformers.Message(this.client, message);
			});
	}

	async edit(messageId: string, channelId: string, { files, ...body }: MessageUpdateBodyRequest) {
		const parsedFiles = files ? await resolveFiles(files) : undefined;
		return this.client.proxy
			.channels(channelId)
			.messages(messageId)
			.patch({
				body: MessagesMethods.transformMessageBody<RESTPatchAPIChannelMessageJSONBody>(body, parsedFiles, this.client),
				files: parsedFiles,
			})
			.then(async message => {
				await this.client.cache.messages?.setIfNI('GuildMessages', message.id, message.channel_id, message);
				return Transformers.Message(this.client, message);
			});
	}

	crosspost(messageId: string, channelId: string, reason?: string) {
		return this.client.proxy
			.channels(channelId)
			.messages(messageId)
			.crosspost.post({ reason })
			.then(async m => {
				await this.client.cache.messages?.setIfNI('GuildMessages', m.id, m.channel_id, m);
				return Transformers.Message(this.client, m);
			});
	}

	delete(messageId: string, channelId: string, reason?: string) {
		return this.client.proxy
			.channels(channelId)
			.messages(messageId)
			.delete({ reason })
			.then(async () => {
				await this.client.cache.messages?.removeIfNI('GuildMessages', messageId, channelId);
				this.client.components.deleteValue(messageId, 'messageDelete');
			});
	}

	async fetch(messageId: string, channelId: string, force = false) {
		if (!force) {
			const message = await this.client.cache.messages?.get(messageId);
			if (message) return message;
		}

		return this.client.proxy
			.channels(channelId)
			.messages(messageId)
			.get()
			.then(async x => {
				await this.client.cache.messages?.set(x.id, x.channel_id, x);
				return Transformers.Message(this.client, x);
			});
	}

	purge(messages: string[], channelId: string, reason?: string) {
		return this.client.proxy
			.channels(channelId)
			.messages['bulk-delete'].post({ body: { messages }, reason })
			.then(() => this.client.cache.messages?.removeIfNI('GuildMessages', messages, channelId));
	}

	thread(
		channelId: string,
		messageId: string,
		options: RESTPostAPIChannelMessagesThreadsJSONBody & { reason?: string },
	) {
		return this.client.threads.fromMessage(channelId, messageId, options);
	}

	endPoll(channelId: string, messageId: string) {
		return this.client.proxy
			.channels(channelId)
			.polls(messageId)
			.expire.post()
			.then(message => Transformers.Message(this.client, message));
	}

	getAnswerVoters(channelId: string, messageId: string, answerId: ValidAnswerId) {
		return this.client.proxy
			.channels(channelId)
			.polls(messageId)
			.answers(answerId)
			.get()
			.then(data => data.users.map(user => Transformers.User(this.client, user)));
	}

	list(channelId: string, fetchOptions: RESTGetAPIChannelMessagesQuery) {
		return this.client.proxy
			.channels(channelId)
			.messages.get({ query: fetchOptions })
			.then(messages => messages.map(message => Transformers.Message(this.client, message)));
	}
}
