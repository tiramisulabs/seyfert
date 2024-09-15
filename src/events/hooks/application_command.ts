import type { UsingClient } from '../../commands';
import { toCamelCase } from '../../common';
import type { GatewayApplicationCommandPermissionsUpdateDispatchData } from '../../types';

export const APPLICATION_COMMAND_PERMISSIONS_UPDATE = (
	_self: UsingClient,
	data: GatewayApplicationCommandPermissionsUpdateDispatchData,
) => {
	return toCamelCase(data);
};
