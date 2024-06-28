"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bans = void 0;
const common_1 = require("../../common");
const guild_based_1 = require("./default/guild-based");
const transformers_1 = require("../../client/transformers");
class Bans extends guild_based_1.GuildBasedResource {
    namespace = 'ban';
    //@ts-expect-error
    filter(data, id, guild_id) {
        return true;
    }
    parse(data, key, guild_id) {
        const { user, ...rest } = super.parse(data, data.user?.id ?? key, guild_id);
        return rest;
    }
    get(id, guild) {
        return (0, common_1.fakePromise)(super.get(id, guild)).then(rawBan => rawBan ? transformers_1.Transformers.GuildBan(this.client, rawBan, guild) : undefined);
    }
    bulk(ids, guild) {
        return (0, common_1.fakePromise)(super.bulk(ids, guild)).then(bans => bans
            .map(rawBan => {
            return rawBan ? transformers_1.Transformers.GuildBan(this.client, rawBan, guild) : undefined;
        })
            .filter(Boolean));
    }
    values(guild) {
        return (0, common_1.fakePromise)(super.values(guild)).then(bans => bans
            .map(rawBan => {
            return rawBan ? transformers_1.Transformers.GuildBan(this.client, rawBan, guild) : undefined;
        })
            .filter(Boolean));
    }
}
exports.Bans = Bans;
