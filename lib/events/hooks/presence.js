"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRESENCE_UPDATE = void 0;
const common_1 = require("../../common");
const PRESENCE_UPDATE = async (self, data) => {
    return [(0, common_1.toCamelCase)(data), await self.cache.presences?.get(data.user.id)];
};
exports.PRESENCE_UPDATE = PRESENCE_UPDATE;
