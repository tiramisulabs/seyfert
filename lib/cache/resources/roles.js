"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Roles = void 0;
const common_1 = require("../../common");
const guild_related_1 = require("./default/guild-related");
const transformers_1 = require("../../client/transformers");
class Roles extends guild_related_1.GuildRelatedResource {
    namespace = 'role';
    //@ts-expect-error
    filter(data, id, guild_id) {
        return true;
    }
    raw(id) {
        return super.get(id);
    }
    get(id) {
        return (0, common_1.fakePromise)(super.get(id)).then(rawRole => rawRole ? transformers_1.Transformers.GuildRole(this.client, rawRole, rawRole.guild_id) : undefined);
    }
    bulk(ids) {
        return (0, common_1.fakePromise)(super.bulk(ids)).then(roles => roles.map(rawRole => transformers_1.Transformers.GuildRole(this.client, rawRole, rawRole.guild_id)));
    }
    values(guild) {
        return (0, common_1.fakePromise)(super.values(guild)).then(roles => roles.map(rawRole => transformers_1.Transformers.GuildRole(this.client, rawRole, rawRole.guild_id)));
    }
    valuesRaw(guild) {
        return super.values(guild);
    }
}
exports.Roles = Roles;
