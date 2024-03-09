import type { GatewayPresenceUpdate } from '../../common';
import { GuildRelatedResource } from './default/guild-related';

export class Presences extends GuildRelatedResource<PresenceResource> {
	namespace = 'presence';

	override parse(data: any, key: string, guild_id: string): PresenceResource {
		const { user, ...rest } = super.parse(data, key, guild_id);
		rest.user_id ??= key;

		return rest;
	}
}

export type PresenceResource = Omit<GatewayPresenceUpdate, 'user'> & { id: string };
