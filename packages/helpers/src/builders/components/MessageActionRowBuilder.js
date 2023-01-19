"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionRowBuilder = void 0;
const api_types_1 = require("@biscuitland/api-types");
class ActionRowBuilder {
    constructor() {
        this.components = [];
        this.type = api_types_1.MessageComponentTypes.ActionRow;
    }
    addComponents(...components) {
        this.components.push(...components);
        return this;
    }
    setComponents(...components) {
        this.components.splice(0, this.components.length, ...components);
        return this;
    }
    toJSON() {
        return {
            type: this.type,
            components: this.components.map(c => c.toJSON()),
        };
    }
}
exports.ActionRowBuilder = ActionRowBuilder;
