"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INVITE_DELETE = exports.INVITE_CREATE = void 0;
const common_1 = require("../../common");
const INVITE_CREATE = (_self, data) => {
    return (0, common_1.toCamelCase)(data);
};
exports.INVITE_CREATE = INVITE_CREATE;
const INVITE_DELETE = (_self, data) => {
    return (0, common_1.toCamelCase)(data);
};
exports.INVITE_DELETE = INVITE_DELETE;
