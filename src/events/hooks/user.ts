import type { GatewayUserUpdateDispatchData } from 'discord-api-types/v10';
import type { BaseClient } from '../../client/base';
import { User } from '../../structures';

export const USER_UPDATE = (self: BaseClient, data: GatewayUserUpdateDispatchData) => {
	return new User(self, data);
};
