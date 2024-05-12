import type { GatewayPresenceUpdateDispatchData } from 'discord-api-types/v10';

import type { BaseClient } from '../../client/base';
import { toCamelCase } from '../../common';

export const PRESENCE_UPDATE = async (self: BaseClient, data: GatewayPresenceUpdateDispatchData) => {
	return [toCamelCase(data), await self.cache.presences?.get(data.user.id)];
};
