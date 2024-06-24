import type { GatewayPresenceUpdate } from 'discord-api-types/v10';
import { GuildRelatedResource } from './default/guild-related';

export class Presences extends GuildRelatedResource<PresenceResource, GatewayPresenceUpdate> {
	namespace = 'presence';

	//@ts-expect-error
	filter(data: GatewayPresenceUpdate, id: string, guild_id?: string) {
		return true;
	}

	override parse(data: any, key: string, guild_id: string): PresenceResource {
		const { user, ...rest } = super.parse(data, key, guild_id);
		rest.user_id ??= key;

		return rest;
	}
}

export type PresenceResource = Omit<GatewayPresenceUpdate, 'user'> & { id: string; user_id: string };
