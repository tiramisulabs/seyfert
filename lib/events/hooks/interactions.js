"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INTERACTION_CREATE = void 0;
const structures_1 = require("../../structures");
const INTERACTION_CREATE = (self, data) => {
    return structures_1.BaseInteraction.from(self, data);
};
exports.INTERACTION_CREATE = INTERACTION_CREATE;
