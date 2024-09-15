import { Transformers } from '../../client/transformers';
import type { UsingClient } from '../../commands';
import { toCamelCase } from '../../common';
import type {
	GatewayIntegrationCreateDispatchData,
	GatewayIntegrationDeleteDispatchData,
	GatewayIntegrationUpdateDispatchData,
} from '../../types';

export const INTEGRATION_CREATE = (self: UsingClient, data: GatewayIntegrationCreateDispatchData) => {
	return data.user
		? {
				...toCamelCase(data),
				user: Transformers.User(self, data.user!),
			}
		: toCamelCase(data);
};

export const INTEGRATION_UPDATE = (self: UsingClient, data: GatewayIntegrationUpdateDispatchData) => {
	return data.user
		? {
				...toCamelCase(data),
				user: Transformers.User(self, data.user!),
			}
		: toCamelCase(data);
};

export const INTEGRATION_DELETE = (
	_self: UsingClient,

	data: GatewayIntegrationDeleteDispatchData,
) => {
	return toCamelCase(data);
};
