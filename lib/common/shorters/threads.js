"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreadShorter = void 0;
const channels_1 = __importDefault(require("../../structures/channels"));
const base_1 = require("./base");
class ThreadShorter extends base_1.BaseShorter {
    /**
     * Creates a new thread in the channel (only guild based channels).
     * @param channelId The ID of the parent channel.
     * @param reason The reason for unpinning the message.
     * @returns A promise that resolves when the thread is succesfully created.
     */
    async create(channelId, body, reason) {
        return (this.client.proxy
            .channels(channelId)
            .threads.post({ body, reason })
            // When testing this, discord returns the thread object, but in discord api types it does not.
            .then(thread => (0, channels_1.default)(thread, this.client)));
    }
    async fromMessage(channelId, messageId, options) {
        const { reason, ...body } = options;
        return this.client.proxy
            .channels(channelId)
            .messages(messageId)
            .threads.post({ body, reason })
            .then(thread => (0, channels_1.default)(thread, this.client));
    }
    async join(threadId) {
        return this.client.proxy.channels(threadId)['thread-members']('@me').put();
    }
    async leave(threadId) {
        return this.client.proxy.channels(threadId)['thread-members']('@me').delete();
    }
    async lock(threadId, locked = true, reason) {
        return this.edit(threadId, { locked }, reason).then(x => (0, channels_1.default)(x, this.client));
    }
    async edit(threadId, body, reason) {
        return this.client.channels.edit(threadId, body, { reason });
    }
    async removeMember(threadId, memberId) {
        return this.client.proxy.channels(threadId)['thread-members'](memberId).delete();
    }
    async fetchMember(threadId, memberId, with_member) {
        return this.client.proxy.channels(threadId)['thread-members'](memberId).get({
            query: {
                with_member,
            },
        });
    }
    async addMember(threadId, memberId) {
        return this.client.proxy.channels(threadId)['thread-members'](memberId).put();
    }
    async listMembers(threadId, query) {
        return this.client.proxy.channels(threadId)['thread-members'].get({ query });
    }
    async listArchivedThreads(channelId, type, query) {
        const data = await this.client.proxy.channels(channelId).threads.archived[type].get({ query });
        return {
            threads: data.threads.map(thread => (0, channels_1.default)(thread, this.client)),
            members: data.members,
            hasMore: data.has_more,
        };
    }
    async listJoinedArchivedPrivate(channelId, query) {
        const data = await this.client.proxy.channels(channelId).users('@me').threads.archived.private.get({ query });
        return {
            threads: data.threads.map(thread => (0, channels_1.default)(thread, this.client)),
            members: data.members,
            hasMore: data.has_more,
        };
    }
}
exports.ThreadShorter = ThreadShorter;
