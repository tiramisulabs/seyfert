import type { GatewayUserUpdateDispatchData } from 'discord-api-types/v10';
import { User } from '../../structures';
import type { UsingClient } from '../../commands';

export const USER_UPDATE = async (
	self: UsingClient,
	data: GatewayUserUpdateDispatchData,
): Promise<[user: User, old?: User]> => {
	return [new User(self, data), await self.cache.users?.get(data.id)];
};
