"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VOICE_STATE_UPDATE = exports.VOICE_SERVER_UPDATE = void 0;
const common_1 = require("../../common");
const transformers_1 = require("../../client/transformers");
const VOICE_SERVER_UPDATE = (_self, data) => {
    return (0, common_1.toCamelCase)(data);
};
exports.VOICE_SERVER_UPDATE = VOICE_SERVER_UPDATE;
const VOICE_STATE_UPDATE = async (self, data) => {
    if (!data.guild_id)
        return [transformers_1.Transformers.VoiceState(self, data)];
    return [transformers_1.Transformers.VoiceState(self, data), await self.cache.voiceStates?.get(data.user_id, data.guild_id)];
};
exports.VOICE_STATE_UPDATE = VOICE_STATE_UPDATE;
