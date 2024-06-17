import type { RESTGetAPIChannelMessageReactionUsersQuery } from 'discord-api-types/v10';
import { encodeEmoji, resolveEmoji } from '../../structures/extra/functions';
import type { EmojiResolvable } from '../types/resolvables';
import { BaseShorter } from './base';
import { Transformers, type UserStructure } from '../../client/transformers';

export class ReactionShorter extends BaseShorter {
	async add(messageId: string, channelId: string, emoji: EmojiResolvable): Promise<void> {
		const rawEmoji = await resolveEmoji(emoji, this.client.cache);

		if (!rawEmoji) {
			throw new Error('Emoji no resolvable');
		}

		return this.client.proxy.channels(channelId).messages(messageId).reactions(encodeEmoji(rawEmoji))('@me').put({});
	}

	async delete(messageId: string, channelId: string, emoji: EmojiResolvable, userId = '@me'): Promise<void> {
		const rawEmoji = await resolveEmoji(emoji, this.client.cache);

		if (!rawEmoji) {
			throw new Error('Emoji no resolvable');
		}

		return this.client.proxy.channels(channelId).messages(messageId).reactions(encodeEmoji(rawEmoji))(userId).delete();
	}

	async fetch(
		messageId: string,
		channelId: string,
		emoji: EmojiResolvable,
		query?: RESTGetAPIChannelMessageReactionUsersQuery,
	): Promise<UserStructure[]> {
		const rawEmoji = await resolveEmoji(emoji, this.client.cache);

		if (!rawEmoji) {
			throw new Error('Emoji no resolvable');
		}

		return this.client.proxy
			.channels(channelId)
			.messages(messageId)
			.reactions(encodeEmoji(rawEmoji))
			.get({ query })
			.then(u => u.map(user => Transformers.User(this.client, user)));
	}

	async purge(messageId: string, channelId: string, emoji?: EmojiResolvable): Promise<void> {
		if (!emoji) {
			return this.client.proxy.channels(channelId).messages(messageId).reactions.delete();
		}
		const rawEmoji = await resolveEmoji(emoji, this.client.cache);

		if (!rawEmoji) {
			throw new Error('Emoji no resolvable');
		}

		return this.client.proxy.channels(channelId).messages(messageId).reactions(encodeEmoji(rawEmoji)).delete();
	}
}
