"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INTEGRATION_DELETE = exports.INTEGRATION_UPDATE = exports.INTEGRATION_CREATE = void 0;
const common_1 = require("../../common");
const transformers_1 = require("../../client/transformers");
const INTEGRATION_CREATE = (self, data) => {
    return data.user
        ? {
            ...(0, common_1.toCamelCase)(data),
            user: transformers_1.Transformers.User(self, data.user),
        }
        : (0, common_1.toCamelCase)(data);
};
exports.INTEGRATION_CREATE = INTEGRATION_CREATE;
const INTEGRATION_UPDATE = (self, data) => {
    return data.user
        ? {
            ...(0, common_1.toCamelCase)(data),
            user: transformers_1.Transformers.User(self, data.user),
        }
        : (0, common_1.toCamelCase)(data);
};
exports.INTEGRATION_UPDATE = INTEGRATION_UPDATE;
const INTEGRATION_DELETE = (_self, data) => {
    return (0, common_1.toCamelCase)(data);
};
exports.INTEGRATION_DELETE = INTEGRATION_DELETE;
