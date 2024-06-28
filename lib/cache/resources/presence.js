"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Presences = void 0;
const guild_related_1 = require("./default/guild-related");
class Presences extends guild_related_1.GuildRelatedResource {
    namespace = 'presence';
    //@ts-expect-error
    filter(data, id, guild_id) {
        return true;
    }
    parse(data, key, guild_id) {
        const { user, ...rest } = super.parse(data, key, guild_id);
        rest.user_id ??= key;
        return rest;
    }
}
exports.Presences = Presences;
