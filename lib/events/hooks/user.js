"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_UPDATE = void 0;
const transformers_1 = require("../../client/transformers");
const USER_UPDATE = async (self, data) => {
    return [transformers_1.Transformers.User(self, data), await self.cache.users?.get(data.id)];
};
exports.USER_UPDATE = USER_UPDATE;
