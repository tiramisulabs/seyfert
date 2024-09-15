import { Transformers, type UserStructure } from '../../client/transformers';
import type { UsingClient } from '../../commands';
import type { GatewayUserUpdateDispatchData } from '../../types';

export const USER_UPDATE = async (
	self: UsingClient,
	data: GatewayUserUpdateDispatchData,
): Promise<[user: UserStructure, old?: UserStructure]> => {
	return [Transformers.User(self, data), await self.cache.users?.get(data.id)];
};
