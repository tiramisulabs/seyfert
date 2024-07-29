import type { GatewayApplicationCommandPermissionsUpdateDispatchData } from '../../types';
import { toCamelCase } from '../../common';
import type { UsingClient } from '../../commands';

export const APPLICATION_COMMAND_PERMISSIONS_UPDATE = (
	_self: UsingClient,
	data: GatewayApplicationCommandPermissionsUpdateDispatchData,
) => {
	return toCamelCase(data);
};
