"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENTITLEMENT_DELETE = exports.ENTITLEMENT_UPDATE = exports.ENTITLEMENT_CREATE = void 0;
const common_1 = require("../../common");
const ENTITLEMENT_CREATE = (_, data) => {
    return (0, common_1.toCamelCase)(data);
};
exports.ENTITLEMENT_CREATE = ENTITLEMENT_CREATE;
const ENTITLEMENT_UPDATE = (_, data) => {
    return (0, common_1.toCamelCase)(data);
};
exports.ENTITLEMENT_UPDATE = ENTITLEMENT_UPDATE;
const ENTITLEMENT_DELETE = (_, data) => {
    return (0, common_1.toCamelCase)(data);
};
exports.ENTITLEMENT_DELETE = ENTITLEMENT_DELETE;
