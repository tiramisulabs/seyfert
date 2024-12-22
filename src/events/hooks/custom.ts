import { type ClientUserStructure, type GuildStructure, Transformers } from '../../client/transformers';
import type { UsingClient } from '../../commands';
import type { APIUnavailableGuild, GatewayRawGuildCreateDispatch, GatewayRawGuildDeleteDispatch } from '../../types';

export const BOT_READY = (_self: UsingClient, me: ClientUserStructure): ClientUserStructure => {
	return me;
};

export const WORKER_READY = (_self: UsingClient, me: ClientUserStructure): ClientUserStructure => {
	return me;
};

export const WORKER_SHARDS_CONNECTED = (_self: UsingClient, me: ClientUserStructure): ClientUserStructure => {
	return me;
};

export const RAW_GUILD_CREATE = (
	self: UsingClient,
	data: GatewayRawGuildCreateDispatch['d'],
): GuildStructure<'create'> => {
	return Transformers.Guild<'create'>(self, data);
};

export const RAW_GUILD_DELETE = async (
	self: UsingClient,
	data: GatewayRawGuildDeleteDispatch['d'],
): Promise<GuildStructure<'cached'> | APIUnavailableGuild> => {
	return (await self.cache.guilds?.get(data.id)) ?? data;
};

export const GUILDS_READY = () => {
	return;
};
