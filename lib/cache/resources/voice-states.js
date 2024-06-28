"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceStates = void 0;
const common_1 = require("../../common");
const guild_based_1 = require("./default/guild-based");
const transformers_1 = require("../../client/transformers");
class VoiceStates extends guild_based_1.GuildBasedResource {
    namespace = 'voice_state';
    //@ts-expect-error
    filter(data, id, guild_id) {
        return true;
    }
    parse(data, id, guild_id) {
        const { member, ...rest } = super.parse(data, id, guild_id);
        return rest;
    }
    get(memberId, guildId) {
        return (0, common_1.fakePromise)(super.get(memberId, guildId)).then(state => state ? transformers_1.Transformers.VoiceState(this.client, state) : undefined);
    }
    bulk(ids, guild) {
        return (0, common_1.fakePromise)(super.bulk(ids, guild)).then(states => states
            .map(state => (state ? transformers_1.Transformers.VoiceState(this.client, state) : undefined))
            .filter(y => !!y));
    }
    values(guildId) {
        return (0, common_1.fakePromise)(super.values(guildId)).then(states => states.map(state => transformers_1.Transformers.VoiceState(this.client, state)));
    }
}
exports.VoiceStates = VoiceStates;
