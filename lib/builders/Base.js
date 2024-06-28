"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseComponentBuilder = void 0;
class BaseComponentBuilder {
    data;
    constructor(data) {
        this.data = data;
    }
    toJSON() {
        return { ...this.data };
    }
}
exports.BaseComponentBuilder = BaseComponentBuilder;
