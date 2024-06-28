"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STAGE_INSTANCE_UPDATE = exports.STAGE_INSTANCE_DELETE = exports.STAGE_INSTANCE_CREATE = void 0;
const common_1 = require("../../common");
const STAGE_INSTANCE_CREATE = (_self, data) => {
    return (0, common_1.toCamelCase)(data);
};
exports.STAGE_INSTANCE_CREATE = STAGE_INSTANCE_CREATE;
const STAGE_INSTANCE_DELETE = (_self, data) => {
    return (0, common_1.toCamelCase)(data);
};
exports.STAGE_INSTANCE_DELETE = STAGE_INSTANCE_DELETE;
const STAGE_INSTANCE_UPDATE = async (self, data) => {
    return [(0, common_1.toCamelCase)(data), await self.cache.stageInstances?.get(data.id)];
};
exports.STAGE_INSTANCE_UPDATE = STAGE_INSTANCE_UPDATE;
