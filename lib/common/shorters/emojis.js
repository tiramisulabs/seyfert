"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmojiShorter = void 0;
const builders_1 = require("../../builders");
const base_1 = require("./base");
const transformers_1 = require("../../client/transformers");
class EmojiShorter extends base_1.BaseShorter {
    /**
     * Retrieves a list of emojis in the guild.
     * @param guildId The ID of the guild.
     * @param force Whether to force fetching emojis from the API even if they exist in the cache.
     * @returns A Promise that resolves to an array of emojis.
     */
    async list(guildId, force = false) {
        let emojis;
        if (!force) {
            emojis = (await this.client.cache.emojis?.values(guildId)) ?? [];
            if (emojis.length) {
                return emojis;
            }
        }
        emojis = await this.client.proxy.guilds(guildId).emojis.get();
        await this.client.cache.emojis?.set(emojis.map(x => [x.id, x]), guildId);
        return emojis.map(m => transformers_1.Transformers.GuildEmoji(this.client, m, guildId));
    }
    /**
     * Creates a new emoji in the guild.
     * @param guildId The ID of the guild.
     * @param body The data for creating the emoji.
     * @returns A Promise that resolves to the created emoji.
     */
    async create(guildId, body) {
        const bodyResolved = { ...body, image: await (0, builders_1.resolveImage)(body.image) };
        const emoji = await this.client.proxy.guilds(guildId).emojis.post({
            body: bodyResolved,
        });
        await this.client.cache.emojis?.setIfNI('GuildEmojisAndStickers', emoji.id, guildId, emoji);
        return transformers_1.Transformers.GuildEmoji(this.client, emoji, guildId);
    }
    /**
     * Fetches an emoji by its ID.
     * @param guildId The ID of the guild.
     * @param emojiId The ID of the emoji to fetch.
     * @param force Whether to force fetching the emoji from the API even if it exists in the cache.
     * @returns A Promise that resolves to the fetched emoji.
     */
    async fetch(guildId, emojiId, force = false) {
        let emoji;
        if (!force) {
            emoji = await this.client.cache.emojis?.get(emojiId);
            if (emoji)
                return emoji;
        }
        emoji = await this.client.proxy.guilds(guildId).emojis(emojiId).get();
        return transformers_1.Transformers.GuildEmoji(this.client, emoji, guildId);
    }
    /**
     * Deletes an emoji from the guild.
     * @param guildId The ID of the guild.
     * @param emojiId The ID of the emoji to delete.
     * @param reason The reason for deleting the emoji.
     */
    async delete(guildId, emojiId, reason) {
        await this.client.proxy.guilds(guildId).emojis(emojiId).delete({ reason });
        await this.client.cache.emojis?.removeIfNI('GuildEmojisAndStickers', emojiId, guildId);
    }
    /**
     * Edits an emoji in the guild.
     * @param guildId The ID of the guild.
     * @param emojiId The ID of the emoji to edit.
     * @param body The data to update the emoji with.
     * @param reason The reason for editing the emoji.
     * @returns A Promise that resolves to the edited emoji.
     */
    async edit(guildId, emojiId, body, reason) {
        const emoji = await this.client.proxy.guilds(guildId).emojis(emojiId).patch({ body, reason });
        await this.client.cache.emojis?.setIfNI('GuildEmojisAndStickers', emoji.id, guildId, emoji);
        return transformers_1.Transformers.GuildEmoji(this.client, emoji, guildId);
    }
}
exports.EmojiShorter = EmojiShorter;
