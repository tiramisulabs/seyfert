import type { GatewayPresenceUpdateDispatchData } from 'discord-api-types/v10';
import type { UsingClient } from '../../commands';
import { toCamelCase } from '../../common';

export const PRESENCE_UPDATE = async (self: UsingClient, data: GatewayPresenceUpdateDispatchData) => {
	return [toCamelCase(data), await self.cache.presences?.get(data.user.id)] as const;
};
