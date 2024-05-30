import type {
	GatewayIntegrationCreateDispatchData,
	GatewayIntegrationDeleteDispatchData,
	GatewayIntegrationUpdateDispatchData,
} from 'discord-api-types/v10';
import { toCamelCase } from '../../common';
import { User } from '../../structures';
import type { UsingClient } from '../../commands';

export const INTEGRATION_CREATE = (self: UsingClient, data: GatewayIntegrationCreateDispatchData) => {
	return data.user
		? {
				...toCamelCase(data),
				user: new User(self, data.user!),
			}
		: toCamelCase(data);
};

export const INTEGRATION_UPDATE = (self: UsingClient, data: GatewayIntegrationUpdateDispatchData) => {
	return data.user
		? {
				...toCamelCase(data),
				user: new User(self, data.user!),
			}
		: toCamelCase(data);
};

export const INTEGRATION_DELETE = (
	_self: UsingClient,

	data: GatewayIntegrationDeleteDispatchData,
) => {
	return toCamelCase(data);
};
