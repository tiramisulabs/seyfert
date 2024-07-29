import type { GatewayInviteCreateDispatchData, GatewayInviteDeleteDispatchData } from '../../types';
import type { UsingClient } from '../../commands';
import { toCamelCase } from '../../common';

export const INVITE_CREATE = (_self: UsingClient, data: GatewayInviteCreateDispatchData) => {
	return toCamelCase(data);
};

export const INVITE_DELETE = (_self: UsingClient, data: GatewayInviteDeleteDispatchData) => {
	return toCamelCase(data);
};
