import type { GatewayInviteCreateDispatchData, GatewayInviteDeleteDispatchData } from '../../common';

import type { BaseClient } from '../../client/base';
import { toCamelCase } from '../../common';

export const INVITE_CREATE = (_self: BaseClient, data: GatewayInviteCreateDispatchData) => {
	return toCamelCase(data);
};

export const INVITE_DELETE = (_self: BaseClient, data: GatewayInviteDeleteDispatchData) => {
	return toCamelCase(data);
};
