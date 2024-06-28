"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stickers = void 0;
const common_1 = require("../../common");
const guild_related_1 = require("./default/guild-related");
const transformers_1 = require("../../client/transformers");
class Stickers extends guild_related_1.GuildRelatedResource {
    namespace = 'sticker';
    //@ts-expect-error
    filter(data, id, guild_id) {
        return true;
    }
    get(id) {
        return (0, common_1.fakePromise)(super.get(id)).then(rawSticker => rawSticker ? transformers_1.Transformers.Sticker(this.client, rawSticker) : undefined);
    }
    bulk(ids) {
        return (0, common_1.fakePromise)(super.bulk(ids)).then(emojis => emojis.map(rawSticker => transformers_1.Transformers.Sticker(this.client, rawSticker)));
    }
    values(guild) {
        return (0, common_1.fakePromise)(super.values(guild)).then(emojis => emojis.map(rawSticker => transformers_1.Transformers.Sticker(this.client, rawSticker)));
    }
}
exports.Stickers = Stickers;
