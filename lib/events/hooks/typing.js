"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TYPING_START = void 0;
const common_1 = require("../../common");
const transformers_1 = require("../../client/transformers");
const TYPING_START = (self, data) => {
    return data.member
        ? {
            ...(0, common_1.toCamelCase)(data),
            member: transformers_1.Transformers.GuildMember(self, data.member, data.member.user, data.guild_id),
        }
        : (0, common_1.toCamelCase)(data);
};
exports.TYPING_START = TYPING_START;
