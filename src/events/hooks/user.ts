import type { BaseClient } from '../../client/base';
import type { GatewayUserUpdateDispatchData } from '../../common';
import { User } from '../../structures';

export const USER_UPDATE = (self: BaseClient, data: GatewayUserUpdateDispatchData) => {
	return new User(self, data);
};
