import { type ThreadChannelStructure, Transformers } from '../../client/transformers';
import type { UsingClient } from '../../commands';
import { type ObjectToLower, toCamelCase } from '../../common';
import type {
	GatewayThreadCreateDispatchData,
	GatewayThreadDeleteDispatchData,
	GatewayThreadListSyncDispatchData,
	GatewayThreadMemberUpdateDispatchData,
	GatewayThreadMembersUpdateDispatchData,
	GatewayThreadUpdateDispatchData,
} from '../../types';

export const THREAD_CREATE = (self: UsingClient, data: GatewayThreadCreateDispatchData): ThreadChannelStructure => {
	return Transformers.ThreadChannel(self, data);
};

export const THREAD_DELETE = async (
	self: UsingClient,
	data: GatewayThreadDeleteDispatchData,
): Promise<ThreadChannelStructure | ObjectToLower<GatewayThreadDeleteDispatchData>> => {
	return ((await self.cache.channels?.get(data.id)) as ThreadChannelStructure | undefined) ?? toCamelCase(data);
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
	return [Transformers.ThreadChannel(self, data), (await self.cache.channels?.get(data.id)) as ThreadChannelStructure];
};
