"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuildEmoji = void 0;
const common_1 = require("../common");
const DiscordBase_1 = require("./extra/DiscordBase");
class GuildEmoji extends DiscordBase_1.DiscordBase {
    guildId;
    constructor(client, data, guildId) {
        super(client, { ...data, id: data.id });
        this.guildId = guildId;
    }
    guild(force = false) {
        if (!this.guildId)
            return;
        return this.client.guilds.fetch(this.guildId, force);
    }
    edit(body, reason) {
        return this.client.emojis.edit(this.guildId, this.id, body, reason);
    }
    delete(reason) {
        return this.client.emojis.delete(this.guildId, this.id, reason);
    }
    fetch(force = false) {
        return this.client.emojis.fetch(this.guildId, this.id, force);
    }
    url(options) {
        return this.rest.cdn.emojis(this.id).get(options);
    }
    toString() {
        return common_1.Formatter.emojiMention(this.id, this.name, this.animated);
    }
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            animated: !!this.animated,
        };
    }
    static methods({ client, guildId }) {
        return {
            edit: (emojiId, body, reason) => client.emojis.edit(guildId, emojiId, body, reason),
            create: (body) => client.emojis.create(guildId, body),
            fetch: (emojiId, force = false) => client.emojis.fetch(guildId, emojiId, force),
            list: (force = false) => client.emojis.list(guildId, force),
        };
    }
}
exports.GuildEmoji = GuildEmoji;
