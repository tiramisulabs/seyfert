"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuildTemplate = void 0;
const Base_1 = require("./extra/Base");
class GuildTemplate extends Base_1.Base {
    constructor(client, data) {
        super(client);
        this.__patchThis(data);
    }
    guild(force = false) {
        return this.client.guilds.fetch(this.sourceGuildId, force);
    }
    async fetch() {
        return this.client.templates.fetch(this.sourceGuildId);
    }
    sync() {
        return this.client.templates.sync(this.sourceGuildId, this.code);
    }
    edit(body) {
        return this.client.templates.edit(this.sourceGuildId, this.code, body);
    }
    delete() {
        return this.client.templates.delete(this.sourceGuildId, this.code);
    }
    static methods(ctx) {
        return {
            fetch: (code) => ctx.client.templates.fetch(code),
            list: () => ctx.client.templates.list(ctx.guildId),
            create: (body) => ctx.client.templates.create(ctx.guildId, body),
            sync: (code) => ctx.client.templates.sync(ctx.guildId, code),
            edit: (code, body) => ctx.client.templates.edit(ctx.guildId, code, body),
            delete: (code) => ctx.client.templates.delete(ctx.guildId, code),
        };
    }
}
exports.GuildTemplate = GuildTemplate;
