"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuildBan = void 0;
const common_1 = require("../common");
const DiscordBase_1 = require("./extra/DiscordBase");
class GuildBan extends DiscordBase_1.DiscordBase {
    guildId;
    constructor(client, data, guildId) {
        super(client, { ...data, id: data.user.id });
        this.guildId = guildId;
    }
    create(body, reason) {
        return this.client.bans.create(this.guildId, this.id, body, reason);
    }
    remove(reason) {
        return this.client.bans.remove(this.guildId, this.id, reason);
    }
    guild(force = false) {
        return this.client.guilds.fetch(this.guildId, force);
    }
    fetch(force = false) {
        return this.client.bans.fetch(this.guildId, this.id, force);
    }
    toString() {
        return common_1.Formatter.userMention(this.id);
    }
    static methods({ client, guildId }) {
        return {
            fetch: (userId, force = false) => client.bans.fetch(guildId, userId, force),
            list: (query, force = false) => client.bans.list(guildId, query, force),
            create: (memberId, body, reason) => client.bans.create(guildId, memberId, body, reason),
            remove: (memberId, reason) => client.bans.remove(guildId, memberId, reason),
            bulkCreate: (body, reason) => client.bans.bulkCreate(guildId, body, reason),
        };
    }
}
exports.GuildBan = GuildBan;
