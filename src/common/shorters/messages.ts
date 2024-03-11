import type {
	RESTGetAPIChannelMessageReactionUsersQuery,
	RESTPatchAPIChannelMessageJSONBody,
	RESTPostAPIChannelMessageJSONBody,
} from 'discord-api-types/v10';
import { resolveFiles } from '../../builders';
import { Message, MessagesMethods, User } from '../../structures';
import { encodeEmoji, resolveEmoji } from '../../structures/extra/functions';
import type { EmojiResolvable } from '../types/resolvables';
import type { MessageCreateBodyRequest, MessageUpdateBodyRequest } from '../types/write';
import { BaseShorter } from './base';

export class MessageShorter extends BaseShorter {
	get messages() {
		return {
			write: async (channelId: string, { files, ...body }: MessageCreateBodyRequest) => {
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
			},
			edit: async (messageId: string, channelId: string, { files, ...body }: MessageUpdateBodyRequest) => {
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
			},
			crosspost: (messageId: string, channelId: string, reason?: string) => {
				return this.client.proxy
					.channels(channelId)
					.messages(messageId)
					.crosspost.post({ reason })
					.then(m => new Message(this.client, m));
			},
			delete: (messageId: string, channelId: string, reason?: string) => {
				return this.client.proxy
					.channels(channelId)
					.messages(messageId)
					.delete({ reason })
					.then(() => {
						return this.client.components.onMessageDelete(messageId);
					});
			},
			fetch: async (messageId: string, channelId: string) => {
				return this.client.proxy
					.channels(channelId)
					.messages(messageId)
					.get()
					.then(x => new Message(this.client, x));
			},
			purge: (messages: string[], channelId: string, reason?: string) => {
				return this.client.proxy.channels(channelId).messages['bulk-delete'].post({ body: { messages }, reason });
			},
			reactions: this.reactions,
		};
	}

	get reactions() {
		return {
			add: async (messageId: string, channelId: string, emoji: EmojiResolvable) => {
				const rawEmoji = await resolveEmoji(emoji, this.client.cache);

				if (!rawEmoji) {
					throw new Error('Emoji no resolvable');
				}

				return this.client.proxy
					.channels(channelId)
					.messages(messageId)
					.reactions(encodeEmoji(rawEmoji))('@me')
					.put({});
			},
			delete: async (messageId: string, channelId: string, emoji: EmojiResolvable, userId = '@me') => {
				const rawEmoji = await resolveEmoji(emoji, this.client.cache);

				if (!rawEmoji) {
					throw new Error('Emoji no resolvable');
				}

				return this.client.proxy
					.channels(channelId)
					.messages(messageId)
					.reactions(encodeEmoji(rawEmoji))(userId)
					.delete();
			},
			fetch: async (
				messageId: string,
				channelId: string,
				emoji: EmojiResolvable,
				query?: RESTGetAPIChannelMessageReactionUsersQuery,
			) => {
				const rawEmoji = await resolveEmoji(emoji, this.client.cache);

				if (!rawEmoji) {
					throw new Error('Emoji no resolvable');
				}

				return this.client.proxy
					.channels(channelId)
					.messages(messageId)
					.reactions(encodeEmoji(rawEmoji))
					.get({ query })
					.then(u => u.map(user => new User(this.client, user)));
			},
			purge: async (messageId: string, channelId: string, emoji?: EmojiResolvable) => {
				if (!emoji) {
					return this.client.proxy.channels(channelId).messages(messageId).reactions.delete();
				}
				const rawEmoji = await resolveEmoji(emoji, this.client.cache);

				if (!rawEmoji) {
					throw new Error('Emoji no resolvable');
				}

				return this.client.proxy.channels(channelId).messages(messageId).reactions(encodeEmoji(rawEmoji)).delete();
			},
		};
	}
}
