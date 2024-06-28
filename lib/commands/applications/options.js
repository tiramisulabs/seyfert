"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStringOption = createStringOption;
exports.createIntegerOption = createIntegerOption;
exports.createBooleanOption = createBooleanOption;
exports.createUserOption = createUserOption;
exports.createChannelOption = createChannelOption;
exports.createRoleOption = createRoleOption;
exports.createMentionableOption = createMentionableOption;
exports.createNumberOption = createNumberOption;
exports.createAttachmentOption = createAttachmentOption;
exports.createMiddleware = createMiddleware;
const v10_1 = require("discord-api-types/v10");
function createStringOption(data) {
    return { ...data, type: v10_1.ApplicationCommandOptionType.String };
}
function createIntegerOption(data) {
    return { ...data, type: v10_1.ApplicationCommandOptionType.Integer };
}
function createBooleanOption(data) {
    return { ...data, type: v10_1.ApplicationCommandOptionType.Boolean };
}
function createUserOption(data) {
    return { ...data, type: v10_1.ApplicationCommandOptionType.User };
}
function createChannelOption(data) {
    return { ...data, type: v10_1.ApplicationCommandOptionType.Channel };
}
function createRoleOption(data) {
    return { ...data, type: v10_1.ApplicationCommandOptionType.Role };
}
function createMentionableOption(data) {
    return { ...data, type: v10_1.ApplicationCommandOptionType.Mentionable };
}
function createNumberOption(data) {
    return { ...data, type: v10_1.ApplicationCommandOptionType.Number };
}
function createAttachmentOption(data) {
    return { ...data, type: v10_1.ApplicationCommandOptionType.Attachment };
}
function createMiddleware(data) {
    return data;
}
