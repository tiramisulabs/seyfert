"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GUILD_UPDATE = exports.GUILD_STICKERS_UPDATE = exports.GUILD_ROLE_UPDATE = exports.GUILD_ROLE_DELETE = exports.GUILD_ROLE_CREATE = exports.GUILD_SCHEDULED_EVENT_USER_REMOVE = exports.GUILD_SCHEDULED_EVENT_USER_ADD = exports.GUILD_SCHEDULED_EVENT_DELETE = exports.GUILD_SCHEDULED_EVENT_UPDATE = exports.GUILD_SCHEDULED_EVENT_CREATE = exports.GUILD_MEMBER_UPDATE = exports.GUILD_MEMBERS_CHUNK = exports.GUILD_MEMBER_REMOVE = exports.GUILD_MEMBER_ADD = exports.GUILD_INTEGRATIONS_UPDATE = exports.GUILD_EMOJIS_UPDATE = exports.GUILD_DELETE = exports.GUILD_CREATE = exports.GUILD_BAN_REMOVE = exports.GUILD_BAN_ADD = exports.GUILD_AUDIT_LOG_ENTRY_CREATE = void 0;
const common_1 = require("../../common");
const transformers_1 = require("../../client/transformers");
const GUILD_AUDIT_LOG_ENTRY_CREATE = (_self, data) => {
    return (0, common_1.toCamelCase)(data);
};
exports.GUILD_AUDIT_LOG_ENTRY_CREATE = GUILD_AUDIT_LOG_ENTRY_CREATE;
const GUILD_BAN_ADD = (self, data) => {
    return { ...(0, common_1.toCamelCase)(data), user: transformers_1.Transformers.User(self, data.user) };
};
exports.GUILD_BAN_ADD = GUILD_BAN_ADD;
const GUILD_BAN_REMOVE = (self, data) => {
    return { ...(0, common_1.toCamelCase)(data), user: transformers_1.Transformers.User(self, data.user) };
};
exports.GUILD_BAN_REMOVE = GUILD_BAN_REMOVE;
const GUILD_CREATE = (self, data) => {
    return transformers_1.Transformers.Guild(self, data);
};
exports.GUILD_CREATE = GUILD_CREATE;
const GUILD_DELETE = async (self, data) => {
    return (await self.cache.guilds?.get(data.id)) ?? data;
};
exports.GUILD_DELETE = GUILD_DELETE;
const GUILD_EMOJIS_UPDATE = (self, data) => {
    return {
        ...(0, common_1.toCamelCase)(data),
        emojis: data.emojis.map(x => transformers_1.Transformers.GuildEmoji(self, x, data.guild_id)),
    };
};
exports.GUILD_EMOJIS_UPDATE = GUILD_EMOJIS_UPDATE;
const GUILD_INTEGRATIONS_UPDATE = (_self, data) => {
    return (0, common_1.toCamelCase)(data);
};
exports.GUILD_INTEGRATIONS_UPDATE = GUILD_INTEGRATIONS_UPDATE;
const GUILD_MEMBER_ADD = (self, data) => {
    return transformers_1.Transformers.GuildMember(self, data, data.user, data.guild_id);
};
exports.GUILD_MEMBER_ADD = GUILD_MEMBER_ADD;
const GUILD_MEMBER_REMOVE = (self, data) => {
    return { ...(0, common_1.toCamelCase)(data), user: transformers_1.Transformers.User(self, data.user) };
};
exports.GUILD_MEMBER_REMOVE = GUILD_MEMBER_REMOVE;
const GUILD_MEMBERS_CHUNK = (self, data) => {
    return {
        ...(0, common_1.toCamelCase)(data),
        members: data.members.map(x => transformers_1.Transformers.GuildMember(self, x, x.user, data.guild_id)),
    };
};
exports.GUILD_MEMBERS_CHUNK = GUILD_MEMBERS_CHUNK;
const GUILD_MEMBER_UPDATE = async (self, data) => {
    const oldData = await self.cache.members?.get(data.user.id, data.guild_id);
    return [transformers_1.Transformers.GuildMember(self, data, data.user, data.guild_id), oldData];
};
exports.GUILD_MEMBER_UPDATE = GUILD_MEMBER_UPDATE;
const GUILD_SCHEDULED_EVENT_CREATE = (_self, data) => {
    return (0, common_1.toCamelCase)(data);
};
exports.GUILD_SCHEDULED_EVENT_CREATE = GUILD_SCHEDULED_EVENT_CREATE;
const GUILD_SCHEDULED_EVENT_UPDATE = (_self, data) => {
    return (0, common_1.toCamelCase)(data);
};
exports.GUILD_SCHEDULED_EVENT_UPDATE = GUILD_SCHEDULED_EVENT_UPDATE;
const GUILD_SCHEDULED_EVENT_DELETE = (_self, data) => {
    return (0, common_1.toCamelCase)(data);
};
exports.GUILD_SCHEDULED_EVENT_DELETE = GUILD_SCHEDULED_EVENT_DELETE;
const GUILD_SCHEDULED_EVENT_USER_ADD = (_self, data) => {
    return (0, common_1.toCamelCase)(data);
};
exports.GUILD_SCHEDULED_EVENT_USER_ADD = GUILD_SCHEDULED_EVENT_USER_ADD;
const GUILD_SCHEDULED_EVENT_USER_REMOVE = (_self, data) => {
    return (0, common_1.toCamelCase)(data);
};
exports.GUILD_SCHEDULED_EVENT_USER_REMOVE = GUILD_SCHEDULED_EVENT_USER_REMOVE;
const GUILD_ROLE_CREATE = (self, data) => {
    return transformers_1.Transformers.GuildRole(self, data.role, data.guild_id);
};
exports.GUILD_ROLE_CREATE = GUILD_ROLE_CREATE;
const GUILD_ROLE_DELETE = async (self, data) => {
    return (await self.cache.roles?.get(data.role_id)) || (0, common_1.toCamelCase)(data);
};
exports.GUILD_ROLE_DELETE = GUILD_ROLE_DELETE;
const GUILD_ROLE_UPDATE = async (self, data) => {
    return [transformers_1.Transformers.GuildRole(self, data.role, data.guild_id), await self.cache.roles?.get(data.role.id)];
};
exports.GUILD_ROLE_UPDATE = GUILD_ROLE_UPDATE;
const GUILD_STICKERS_UPDATE = (self, data) => {
    return {
        ...(0, common_1.toCamelCase)(data),
        stickers: data.stickers.map(x => transformers_1.Transformers.Sticker(self, x)),
    };
};
exports.GUILD_STICKERS_UPDATE = GUILD_STICKERS_UPDATE;
const GUILD_UPDATE = async (self, data) => {
    return [transformers_1.Transformers.Guild(self, data), await self.cache.guilds?.get(data.id)];
};
exports.GUILD_UPDATE = GUILD_UPDATE;
