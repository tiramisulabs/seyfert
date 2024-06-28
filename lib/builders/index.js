"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromComponent = fromComponent;
const v10_1 = require("discord-api-types/v10");
const ActionRow_1 = require("./ActionRow");
const Button_1 = require("./Button");
const Modal_1 = require("./Modal");
const SelectMenu_1 = require("./SelectMenu");
__exportStar(require("./ActionRow"), exports);
__exportStar(require("./Attachment"), exports);
__exportStar(require("./Base"), exports);
__exportStar(require("./Button"), exports);
__exportStar(require("./Embed"), exports);
__exportStar(require("./Modal"), exports);
__exportStar(require("./SelectMenu"), exports);
__exportStar(require("./Poll"), exports);
__exportStar(require("./types"), exports);
function fromComponent(data) {
    if ('toJSON' in data) {
        return data;
    }
    switch (data.type) {
        case v10_1.ComponentType.Button:
            return new Button_1.Button(data);
        case v10_1.ComponentType.StringSelect:
            return new SelectMenu_1.StringSelectMenu(data);
        case v10_1.ComponentType.TextInput:
            return new Modal_1.TextInput(data);
        case v10_1.ComponentType.UserSelect:
            return new SelectMenu_1.UserSelectMenu(data);
        case v10_1.ComponentType.RoleSelect:
            return new SelectMenu_1.RoleSelectMenu(data);
        case v10_1.ComponentType.MentionableSelect:
            return new SelectMenu_1.MentionableSelectMenu(data);
        case v10_1.ComponentType.ChannelSelect:
            return new SelectMenu_1.ChannelSelectMenu(data);
        case v10_1.ComponentType.ActionRow:
            return new ActionRow_1.ActionRow(data);
    }
}
