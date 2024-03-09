import type { BaseClient } from '../../client/base';
import type { GatewayDispatchPayload, GatewayReadyDispatchData, GatewayResumedDispatch } from '../../common';
import { ClientUser } from '../../structures';

export const READY = (self: BaseClient, data: GatewayReadyDispatchData) => {
	return new ClientUser(self, data.user, data.application);
};

export const RESUMED = (_self: BaseClient, _data: GatewayResumedDispatch['d']) => {
	return;
};

export const RAW = (_self: BaseClient, data: GatewayDispatchPayload) => {
	return data;
};
