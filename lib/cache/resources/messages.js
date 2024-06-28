"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Messages = void 0;
const guild_related_1 = require("./default/guild-related");
const common_1 = require("../../common");
const transformers_1 = require("../../client/transformers");
class Messages extends guild_related_1.GuildRelatedResource {
    namespace = 'message';
    //@ts-expect-error
    filter(data, id, channel_id) {
        return true;
    }
    parse(data, _key, _channel_id) {
        const { author, member, ...rest } = data;
        if (author?.id)
            rest.user_id = author.id;
        return rest;
    }
    get(id) {
        return (0, common_1.fakePromise)(super.get(id)).then(rawMessage => {
            return this.cache.users && rawMessage?.user_id
                ? (0, common_1.fakePromise)(this.cache.adapter.get(this.cache.users.hashId(rawMessage.user_id))).then(user => {
                    return user ? transformers_1.Transformers.Message(this.client, { ...rawMessage, author: user }) : undefined;
                })
                : undefined;
        });
    }
    bulk(ids) {
        return (0, common_1.fakePromise)(super.bulk(ids)).then(messages => messages
            .map(rawMessage => {
            return this.cache.users && rawMessage?.user_id
                ? (0, common_1.fakePromise)(this.cache.adapter.get(this.cache.users.hashId(rawMessage.user_id))).then(user => {
                    return user ? transformers_1.Transformers.Message(this.client, { ...rawMessage, author: user }) : undefined;
                })
                : undefined;
        })
            .filter(Boolean));
    }
    values(channel) {
        return (0, common_1.fakePromise)(super.values(channel)).then(messages => {
            const hashes = this.cache.users
                ? messages.map(x => (x.user_id ? this.cache.users.hashId(x.user_id) : undefined))
                : [];
            return (0, common_1.fakePromise)(this.cache.adapter.bulkGet(hashes.filter(Boolean))).then(users => {
                return messages
                    .map(message => {
                    const user = users.find(user => user.id === message.user_id);
                    return user ? transformers_1.Transformers.Message(this.client, { ...message, author: user }) : undefined;
                })
                    .filter(Boolean);
            });
        });
    }
    keys(channel) {
        return super.keys(channel);
    }
}
exports.Messages = Messages;
