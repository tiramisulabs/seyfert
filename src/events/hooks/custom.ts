import { type ClientUserStructure, Transformers } from '../../client/transformers';
import type { UsingClient } from '../../commands';
import type { GatewayRawGuildCreateDispatch, GatewayRawGuildDeleteDispatch } from '../../types';

export const BOT_READY = (_self: UsingClient, me: ClientUserStructure) => {
	return me;
};

export const WORKER_READY = (_self: UsingClient, me: ClientUserStructure) => {
	return me;
};

export const WORKER_SHARDS_CONNECTED = (_self: UsingClient, me: ClientUserStructure) => {
	return me;
};

export const RAW_GUILD_CREATE = (self: UsingClient, data: GatewayRawGuildCreateDispatch['d']) => {
	return Transformers.Guild<'create'>(self, data);
};

export const RAW_GUILD_DELETE = async (self: UsingClient, data: GatewayRawGuildDeleteDispatch['d']) => {
	return (await self.cache.guilds?.get(data.id)) ?? data;
};

export const GUILDS_READY = () => {
	return;
};
