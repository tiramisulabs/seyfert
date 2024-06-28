"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Threads = void 0;
const common_1 = require("../../common");
const guild_related_1 = require("./default/guild-related");
const transformers_1 = require("../../client/transformers");
class Threads extends guild_related_1.GuildRelatedResource {
    namespace = 'thread';
    //@ts-expect-error
    filter(data, id, guild_id) {
        return true;
    }
    get(id) {
        return (0, common_1.fakePromise)(super.get(id)).then(rawThread => rawThread ? transformers_1.Transformers.ThreadChannel(this.client, rawThread) : undefined);
    }
    bulk(ids) {
        return (0, common_1.fakePromise)(super.bulk(ids)).then(threads => threads.map(rawThread => transformers_1.Transformers.ThreadChannel(this.client, rawThread)));
    }
    values(guild) {
        return (0, common_1.fakePromise)(super.values(guild)).then(threads => threads.map(rawThread => transformers_1.Transformers.ThreadChannel(this.client, rawThread)));
    }
}
exports.Threads = Threads;
