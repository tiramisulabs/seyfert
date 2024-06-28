"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentCommand = exports.InteractionCommandType = void 0;
const v10_1 = require("discord-api-types/v10");
exports.InteractionCommandType = {
    COMPONENT: 0,
    MODAL: 1,
};
class ComponentCommand {
    type = exports.InteractionCommandType.COMPONENT;
    middlewares = [];
    props;
    get cType() {
        return v10_1.ComponentType[this.componentType];
    }
}
exports.ComponentCommand = ComponentCommand;
