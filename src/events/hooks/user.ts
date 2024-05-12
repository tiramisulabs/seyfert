import type { GatewayUserUpdateDispatchData } from 'discord-api-types/v10';
import type { BaseClient } from '../../client/base';
import { User } from '../../structures';

export const USER_UPDATE = async (
	self: BaseClient,
	data: GatewayUserUpdateDispatchData,
): Promise<[user: User, old?: User]> => {
	return [new User(self, data), await self.cache.users?.get(data.id)];
};
