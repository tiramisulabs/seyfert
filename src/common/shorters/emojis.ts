import { resolveImage } from '../../builders';
import { CacheFrom } from '../../cache';
import { type GuildEmojiStructure, Transformers } from '../../client/transformers';
import type { APIEmoji, RESTPatchAPIGuildEmojiJSONBody, RESTPostAPIGuildEmojiJSONBody } from '../../types';
import type { ImageResolvable } from '../types/resolvables';
import type { OmitInsert } from '../types/util';
import { BaseShorter } from './base';

export class EmojiShorter extends BaseShorter {
	/**
	 * Retrieves a list of emojis in the guild.
	 * @param guildId The ID of the guild.
	 * @param force Whether to force fetching emojis from the API even if they exist in the cache.
	 * @returns A Promise that resolves to an array of emojis.
	 */
	async list(guildId: string, force = false): Promise<GuildEmojiStructure[]> {
		if (!force) {
			const cached = (await this.client.cache.emojis?.values(guildId)) as GuildEmojiStructure[] | undefined;
			if (cached?.length) return cached;
		}
		const emojis = await this.client.proxy.guilds(guildId).emojis.get();
		await this.client.cache.emojis?.set(
			CacheFrom.Rest,
			emojis.map<[string, APIEmoji]>(x => [x.id!, x]),
			guildId,
		);
		return emojis.map(m => Transformers.GuildEmoji(this.client, m, guildId));
	}

	/**
	 * Creates a new emoji in the guild.
	 * @param guildId The ID of the guild.
	 * @param body The data for creating the emoji.
	 * @returns A Promise that resolves to the created emoji.
	 */
	async create(
		guildId: string,
		body: OmitInsert<RESTPostAPIGuildEmojiJSONBody, 'image', { image: ImageResolvable }>,
	): Promise<GuildEmojiStructure> {
		const bodyResolved = { ...body, image: await resolveImage(body.image) };
		const emoji = await this.client.proxy.guilds(guildId).emojis.post({
			body: bodyResolved,
		});

		await this.client.cache.emojis?.setIfNI(CacheFrom.Rest, 'GuildExpressions', emoji.id!, guildId, emoji);

		return Transformers.GuildEmoji(this.client, emoji, guildId);
	}

	/**
	 * Fetches an emoji by its ID.
	 * @param guildId The ID of the guild.
	 * @param emojiId The ID of the emoji to fetch.
	 * @param force Whether to force fetching the emoji from the API even if it exists in the cache.
	 * @returns A Promise that resolves to the fetched emoji.
	 */
	async fetch(guildId: string, emojiId: string, force = false): Promise<GuildEmojiStructure> {
		if (!force) {
			const emoji = (await this.client.cache.emojis?.get(emojiId)) as GuildEmojiStructure | undefined;
			if (emoji) return emoji;
		}
		const emoji = await this.client.proxy.guilds(guildId).emojis(emojiId).get();
		return Transformers.GuildEmoji(this.client, emoji, guildId);
	}

	/**
	 * Deletes an emoji from the guild.
	 * @param guildId The ID of the guild.
	 * @param emojiId The ID of the emoji to delete.
	 * @param reason The reason for deleting the emoji.
	 */
	async delete(guildId: string, emojiId: string, reason?: string) {
		await this.client.proxy.guilds(guildId).emojis(emojiId).delete({ reason });
		await this.client.cache.emojis?.removeIfNI('GuildExpressions', emojiId, guildId);
	}

	/**
	 * Edits an emoji in the guild.
	 * @param guildId The ID of the guild.
	 * @param emojiId The ID of the emoji to edit.
	 * @param body The data to update the emoji with.
	 * @param reason The reason for editing the emoji.
	 * @returns A Promise that resolves to the edited emoji.
	 */
	async edit(
		guildId: string,
		emojiId: string,
		body: RESTPatchAPIGuildEmojiJSONBody,
		reason?: string,
	): Promise<GuildEmojiStructure> {
		const emoji = await this.client.proxy.guilds(guildId).emojis(emojiId).patch({ body, reason });
		await this.client.cache.emojis?.setIfNI(CacheFrom.Rest, 'GuildExpressions', emoji.id!, guildId, emoji);
		return Transformers.GuildEmoji(this.client, emoji, guildId);
	}
}
