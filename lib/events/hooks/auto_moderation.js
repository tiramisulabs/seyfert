"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUTO_MODERATION_RULE_UPDATE = exports.AUTO_MODERATION_RULE_DELETE = exports.AUTO_MODERATION_RULE_CREATE = exports.AUTO_MODERATION_ACTION_EXECUTION = void 0;
const common_1 = require("../../common");
const transformers_1 = require("../../client/transformers");
const AUTO_MODERATION_ACTION_EXECUTION = (_self, data) => {
    return (0, common_1.toCamelCase)(data);
};
exports.AUTO_MODERATION_ACTION_EXECUTION = AUTO_MODERATION_ACTION_EXECUTION;
const AUTO_MODERATION_RULE_CREATE = (self, data) => {
    return transformers_1.Transformers.AutoModerationRule(self, data);
};
exports.AUTO_MODERATION_RULE_CREATE = AUTO_MODERATION_RULE_CREATE;
const AUTO_MODERATION_RULE_DELETE = (self, data) => {
    return transformers_1.Transformers.AutoModerationRule(self, data);
};
exports.AUTO_MODERATION_RULE_DELETE = AUTO_MODERATION_RULE_DELETE;
const AUTO_MODERATION_RULE_UPDATE = (self, data) => {
    return transformers_1.Transformers.AutoModerationRule(self, data);
};
exports.AUTO_MODERATION_RULE_UPDATE = AUTO_MODERATION_RULE_UPDATE;
