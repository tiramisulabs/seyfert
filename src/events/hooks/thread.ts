import type {
	GatewayThreadCreateDispatchData,
	GatewayThreadDeleteDispatchData,
	GatewayThreadListSyncDispatchData,
	GatewayThreadMemberUpdateDispatchData,
	GatewayThreadMembersUpdateDispatchData,
	GatewayThreadUpdateDispatchData,
} from 'discord-api-types/v10';
import { toCamelCase } from '../../common';
import type { UsingClient } from '../../commands';
import { type ThreadChannelStructure, Transformers } from '../../client/transformers';

export const THREAD_CREATE = (self: UsingClient, data: GatewayThreadCreateDispatchData) => {
	return Transformers.ThreadChannel(self, data);
};

export const THREAD_DELETE = (self: UsingClient, data: GatewayThreadDeleteDispatchData) => {
	return Transformers.ThreadChannel(self, data);
};

export const THREAD_LIST_SYNC = (_self: UsingClient, data: GatewayThreadListSyncDispatchData) => {
	return toCamelCase(data);
};

export const THREAD_MEMBER_UPDATE = (_self: UsingClient, data: GatewayThreadMemberUpdateDispatchData) => {
	return toCamelCase(data);
};

export const THREAD_MEMBERS_UPDATE = (_self: UsingClient, data: GatewayThreadMembersUpdateDispatchData) => {
	return toCamelCase(data);
};

export const THREAD_UPDATE = async (
	self: UsingClient,
	data: GatewayThreadUpdateDispatchData,
): Promise<[thread: ThreadChannelStructure, old?: ThreadChannelStructure]> => {
	return [Transformers.ThreadChannel(self, data), await self.cache.threads?.get(data.id)];
};
