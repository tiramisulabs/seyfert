"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Overwrites = void 0;
const utils_1 = require("../../common/it/utils");
const Permissions_1 = require("../../structures/extra/Permissions");
const guild_related_1 = require("./default/guild-related");
class Overwrites extends guild_related_1.GuildRelatedResource {
    namespace = 'overwrite';
    //@ts-expect-error
    filter(data, id, guild_id) {
        return true;
    }
    parse(data, _id, guild_id) {
        data.forEach(x => {
            x.guild_id = guild_id;
        });
        return data;
    }
    raw(id) {
        return super.get(id);
    }
    get(id) {
        return (0, utils_1.fakePromise)(super.get(id)).then(rawOverwrites => rawOverwrites
            ? rawOverwrites.map(rawOverwrite => ({
                allow: new Permissions_1.PermissionsBitField(BigInt(rawOverwrite.allow)),
                deny: new Permissions_1.PermissionsBitField(BigInt(rawOverwrite.deny)),
                id: rawOverwrite.id,
                type: rawOverwrite.type,
                guildId: rawOverwrite.guild_id,
            }))
            : undefined);
    }
    values(guild) {
        return (0, utils_1.fakePromise)(super.values(guild)).then(values => values.map(rawOverwrites => rawOverwrites.map(rawOverwrite => ({
            allow: new Permissions_1.PermissionsBitField(BigInt(rawOverwrite.allow)),
            deny: new Permissions_1.PermissionsBitField(BigInt(rawOverwrite.deny)),
            id: rawOverwrite.id,
            type: rawOverwrite.type,
            guildId: rawOverwrite.guild_id,
        }))));
    }
    bulk(ids) {
        return (0, utils_1.fakePromise)(super.bulk(ids)).then(values => values.map(rawOverwrites => rawOverwrites.map(rawOverwrite => ({
            allow: new Permissions_1.PermissionsBitField(BigInt(rawOverwrite.allow)),
            deny: new Permissions_1.PermissionsBitField(BigInt(rawOverwrite.deny)),
            id: rawOverwrite.id,
            type: rawOverwrite.type,
            guildId: rawOverwrite.guild_id,
        }))));
    }
}
exports.Overwrites = Overwrites;
