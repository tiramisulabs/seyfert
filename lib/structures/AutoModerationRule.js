"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoModerationRule = void 0;
const common_1 = require("../common");
const DiscordBase_1 = require("./extra/DiscordBase");
class AutoModerationRule extends DiscordBase_1.DiscordBase {
    constructor(client, data) {
        super(client, data);
    }
    fetchCreator(force = false) {
        return this.client.members.fetch(this.guildId, this.creatorId, force);
    }
    guild(force = false) {
        return this.client.guilds.fetch(this.guildId, force);
    }
    fetch() {
        return this.client.guilds.moderation.fetch(this.guildId, this.id);
    }
    edit(body, reason) {
        return this.client.guilds.moderation.edit(this.guildId, this.id, body, reason);
    }
    delete(reason) {
        return this.client.guilds.moderation.delete(this.guildId, this.id, reason);
    }
    static methods({ client, guildId }) {
        return {
            list: () => client.guilds.moderation.list(guildId),
            create: (body) => client.guilds.moderation.create(guildId, body),
            delete: (ruleId, reason) => client.guilds.moderation.delete(guildId, ruleId, reason),
            fetch: (ruleId) => client.guilds.moderation.fetch(guildId, ruleId),
            edit: (ruleId, body, reason) => client.guilds.moderation.edit(guildId, ruleId, (0, common_1.toCamelCase)(body), reason),
        };
    }
}
exports.AutoModerationRule = AutoModerationRule;
