"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MESSAGE_POLL_VOTE_REMOVE = exports.MESSAGE_UPDATE = exports.MESSAGE_REACTION_REMOVE_EMOJI = exports.MESSAGE_REACTION_REMOVE_ALL = exports.MESSAGE_REACTION_REMOVE = exports.MESSAGE_REACTION_ADD = exports.MESSAGE_DELETE_BULK = exports.MESSAGE_DELETE = exports.MESSAGE_CREATE = void 0;
const common_1 = require("../../common");
const transformers_1 = require("../../client/transformers");
const MESSAGE_CREATE = (self, data) => {
    return transformers_1.Transformers.Message(self, data);
};
exports.MESSAGE_CREATE = MESSAGE_CREATE;
const MESSAGE_DELETE = async (self, data) => {
    return (await self.cache.messages?.get(data.id)) ?? (0, common_1.toCamelCase)(data);
};
exports.MESSAGE_DELETE = MESSAGE_DELETE;
const MESSAGE_DELETE_BULK = async (self, data) => {
    return {
        ...data,
        messages: await Promise.all(data.ids.map(id => self.cache.messages?.get(id))),
    };
};
exports.MESSAGE_DELETE_BULK = MESSAGE_DELETE_BULK;
const MESSAGE_REACTION_ADD = (_self, data) => {
    return (0, common_1.toCamelCase)(data);
};
exports.MESSAGE_REACTION_ADD = MESSAGE_REACTION_ADD;
const MESSAGE_REACTION_REMOVE = (_self, data) => {
    return (0, common_1.toCamelCase)(data);
};
exports.MESSAGE_REACTION_REMOVE = MESSAGE_REACTION_REMOVE;
const MESSAGE_REACTION_REMOVE_ALL = (_self, data) => {
    return (0, common_1.toCamelCase)(data);
};
exports.MESSAGE_REACTION_REMOVE_ALL = MESSAGE_REACTION_REMOVE_ALL;
const MESSAGE_REACTION_REMOVE_EMOJI = (_self, data) => {
    return (0, common_1.toCamelCase)(data);
};
exports.MESSAGE_REACTION_REMOVE_EMOJI = MESSAGE_REACTION_REMOVE_EMOJI;
const MESSAGE_UPDATE = async (self, data) => {
    return [transformers_1.Transformers.Message(self, data), await self.cache.messages?.get(data.id)];
};
exports.MESSAGE_UPDATE = MESSAGE_UPDATE;
const MESSAGE_POLL_VOTE_REMOVE = (_, data) => {
    return (0, common_1.toCamelCase)(data);
};
exports.MESSAGE_POLL_VOTE_REMOVE = MESSAGE_POLL_VOTE_REMOVE;
