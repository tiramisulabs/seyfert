import type { UsingClient } from '../../commands';
import { toCamelCase } from '../../common';
import type { GatewayPresenceUpdateDispatchData } from '../../types';

export const PRESENCE_UPDATE = async (self: UsingClient, data: GatewayPresenceUpdateDispatchData) => {
	return [toCamelCase(data), await self.cache.presences?.get(data.user.id, data.guild_id)] as const;
};
