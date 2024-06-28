"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageActionRowComponent = void 0;
const BaseComponent_1 = require("./BaseComponent");
const index_1 = require("./index");
class MessageActionRowComponent extends BaseComponent_1.BaseComponent {
    ComponentsFactory;
    constructor(data) {
        super(data);
        this.ComponentsFactory = data.components.map(index_1.componentFactory);
    }
    get components() {
        return this.ComponentsFactory;
    }
}
exports.MessageActionRowComponent = MessageActionRowComponent;
