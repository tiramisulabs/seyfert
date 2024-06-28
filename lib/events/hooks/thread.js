"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.THREAD_UPDATE = exports.THREAD_MEMBERS_UPDATE = exports.THREAD_MEMBER_UPDATE = exports.THREAD_LIST_SYNC = exports.THREAD_DELETE = exports.THREAD_CREATE = void 0;
const common_1 = require("../../common");
const transformers_1 = require("../../client/transformers");
const THREAD_CREATE = (self, data) => {
    return transformers_1.Transformers.ThreadChannel(self, data);
};
exports.THREAD_CREATE = THREAD_CREATE;
const THREAD_DELETE = (self, data) => {
    return transformers_1.Transformers.ThreadChannel(self, data);
};
exports.THREAD_DELETE = THREAD_DELETE;
const THREAD_LIST_SYNC = (_self, data) => {
    return (0, common_1.toCamelCase)(data);
};
exports.THREAD_LIST_SYNC = THREAD_LIST_SYNC;
const THREAD_MEMBER_UPDATE = (_self, data) => {
    return (0, common_1.toCamelCase)(data);
};
exports.THREAD_MEMBER_UPDATE = THREAD_MEMBER_UPDATE;
const THREAD_MEMBERS_UPDATE = (_self, data) => {
    return (0, common_1.toCamelCase)(data);
};
exports.THREAD_MEMBERS_UPDATE = THREAD_MEMBERS_UPDATE;
const THREAD_UPDATE = async (self, data) => {
    return [transformers_1.Transformers.ThreadChannel(self, data), await self.cache.threads?.get(data.id)];
};
exports.THREAD_UPDATE = THREAD_UPDATE;
