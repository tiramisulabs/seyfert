import type { GatewayUserUpdateDispatchData } from 'discord-api-types/v10';
import type { UsingClient } from '../../commands';
import { Transformers, type UserStructure } from '../../client/transformers';

export const USER_UPDATE = async (
	self: UsingClient,
	data: GatewayUserUpdateDispatchData,
): Promise<[user: UserStructure, old?: UserStructure]> => {
	return [Transformers.User(self, data), await self.cache.users?.get(data.id)];
};
