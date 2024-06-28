"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Emojis = void 0;
const common_1 = require("../../common");
const guild_related_1 = require("./default/guild-related");
const transformers_1 = require("../../client/transformers");
class Emojis extends guild_related_1.GuildRelatedResource {
    namespace = 'emoji';
    //@ts-expect-error
    filter(data, id, guild_id) {
        return true;
    }
    get(id) {
        return (0, common_1.fakePromise)(super.get(id)).then(rawEmoji => rawEmoji ? transformers_1.Transformers.GuildEmoji(this.client, rawEmoji, rawEmoji.guild_id) : undefined);
    }
    bulk(ids) {
        return (0, common_1.fakePromise)(super.bulk(ids)).then(emojis => emojis.map(rawEmoji => transformers_1.Transformers.GuildEmoji(this.client, rawEmoji, rawEmoji.guild_id)));
    }
    values(guild) {
        return (0, common_1.fakePromise)(super.values(guild)).then(emojis => emojis.map(rawEmoji => transformers_1.Transformers.GuildEmoji(this.client, rawEmoji, rawEmoji.guild_id)));
    }
}
exports.Emojis = Emojis;
