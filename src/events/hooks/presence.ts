import type { GatewayPresenceUpdateDispatchData } from 'discord-api-types/v10';

import type { BaseClient } from '../../client/base';
import { toCamelCase } from '../../common';

export const PRESENCE_UPDATE = (_self: BaseClient, data: GatewayPresenceUpdateDispatchData) => {
	return toCamelCase(data);
};
