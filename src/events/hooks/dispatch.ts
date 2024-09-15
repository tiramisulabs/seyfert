import { Transformers } from '../../client/transformers';
import type { UsingClient } from '../../commands';
import type { GatewayDispatchPayload, GatewayReadyDispatchData, GatewayResumedDispatch } from '../../types';

export const READY = (self: UsingClient, data: GatewayReadyDispatchData) => {
	return Transformers.ClientUser(self, data.user, data.application);
};

export const RESUMED = (_self: UsingClient, _data: GatewayResumedDispatch['d']) => {
	return;
};

export const RAW = (_self: UsingClient, data: GatewayDispatchPayload) => {
	return data;
};
