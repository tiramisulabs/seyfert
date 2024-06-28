"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseComponent = void 0;
const v10_1 = require("discord-api-types/v10");
const builders_1 = require("../builders");
class BaseComponent {
    data;
    constructor(data) {
        this.data = data;
    }
    get type() {
        return this.data.type;
    }
    toJSON() {
        return this.data;
    }
    toBuilder() {
        return (0, builders_1.fromComponent)(this.data);
    }
}
exports.BaseComponent = BaseComponent;
