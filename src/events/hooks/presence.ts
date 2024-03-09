import type { GatewayPresenceUpdateDispatchData } from '../../common';

import type { BaseClient } from '../../client/base';
import { toCamelCase } from '../../common';

export const PRESENCE_UPDATE = (_self: BaseClient, data: GatewayPresenceUpdateDispatchData) => {
	return toCamelCase(data);
};
