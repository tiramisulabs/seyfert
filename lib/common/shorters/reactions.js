"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactionShorter = void 0;
const functions_1 = require("../../structures/extra/functions");
const base_1 = require("./base");
const transformers_1 = require("../../client/transformers");
class ReactionShorter extends base_1.BaseShorter {
    async add(messageId, channelId, emoji) {
        const rawEmoji = await (0, functions_1.resolveEmoji)(emoji, this.client.cache);
        if (!rawEmoji) {
            throw new Error('Emoji no resolvable');
        }
        return this.client.proxy.channels(channelId).messages(messageId).reactions((0, functions_1.encodeEmoji)(rawEmoji))('@me').put({});
    }
    async delete(messageId, channelId, emoji, userId = '@me') {
        const rawEmoji = await (0, functions_1.resolveEmoji)(emoji, this.client.cache);
        if (!rawEmoji) {
            throw new Error('Emoji no resolvable');
        }
        return this.client.proxy.channels(channelId).messages(messageId).reactions((0, functions_1.encodeEmoji)(rawEmoji))(userId).delete();
    }
    async fetch(messageId, channelId, emoji, query) {
        const rawEmoji = await (0, functions_1.resolveEmoji)(emoji, this.client.cache);
        if (!rawEmoji) {
            throw new Error('Emoji no resolvable');
        }
        return this.client.proxy
            .channels(channelId)
            .messages(messageId)
            .reactions((0, functions_1.encodeEmoji)(rawEmoji))
            .get({ query })
            .then(u => u.map(user => transformers_1.Transformers.User(this.client, user)));
    }
    async purge(messageId, channelId, emoji) {
        if (!emoji) {
            return this.client.proxy.channels(channelId).messages(messageId).reactions.delete();
        }
        const rawEmoji = await (0, functions_1.resolveEmoji)(emoji, this.client.cache);
        if (!rawEmoji) {
            throw new Error('Emoji no resolvable');
        }
        return this.client.proxy.channels(channelId).messages(messageId).reactions((0, functions_1.encodeEmoji)(rawEmoji)).delete();
    }
}
exports.ReactionShorter = ReactionShorter;
