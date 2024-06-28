"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sticker = void 0;
const DiscordBase_1 = require("./extra/DiscordBase");
const transformers_1 = require("../client/transformers");
class Sticker extends DiscordBase_1.DiscordBase {
    user;
    constructor(client, data) {
        super(client, data);
        if (data.user) {
            this.user = transformers_1.Transformers.User(this.client, data.user);
        }
    }
    guild(force = false) {
        if (!this.guildId)
            return;
        return this.client.guilds.fetch(this.id, force);
    }
    edit(body, reason) {
        if (!this.guildId)
            return;
        return this.client.guilds.stickers.edit(this.guildId, this.id, body, reason);
    }
    fetch(force = false) {
        if (!this.guildId)
            return;
        return this.client.guilds.stickers.fetch(this.guildId, this.id, force);
    }
    delete(reason) {
        if (!this.guildId)
            return;
        return this.client.guilds.stickers.delete(this.guildId, this.id, reason);
    }
    static methods({ client, guildId }) {
        return {
            list: () => client.guilds.stickers.list(guildId),
            create: (payload, reason) => client.guilds.stickers.create(guildId, payload, reason),
            edit: (stickerId, body, reason) => client.guilds.stickers.edit(guildId, stickerId, body, reason),
            fetch: (stickerId, force = false) => client.guilds.stickers.fetch(guildId, stickerId, force),
            delete: (stickerId, reason) => client.guilds.stickers.delete(guildId, stickerId, reason),
        };
    }
}
exports.Sticker = Sticker;
