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
exports.componentFactory = componentFactory;
const v10_1 = require("discord-api-types/v10");
const BaseComponent_1 = require("./BaseComponent");
const ButtonComponent_1 = require("./ButtonComponent");
const ChannelSelectMenuComponent_1 = require("./ChannelSelectMenuComponent");
const MentionableSelectMenuComponent_1 = require("./MentionableSelectMenuComponent");
const RoleSelectMenuComponent_1 = require("./RoleSelectMenuComponent");
const StringSelectMenuComponent_1 = require("./StringSelectMenuComponent");
const UserSelectMenuComponent_1 = require("./UserSelectMenuComponent");
__exportStar(require("./componentcommand"), exports);
__exportStar(require("./componentcontext"), exports);
__exportStar(require("./modalcommand"), exports);
__exportStar(require("./modalcontext"), exports);
/**
 * Return a new component instance based on the component type.
 *
 * @param component The component to create.
 * @returns The component instance.
 */
function componentFactory(component) {
    switch (component.type) {
        case v10_1.ComponentType.Button:
            if (component.style === v10_1.ButtonStyle.Link) {
                return new ButtonComponent_1.LinkButtonComponent(component);
            }
            if (component.style === v10_1.ButtonStyle.Premium) {
                return new ButtonComponent_1.SKUButtonComponent(component);
            }
            return new ButtonComponent_1.ButtonComponent(component);
        case v10_1.ComponentType.ChannelSelect:
            return new ChannelSelectMenuComponent_1.ChannelSelectMenuComponent(component);
        case v10_1.ComponentType.RoleSelect:
            return new RoleSelectMenuComponent_1.RoleSelectMenuComponent(component);
        case v10_1.ComponentType.StringSelect:
            return new StringSelectMenuComponent_1.StringSelectMenuComponent(component);
        case v10_1.ComponentType.UserSelect:
            return new UserSelectMenuComponent_1.UserSelectMenuComponent(component);
        case v10_1.ComponentType.MentionableSelect:
            return new MentionableSelectMenuComponent_1.MentionableSelectMenuComponent(component);
        default:
            return new BaseComponent_1.BaseComponent(component);
    }
}
