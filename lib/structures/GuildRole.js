"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuildRole = void 0;
const common_1 = require("../common");
const DiscordBase_1 = require("./extra/DiscordBase");
const Permissions_1 = require("./extra/Permissions");
class GuildRole extends DiscordBase_1.DiscordBase {
    guildId;
    permissions;
    constructor(client, data, guildId) {
        super(client, data);
        this.guildId = guildId;
        this.permissions = new Permissions_1.PermissionsBitField(BigInt(data.permissions));
    }
    guild(force = false) {
        if (!this.guildId)
            return;
        return this.client.guilds.fetch(this.guildId, force);
    }
    edit(body, reason) {
        return this.client.roles.create(this.guildId, body, reason);
    }
    delete(reason) {
        return this.client.roles.delete(this.guildId, this.id, reason);
    }
    toString() {
        return common_1.Formatter.roleMention(this.id);
    }
    static methods(ctx) {
        return {
            create: (body) => ctx.client.roles.create(ctx.guildId, body),
            list: (force = false) => ctx.client.roles.list(ctx.guildId, force),
            edit: (roleId, body, reason) => ctx.client.roles.edit(ctx.guildId, roleId, body, reason),
            delete: (roleId, reason) => ctx.client.roles.delete(ctx.guildId, roleId, reason),
            editPositions: (body) => ctx.client.roles.editPositions(ctx.guildId, body),
        };
    }
}
exports.GuildRole = GuildRole;
