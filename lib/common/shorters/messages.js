"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageShorter = void 0;
const builders_1 = require("../../builders");
const structures_1 = require("../../structures");
const base_1 = require("./base");
const transformers_1 = require("../../client/transformers");
class MessageShorter extends base_1.BaseShorter {
    async write(channelId, { files, ...body }) {
        const parsedFiles = files ? await (0, builders_1.resolveFiles)(files) : [];
        const transformedBody = structures_1.MessagesMethods.transformMessageBody(body, parsedFiles, this.client);
        return this.client.proxy
            .channels(channelId)
            .messages.post({
            body: transformedBody,
            files: parsedFiles,
        })
            .then(async (message) => {
            await this.client.cache.messages?.setIfNI('GuildMessages', message.id, message.channel_id, message);
            return transformers_1.Transformers.Message(this.client, message);
        });
    }
    async edit(messageId, channelId, { files, ...body }) {
        const parsedFiles = files ? await (0, builders_1.resolveFiles)(files) : [];
        return this.client.proxy
            .channels(channelId)
            .messages(messageId)
            .patch({
            body: structures_1.MessagesMethods.transformMessageBody(body, parsedFiles, this.client),
            files: parsedFiles,
        })
            .then(async (message) => {
            await this.client.cache.messages?.setIfNI('GuildMessages', message.id, message.channel_id, message);
            return transformers_1.Transformers.Message(this.client, message);
        });
    }
    crosspost(messageId, channelId, reason) {
        return this.client.proxy
            .channels(channelId)
            .messages(messageId)
            .crosspost.post({ reason })
            .then(async (m) => {
            await this.client.cache.messages?.setIfNI('GuildMessages', m.id, m.channel_id, m);
            return transformers_1.Transformers.Message(this.client, m);
        });
    }
    delete(messageId, channelId, reason) {
        return this.client.proxy
            .channels(channelId)
            .messages(messageId)
            .delete({ reason })
            .then(async () => {
            await this.client.cache.messages?.removeIfNI('GuildMessages', messageId, channelId);
            void this.client.components?.onMessageDelete(messageId);
        });
    }
    fetch(messageId, channelId) {
        return this.client.proxy
            .channels(channelId)
            .messages(messageId)
            .get()
            .then(async (x) => {
            await this.client.cache.messages?.set(x.id, x.channel_id, x);
            return transformers_1.Transformers.Message(this.client, x);
        });
    }
    purge(messages, channelId, reason) {
        return this.client.proxy
            .channels(channelId)
            .messages['bulk-delete'].post({ body: { messages }, reason })
            .then(() => this.client.cache.messages?.removeIfNI('GuildMessages', messages, channelId));
    }
    thread(channelId, messageId, options) {
        return this.client.threads.fromMessage(channelId, messageId, options);
    }
    endPoll(channelId, messageId) {
        return this.client.proxy
            .channels(channelId)
            .polls(messageId)
            .expire.post()
            .then(message => transformers_1.Transformers.Message(this.client, message));
    }
    getAnswerVoters(channelId, messageId, answerId) {
        return this.client.proxy
            .channels(channelId)
            .polls(messageId)
            .answers(answerId)
            .get()
            .then(data => data.users.map(user => transformers_1.Transformers.User(this.client, user)));
    }
}
exports.MessageShorter = MessageShorter;
