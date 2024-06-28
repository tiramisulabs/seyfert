import type { RESTPatchAPIGuildEmojiJSONBody, RESTPostAPIGuildEmojiJSONBody } from 'discord-api-types/v10';
import type { ImageResolvable } from '../types/resolvables';
import type { OmitInsert } from '../types/util';
import { BaseShorter } from './base';
export declare class EmojiShorter extends BaseShorter {
    /**
     * Retrieves a list of emojis in the guild.
     * @param guildId The ID of the guild.
     * @param force Whether to force fetching emojis from the API even if they exist in the cache.
     * @returns A Promise that resolves to an array of emojis.
     */
    list(guildId: string, force?: boolean): Promise<import("../..").GuildEmoji[]>;
    /**
     * Creates a new emoji in the guild.
     * @param guildId The ID of the guild.
     * @param body The data for creating the emoji.
     * @returns A Promise that resolves to the created emoji.
     */
    create(guildId: string, body: OmitInsert<RESTPostAPIGuildEmojiJSONBody, 'image', {
        image: ImageResolvable;
    }>): Promise<import("../..").GuildEmoji>;
    /**
     * Fetches an emoji by its ID.
     * @param guildId The ID of the guild.
     * @param emojiId The ID of the emoji to fetch.
     * @param force Whether to force fetching the emoji from the API even if it exists in the cache.
     * @returns A Promise that resolves to the fetched emoji.
     */
    fetch(guildId: string, emojiId: string, force?: boolean): Promise<import("../..").GuildEmoji>;
    /**
     * Deletes an emoji from the guild.
     * @param guildId The ID of the guild.
     * @param emojiId The ID of the emoji to delete.
     * @param reason The reason for deleting the emoji.
     */
    delete(guildId: string, emojiId: string, reason?: string): Promise<void>;
    /**
     * Edits an emoji in the guild.
     * @param guildId The ID of the guild.
     * @param emojiId The ID of the emoji to edit.
     * @param body The data to update the emoji with.
     * @param reason The reason for editing the emoji.
     * @returns A Promise that resolves to the edited emoji.
     */
    edit(guildId: string, emojiId: string, body: RESTPatchAPIGuildEmojiJSONBody, reason?: string): Promise<import("../..").GuildEmoji>;
}
