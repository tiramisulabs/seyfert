import type { BaseClient } from '../../client/base';
import type {
	GatewayGuildAuditLogEntryCreateDispatchData,
	GatewayGuildBanAddDispatchData,
	GatewayGuildBanRemoveDispatchData,
	GatewayGuildCreateDispatchData,
	GatewayGuildDeleteDispatchData,
	GatewayGuildEmojisUpdateDispatchData,
	GatewayGuildIntegrationsUpdateDispatchData,
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
} from '../../common';
import { toCamelCase } from '../../common';
import {
	Guild,
	GuildEmoji,
	GuildMember,
	GuildRole,
	Sticker,
	UnavailableMember,
	User,
	type GatewayGuildMemberAddDispatchDataFixed,
} from '../../structures';

export const GUILD_AUDIT_LOG_ENTRY_CREATE = (_self: BaseClient, data: GatewayGuildAuditLogEntryCreateDispatchData) => {
	return toCamelCase(data);
};

export const GUILD_BAN_ADD = (self: BaseClient, data: GatewayGuildBanAddDispatchData) => {
	return { ...toCamelCase(data), user: new User(self, data.user) };
};

export const GUILD_BAN_REMOVE = (self: BaseClient, data: GatewayGuildBanRemoveDispatchData) => {
	return { ...toCamelCase(data), user: new User(self, data.user) };
};

export const GUILD_CREATE = (self: BaseClient, data: GatewayGuildCreateDispatchData) => {
	return new Guild<'create'>(self, data);
};

export const GUILD_DELETE = async (_self: BaseClient, data: GatewayGuildDeleteDispatchData) => {
	return data;
};

export const GUILD_EMOJIS_UPDATE = (self: BaseClient, data: GatewayGuildEmojisUpdateDispatchData) => {
	return {
		...toCamelCase(data),
		emojis: data.emojis.map(x => new GuildEmoji(self, x, data.guild_id)),
	};
};

export const GUILD_INTEGRATIONS_UPDATE = (_self: BaseClient, data: GatewayGuildIntegrationsUpdateDispatchData) => {
	return toCamelCase(data);
};

export const GUILD_MEMBER_ADD = (self: BaseClient, data: GatewayGuildMemberAddDispatchDataFixed<boolean>) => {
	if (!('user' in data)) return new UnavailableMember(self, data, data.id, data.guild_id);
	return new GuildMember(self, data, data.user, data.guild_id);
};

export const GUILD_MEMBER_REMOVE = (self: BaseClient, data: GatewayGuildMemberRemoveDispatchData) => {
	return { ...toCamelCase(data), user: new User(self, data.user) };
};

export const GUILD_MEMBERS_CHUNK = (self: BaseClient, data: GatewayGuildMembersChunkDispatchData) => {
	return {
		...toCamelCase(data),
		members: data.members.map(x => new GuildMember(self, x, x.user!, data.guild_id)),
	};
};

export const GUILD_MEMBER_UPDATE = async (
	self: BaseClient,
	data: GatewayGuildMemberUpdateDispatchData,
): Promise<[member: GuildMember, old?: GuildMember]> => {
	const oldData = await self.cache.members?.get(data.user.id, data.guild_id);
	return [new GuildMember(self, data, data.user, data.guild_id), oldData];
};

export const GUILD_SCHEDULED_EVENT_CREATE = (_self: BaseClient, data: GatewayGuildScheduledEventCreateDispatchData) => {
	return toCamelCase(data);
};

export const GUILD_SCHEDULED_EVENT_UPDATE = (_self: BaseClient, data: GatewayGuildScheduledEventUpdateDispatchData) => {
	return toCamelCase(data);
};

export const GUILD_SCHEDULED_EVENT_DELETE = (_self: BaseClient, data: GatewayGuildScheduledEventDeleteDispatchData) => {
	return toCamelCase(data);
};

export const GUILD_SCHEDULED_EVENT_USER_ADD = (
	_self: BaseClient,
	data: GatewayGuildScheduledEventUserAddDispatchData,
) => {
	return toCamelCase(data);
};

export const GUILD_SCHEDULED_EVENT_USER_REMOVE = (
	_self: BaseClient,
	data: GatewayGuildScheduledEventUserRemoveDispatchData,
) => {
	return toCamelCase(data);
};

export const GUILD_ROLE_CREATE = (self: BaseClient, data: GatewayGuildRoleCreateDispatchData) => {
	return new GuildRole(self, data.role, data.guild_id);
};

export const GUILD_ROLE_DELETE = (_self: BaseClient, data: GatewayGuildRoleDeleteDispatchData) => {
	return toCamelCase(data);
};

export const GUILD_ROLE_UPDATE = (self: BaseClient, data: GatewayGuildRoleUpdateDispatchData) => {
	return new GuildRole(self, data.role, data.guild_id);
};

export const GUILD_STICKERS_UPDATE = (self: BaseClient, data: GatewayGuildStickersUpdateDispatchData) => {
	return {
		...toCamelCase(data),
		stickers: data.stickers.map(x => new Sticker(self, x)),
	};
};

export const GUILD_UPDATE = (self: BaseClient, data: GatewayGuildUpdateDispatchData) => {
	return new Guild(self, data);
};
