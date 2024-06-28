"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Channels = void 0;
const common_1 = require("../../common");
const channels_1 = __importDefault(require("../../structures/channels"));
const guild_related_1 = require("./default/guild-related");
class Channels extends guild_related_1.GuildRelatedResource {
    namespace = 'channel';
    parse(data, id, guild_id) {
        const { permission_overwrites, ...rest } = super.parse(data, id, guild_id);
        return rest;
    }
    raw(id) {
        return super.get(id);
    }
    get(id) {
        return (0, common_1.fakePromise)(super.get(id)).then(rawChannel => rawChannel ? (0, channels_1.default)(rawChannel, this.client) : undefined);
    }
    bulk(ids) {
        return (0, common_1.fakePromise)(super.bulk(ids)).then(channels => channels.map(rawChannel => (0, channels_1.default)(rawChannel, this.client)));
    }
    values(guild) {
        return (0, common_1.fakePromise)(super.values(guild)).then(channels => channels.map(rawChannel => (0, channels_1.default)(rawChannel, this.client)));
    }
}
exports.Channels = Channels;
