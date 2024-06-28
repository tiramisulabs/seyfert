"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHANNEL_UPDATE = exports.CHANNEL_PINS_UPDATE = exports.CHANNEL_DELETE = exports.CHANNEL_CREATE = void 0;
const common_1 = require("../../common");
const channels_1 = __importDefault(require("../../structures/channels"));
const CHANNEL_CREATE = (self, data) => {
    return (0, channels_1.default)(data, self);
};
exports.CHANNEL_CREATE = CHANNEL_CREATE;
const CHANNEL_DELETE = (self, data) => {
    return (0, channels_1.default)(data, self);
};
exports.CHANNEL_DELETE = CHANNEL_DELETE;
const CHANNEL_PINS_UPDATE = (_self, data) => {
    return (0, common_1.toCamelCase)(data);
};
exports.CHANNEL_PINS_UPDATE = CHANNEL_PINS_UPDATE;
const CHANNEL_UPDATE = async (self, data) => {
    return [(0, channels_1.default)(data, self), await self.cache.channels?.get(data.id)];
};
exports.CHANNEL_UPDATE = CHANNEL_UPDATE;
