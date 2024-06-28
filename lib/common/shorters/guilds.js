"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuildShorter = void 0;
const __1 = require("..");
const builders_1 = require("../../builders");
const structures_1 = require("../../structures");
const channels_1 = __importDefault(require("../../structures/channels"));
const base_1 = require("./base");
const transformers_1 = require("../../client/transformers");
class GuildShorter extends base_1.BaseShorter {
    /**
     * Creates a new guild.
     * @param body The data for creating the guild.
     * @returns A Promise that resolves to the created guild.
     */
    async create(body) {
        const guild = await this.client.proxy.guilds.post({ body });
        await this.client.cache.guilds?.setIfNI('Guilds', guild.id, guild);
        return transformers_1.Transformers.Guild(this.client, guild);
    }
    /**
     * Fetches a guild by its ID.
     * @param id The ID of the guild to fetch.
     * @param force Whether to force fetching the guild from the API even if it exists in the cache.
     * @returns A Promise that resolves to the fetched guild.
     */
    async fetch(id, force = false) {
        return transformers_1.Transformers.Guild(this.client, await this.raw(id, force));
    }
    async raw(id, force = false) {
        if (!force) {
            const guild = await this.client.cache.guilds?.raw(id);
            if (guild)
                return guild;
        }
        const data = await this.client.proxy.guilds(id).get();
        await this.client.cache.guilds?.patch(id, data);
        return (await this.client.cache.guilds?.raw(id)) ?? data;
    }
    /**
     * Generates the widget URL for the guild.
     * @param id The ID of the guild.
     * @param style The style of the widget.
     * @returns The generated widget URL.
     */
    widgetURL(id, style) {
        const query = new URLSearchParams();
        if (style) {
            query.append('style', style);
        }
        return this.client.proxy.guilds(id).widget.get({ query });
    }
    list(query) {
        return this.client.proxy
            .users('@me')
            .guilds.get({ query })
            .then(guilds => guilds.map(guild => transformers_1.Transformers.AnonymousGuild(this.client, { ...guild, splash: null })));
    }
    async fetchSelf(id, force = false) {
        if (!force) {
            const self = await this.client.cache.members?.raw(this.client.botId, id);
            if (self?.user)
                return new structures_1.GuildMember(this.client, self, self.user, id);
        }
        const self = await this.client.proxy.guilds(id).members(this.client.botId).get();
        await this.client.cache.members?.patch(self.user.id, id, self);
        return new structures_1.GuildMember(this.client, self, self.user, id);
    }
    leave(id) {
        return this.client.proxy
            .users('@me')
            .guilds(id)
            .delete()
            .then(() => this.client.cache.guilds?.removeIfNI('Guilds', id));
    }
    /**
     * Provides access to channel-related functionality in a guild.
     */
    get channels() {
        return {
            /**
             * Retrieves a list of channels in the guild.
             * @param guildId The ID of the guild.
             * @param force Whether to force fetching channels from the API even if they exist in the cache.
             * @returns A Promise that resolves to an array of channels.
             */
            list: async (guildId, force = false) => {
                let channels;
                if (!force) {
                    channels = (await this.client.cache.channels?.values(guildId)) ?? [];
                    if (channels.length) {
                        return channels;
                    }
                }
                channels = await this.client.proxy.guilds(guildId).channels.get();
                await this.client.cache.channels?.set(channels.map(x => [x.id, x]), guildId);
                return channels.map(m => (0, channels_1.default)(m, this.client));
            },
            /**
             * Fetches a channel by its ID.
             * @param guildId The ID of the guild.
             * @param channelId The ID of the channel to fetch.
             * @param force Whether to force fetching the channel from the API even if it exists in the cache.
             * @returns A Promise that resolves to the fetched channel.
             */
            fetch: async (guildId, channelId, force) => {
                let channel;
                if (!force) {
                    channel = await this.client.cache.channels?.get(channelId);
                    if (channel)
                        return channel;
                }
                channel = await this.client.proxy.channels(channelId).get();
                await this.client.cache.channels?.patch(channelId, guildId, channel);
                return (0, channels_1.default)(channel, this.client);
            },
            /**
             * Creates a new channel in the guild.
             * @param guildId The ID of the guild.
             * @param body The data for creating the channel.
             * @returns A Promise that resolves to the created channel.
             */
            create: async (guildId, body) => {
                const res = await this.client.proxy.guilds(guildId).channels.post({ body });
                await this.client.cache.channels?.setIfNI(structures_1.BaseChannel.__intent__(guildId), res.id, guildId, res);
                return (0, channels_1.default)(res, this.client);
            },
            /**
             * Deletes a channel from the guild.
             * @param guildId The ID of the guild.
             * @param channelId The ID of the channel to delete.
             * @param reason The reason for deleting the channel.
             * @returns A Promise that resolves to the deleted channel.
             */
            delete: async (guildId, channelId, reason) => {
                const res = await this.client.proxy.channels(channelId).delete({ reason });
                await this.client.cache.channels?.removeIfNI(structures_1.BaseChannel.__intent__(guildId), res.id, guildId);
                return (0, channels_1.default)(res, this.client);
            },
            /**
             * Edits a channel in the guild.
             * @param guildchannelId The ID of the guild.
             * @param channelId The ID of the channel to edit.
             * @param body The data to update the channel with.
             * @param reason The reason for editing the channel.
             * @returns A Promise that resolves to the edited channel.
             */
            edit: async (guildchannelId, channelId, body, reason) => {
                const res = await this.client.proxy.channels(channelId).patch({ body, reason });
                await this.client.cache.channels?.setIfNI(structures_1.BaseChannel.__intent__(guildchannelId), res.id, guildchannelId, res);
                return (0, channels_1.default)(res, this.client);
            },
            /**
             * Edits the positions of channels in the guild.
             * @param guildId The ID of the guild.
             * @param body The data containing the new positions of channels.
             */
            editPositions: (guildId, body) => this.client.proxy.guilds(guildId).channels.patch({ body }),
            addFollower: async (channelId, webhook_channel_id, reason) => {
                return this.client.proxy.channels(channelId).followers.post({
                    body: {
                        webhook_channel_id,
                    },
                    reason,
                });
            },
        };
    }
    /**
     * Provides access to auto-moderation rule-related functionality in a guild.
     */
    get moderation() {
        return {
            /**
             * Retrieves a list of auto-moderation rules in the guild.
             * @param guildId The ID of the guild.
             * @returns A Promise that resolves to an array of auto-moderation rules.
             */
            list: (guildId) => this.client.proxy
                .guilds(guildId)['auto-moderation'].rules.get()
                .then(rules => rules.map(rule => transformers_1.Transformers.AutoModerationRule(this.client, rule))),
            /**
             * Creates a new auto-moderation rule in the guild.
             * @param guildId The ID of the guild.
             * @param body The data for creating the auto-moderation rule.
             * @returns A Promise that resolves to the created auto-moderation rule.
             */
            create: (guildId, body) => this.client.proxy
                .guilds(guildId)['auto-moderation'].rules.post({ body })
                .then(rule => transformers_1.Transformers.AutoModerationRule(this.client, rule)),
            /**
             * Deletes an auto-moderation rule from the guild.
             * @param guildId The ID of the guild.
             * @param ruleId The ID of the rule to delete.
             * @param reason The reason for deleting the rule.
             * @returns A Promise that resolves once the rule is deleted.
             */
            delete: (guildId, ruleId, reason) => {
                return this.client.proxy.guilds(guildId)['auto-moderation'].rules(ruleId).delete({ reason });
            },
            /**
             * Fetches an auto-moderation rule by its ID.
             * @param guildId The ID of the guild.
             * @param ruleId The ID of the rule to fetch.
             * @returns A Promise that resolves to the fetched auto-moderation rule.
             */
            fetch: (guildId, ruleId) => {
                return this.client.proxy
                    .guilds(guildId)['auto-moderation'].rules(ruleId)
                    .get()
                    .then(rule => transformers_1.Transformers.AutoModerationRule(this.client, rule));
            },
            /**
             * Edits an auto-moderation rule in the guild.
             * @param guildId The ID of the guild.
             * @param ruleId The ID of the rule to edit.
             * @param body The data to update the rule with.
             * @param reason The reason for editing the rule.
             * @returns A Promise that resolves to the edited auto-moderation rule.
             */
            edit: (guildId, ruleId, body, reason) => {
                return this.client.proxy
                    .guilds(guildId)['auto-moderation'].rules(ruleId)
                    .patch({ body: (0, __1.toSnakeCase)(body), reason })
                    .then(rule => transformers_1.Transformers.AutoModerationRule(this.client, rule));
            },
        };
    }
    /**
     * Provides access to sticker-related functionality in a guild.
     */
    get stickers() {
        return {
            /**
             * Retrieves a list of stickers in the guild.
             * @param guildId The ID of the guild.
             * @returns A Promise that resolves to an array of stickers.
             */
            list: async (guildId) => {
                const stickers = await this.client.proxy.guilds(guildId).stickers.get();
                await this.client.cache.stickers?.set(stickers.map(st => [st.id, st]), guildId);
                return stickers.map(st => transformers_1.Transformers.Sticker(this.client, st));
            },
            /**
             * Creates a new sticker in the guild.
             * @param guildId The ID of the guild.
             * @param request The request body for creating the sticker.
             * @param reason The reason for creating the sticker.
             * @returns A Promise that resolves to the created sticker.
             */
            create: async (guildId, { file, ...json }, reason) => {
                const fileResolve = await (0, builders_1.resolveFiles)([file]);
                const sticker = await this.client.proxy
                    .guilds(guildId)
                    .stickers.post({ reason, body: json, files: [{ ...fileResolve[0], key: 'file' }], appendToFormData: true });
                await this.client.cache.stickers?.setIfNI('GuildEmojisAndStickers', sticker.id, guildId, sticker);
                return transformers_1.Transformers.Sticker(this.client, sticker);
            },
            /**
             * Edits an existing sticker in the guild.
             * @param guildId The ID of the guild.
             * @param stickerId The ID of the sticker to edit.
             * @param body The data to update the sticker with.
             * @param reason The reason for editing the sticker.
             * @returns A Promise that resolves to the edited sticker.
             */
            edit: async (guildId, stickerId, body, reason) => {
                const sticker = await this.client.proxy.guilds(guildId).stickers(stickerId).patch({ body, reason });
                await this.client.cache.stickers?.setIfNI('GuildEmojisAndStickers', stickerId, guildId, sticker);
                return transformers_1.Transformers.Sticker(this.client, sticker);
            },
            /**
             * Fetches a sticker by its ID from the guild.
             * @param guildId The ID of the guild.
             * @param stickerId The ID of the sticker to fetch.
             * @param force Whether to force fetching the sticker from the API even if it exists in the cache.
             * @returns A Promise that resolves to the fetched sticker.
             */
            fetch: async (guildId, stickerId, force = false) => {
                let sticker;
                if (!force) {
                    sticker = await this.client.cache.stickers?.get(stickerId);
                    if (sticker)
                        return sticker;
                }
                sticker = await this.client.proxy.guilds(guildId).stickers(stickerId).get();
                await this.client.cache.stickers?.patch(stickerId, guildId, sticker);
                return transformers_1.Transformers.Sticker(this.client, sticker);
            },
            /**
             * Deletes a sticker from the guild.
             * @param guildId The ID of the guild.
             * @param stickerId The ID of the sticker to delete.
             * @param reason The reason for deleting the sticker.
             * @returns A Promise that resolves once the sticker is deleted.
             */
            delete: async (guildId, stickerId, reason) => {
                await this.client.proxy.guilds(guildId).stickers(stickerId).delete({ reason });
                await this.client.cache.stickers?.removeIfNI('GuildEmojisAndStickers', stickerId, guildId);
            },
        };
    }
}
exports.GuildShorter = GuildShorter;
