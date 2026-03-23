import { type ClientUserStructure, type GuildStructure, Transformers } from '../../client/transformers';
import type { UsingClient } from '../../commands';
import type { APIUnavailableGuild, GatewayRawGuildCreateDispatch, GatewayRawGuildDeleteDispatch } from '../../types';
import type { ShardDisconnectData, ShardReconnectData } from '../../websocket';

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

export const SHARD_DISCONNECT = (_self: UsingClient, data: ShardDisconnectData): ShardDisconnectData => {
	return data;
};

export const SHARD_RECONNECT = (_self: UsingClient, data: ShardReconnectData): ShardReconnectData => {
	return data;
};
