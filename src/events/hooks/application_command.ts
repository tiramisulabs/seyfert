import type { BaseClient } from '../../client/base';
import type { GatewayApplicationCommandPermissionsUpdateDispatchData } from '../../common';
import { toCamelCase } from '../../common';

export const APPLICATION_COMMAND_PERMISSIONS_UPDATE = (
	_self: BaseClient,
	data: GatewayApplicationCommandPermissionsUpdateDispatchData,
) => {
	return toCamelCase(data);
};
