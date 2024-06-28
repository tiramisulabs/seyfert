"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RAW = exports.RESUMED = exports.READY = void 0;
const transformers_1 = require("../../client/transformers");
const READY = (self, data) => {
    return transformers_1.Transformers.ClientUser(self, data.user, data.application);
};
exports.READY = READY;
const RESUMED = (_self, _data) => {
    return;
};
exports.RESUMED = RESUMED;
const RAW = (_self, data) => {
    return data;
};
exports.RAW = RAW;
