"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Members = void 0;
const common_1 = require("../../common");
const guild_based_1 = require("./default/guild-based");
const transformers_1 = require("../../client/transformers");
class Members extends guild_based_1.GuildBasedResource {
    namespace = 'member';
    //@ts-expect-error
    filter(data, id, guild_id) {
        return true;
    }
    parse(data, key, guild_id) {
        const { user, ...rest } = super.parse(data, data.user?.id ?? key, guild_id);
        return rest;
    }
    raw(id, guild) {
        return (0, common_1.fakePromise)(super.get(id, guild)).then(rawMember => {
            return (0, common_1.fakePromise)(this.client.cache.users?.raw(id)).then(user => rawMember && user
                ? {
                    ...rawMember,
                    user,
                }
                : undefined);
        });
    }
    get(id, guild) {
        return (0, common_1.fakePromise)(super.get(id, guild)).then(rawMember => (0, common_1.fakePromise)(this.client.cache.users?.raw(id)).then(user => rawMember && user ? transformers_1.Transformers.GuildMember(this.client, rawMember, user, guild) : undefined));
    }
    bulk(ids, guild) {
        return (0, common_1.fakePromise)(super.bulk(ids, guild)).then(members => (0, common_1.fakePromise)(this.client.cache.users?.bulkRaw(ids)).then(users => members
            .map(rawMember => {
            const user = users?.find(x => x.id === rawMember.id);
            return user ? transformers_1.Transformers.GuildMember(this.client, rawMember, user, guild) : undefined;
        })
            .filter(Boolean)));
    }
    values(guild) {
        return (0, common_1.fakePromise)(super.values(guild)).then(members => (0, common_1.fakePromise)(this.client.cache.users?.valuesRaw()).then(users => members
            .map(rawMember => {
            const user = users?.find(x => x.id === rawMember.id);
            return user ? transformers_1.Transformers.GuildMember(this.client, rawMember, user, rawMember.guild_id) : undefined;
        })
            .filter(Boolean)));
    }
    async set(__keys, guild, data) {
        const keys = Array.isArray(__keys) ? __keys : [[__keys, data]];
        const bulkData = [];
        for (const [id, value] of keys) {
            if (value.user) {
                bulkData.push(['members', value, id, guild]);
                bulkData.push(['users', value.user, id]);
            }
        }
        await this.cache.bulkSet(bulkData);
    }
}
exports.Members = Members;
