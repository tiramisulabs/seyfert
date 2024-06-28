"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModalCommand = void 0;
const componentcommand_1 = require("./componentcommand");
class ModalCommand {
    type = componentcommand_1.InteractionCommandType.MODAL;
    middlewares = [];
    props;
}
exports.ModalCommand = ModalCommand;
