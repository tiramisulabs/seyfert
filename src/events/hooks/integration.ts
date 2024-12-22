import { Transformers, type UserStructure } from '../../client/transformers';
import type { UsingClient } from '../../commands';
import { type ObjectToLower, toCamelCase } from '../../common';
import type {
	GatewayIntegrationCreateDispatchData,
	GatewayIntegrationDeleteDispatchData,
	GatewayIntegrationUpdateDispatchData,
} from '../../types';

export const INTEGRATION_CREATE = (
	self: UsingClient,
	data: GatewayIntegrationCreateDispatchData,
):
	| (ObjectToLower<Omit<GatewayIntegrationCreateDispatchData, 'user'>> & {
			user: UserStructure;
	  })
	| ObjectToLower<Omit<GatewayIntegrationCreateDispatchData, 'user'>> => {
	return data.user
		? {
				...toCamelCase(data),
				user: Transformers.User(self, data.user),
			}
		: toCamelCase(data);
};

export const INTEGRATION_UPDATE = (
	self: UsingClient,
	data: GatewayIntegrationUpdateDispatchData,
):
	| (ObjectToLower<Omit<GatewayIntegrationUpdateDispatchData, 'user'>> & {
			user: UserStructure;
	  })
	| ObjectToLower<Omit<GatewayIntegrationUpdateDispatchData, 'user'>> => {
	return data.user
		? {
				...toCamelCase(data),
				user: Transformers.User(self, data.user),
			}
		: toCamelCase(data);
};

export const INTEGRATION_DELETE = (_self: UsingClient, data: GatewayIntegrationDeleteDispatchData) => {
	return toCamelCase(data);
};
