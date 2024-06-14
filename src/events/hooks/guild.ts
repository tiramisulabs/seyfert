import type {
	GatewayGuildAuditLogEntryCreateDispatchData,
	GatewayGuildBanAddDispatchData,
	GatewayGuildBanRemoveDispatchData,
	GatewayGuildCreateDispatchData,
	GatewayGuildDeleteDispatchData,
	GatewayGuildEmojisUpdateDispatchData,
	GatewayGuildIntegrationsUpdateDispatchData,
	GatewayGuildMemberAddDispatchData,
	GatewayGuildMemberRemoveDispatchData,
	GatewayGuildMemberUpdateDispatchData,
	GatewayGuildMembersChunkDispatchData,
	GatewayGuildRoleCreateDispatchData,
	GatewayGuildRoleDeleteDispatchData,
	GatewayGuildRoleUpdateDispatchData,
	GatewayGuildScheduledEventCreateDispatchData,
	GatewayGuildScheduledEventDeleteDispatchData,
	GatewayGuildScheduledEventUpdateDispatchData,
	GatewayGuildScheduledEventUserAddDispatchData,
	GatewayGuildScheduledEventUserRemoveDispatchData,
	GatewayGuildStickersUpdateDispatchData,
	GatewayGuildUpdateDispatchData,
} from 'discord-api-types/v10';
import { toCamelCase } from '../../common';
import { Guild, GuildEmoji, GuildMember, GuildRole, Sticker, User } from '../../structures';
import type { UsingClient } from '../../commands';

export const GUILD_AUDIT_LOG_ENTRY_CREATE = (_self: UsingClient, data: GatewayGuildAuditLogEntryCreateDispatchData) => {
	return toCamelCase(data);
};

export const GUILD_BAN_ADD = (self: UsingClient, data: GatewayGuildBanAddDispatchData) => {
	return { ...toCamelCase(data), user: new User(self, data.user) };
};

export const GUILD_BAN_REMOVE = (self: UsingClient, data: GatewayGuildBanRemoveDispatchData) => {
	return { ...toCamelCase(data), user: new User(self, data.user) };
};

export const GUILD_CREATE = (self: UsingClient, data: GatewayGuildCreateDispatchData) => {
	return new Guild<'create'>(self, data);
};

export const GUILD_DELETE = async (self: UsingClient, data: GatewayGuildDeleteDispatchData) => {
	return (await self.cache.guilds?.get(data.id)) ?? data;
};

export const GUILD_EMOJIS_UPDATE = (self: UsingClient, data: GatewayGuildEmojisUpdateDispatchData) => {
	return {
		...toCamelCase(data),
		emojis: data.emojis.map(x => new GuildEmoji(self, x, data.guild_id)),
	};
};

export const GUILD_INTEGRATIONS_UPDATE = (_self: UsingClient, data: GatewayGuildIntegrationsUpdateDispatchData) => {
	return toCamelCase(data);
};

export const GUILD_MEMBER_ADD = (self: UsingClient, data: GatewayGuildMemberAddDispatchData) => {
	return new GuildMember(self, data, data.user!, data.guild_id);
};

export const GUILD_MEMBER_REMOVE = (self: UsingClient, data: GatewayGuildMemberRemoveDispatchData) => {
	return { ...toCamelCase(data), user: new User(self, data.user) };
};

export const GUILD_MEMBERS_CHUNK = (self: UsingClient, data: GatewayGuildMembersChunkDispatchData) => {
	return {
		...toCamelCase(data),
		members: data.members.map(x => new GuildMember(self, x, x.user!, data.guild_id)),
	};
};

export const GUILD_MEMBER_UPDATE = async (
	self: UsingClient,
	data: GatewayGuildMemberUpdateDispatchData,
): Promise<[member: GuildMember, old?: GuildMember]> => {
	const oldData = await self.cache.members?.get(data.user.id, data.guild_id);
	return [new GuildMember(self, data, data.user, data.guild_id), oldData];
};

export const GUILD_SCHEDULED_EVENT_CREATE = (
	_self: UsingClient,
	data: GatewayGuildScheduledEventCreateDispatchData,
) => {
	return toCamelCase(data);
};

export const GUILD_SCHEDULED_EVENT_UPDATE = (
	_self: UsingClient,
	data: GatewayGuildScheduledEventUpdateDispatchData,
) => {
	return toCamelCase(data);
};

export const GUILD_SCHEDULED_EVENT_DELETE = (
	_self: UsingClient,
	data: GatewayGuildScheduledEventDeleteDispatchData,
) => {
	return toCamelCase(data);
};

export const GUILD_SCHEDULED_EVENT_USER_ADD = (
	_self: UsingClient,
	data: GatewayGuildScheduledEventUserAddDispatchData,
) => {
	return toCamelCase(data);
};

export const GUILD_SCHEDULED_EVENT_USER_REMOVE = (
	_self: UsingClient,
	data: GatewayGuildScheduledEventUserRemoveDispatchData,
) => {
	return toCamelCase(data);
};

export const GUILD_ROLE_CREATE = (self: UsingClient, data: GatewayGuildRoleCreateDispatchData) => {
	return new GuildRole(self, data.role, data.guild_id);
};

export const GUILD_ROLE_DELETE = async (self: UsingClient, data: GatewayGuildRoleDeleteDispatchData) => {
	return (await self.cache.roles?.get(data.role_id)) || toCamelCase(data);
};

export const GUILD_ROLE_UPDATE = async (
	self: UsingClient,
	data: GatewayGuildRoleUpdateDispatchData,
): Promise<[role: GuildRole, old?: GuildRole]> => {
	return [new GuildRole(self, data.role, data.guild_id), await self.cache.roles?.get(data.role.id)];
};

export const GUILD_STICKERS_UPDATE = (self: UsingClient, data: GatewayGuildStickersUpdateDispatchData) => {
	return {
		...toCamelCase(data),
		stickers: data.stickers.map(x => new Sticker(self, x)),
	};
};

export const GUILD_UPDATE = async (
	self: UsingClient,
	data: GatewayGuildUpdateDispatchData,
): Promise<[guild: Guild, old?: Guild<'cached'>]> => {
	return [new Guild(self, data), await self.cache.guilds?.get(data.id)];
};
