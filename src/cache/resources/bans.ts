import type { APIBan } from 'discord-api-types/v10';
import type { ReturnCache } from '../..';
import { fakePromise } from '../../common';
import { GuildBasedResource } from './default/guild-based';
import { GuildBan } from '../../structures/GuildBan';
export class Bans extends GuildBasedResource {
	namespace = 'ban';

	//@ts-expect-error
	filter(data: APIBan, id: string, guild_id: string) {
		return true;
	}

	override parse(data: any, key: string, guild_id: string) {
		const { user, ...rest } = super.parse(data, data.user?.id ?? key, guild_id);
		return rest;
	}

	override get(id: string, guild: string): ReturnCache<GuildBan | undefined> {
		return fakePromise(super.get(id, guild)).then(rawBan =>
			rawBan ? new GuildBan(this.client, rawBan, guild) : undefined,
		);
	}

	override bulk(ids: string[], guild: string): ReturnCache<GuildBan[]> {
		return fakePromise(super.bulk(ids, guild)).then(
			bans =>
				bans
					.map(rawBan => {
						return rawBan ? new GuildBan(this.client, rawBan, guild) : undefined;
					})
					.filter(Boolean) as GuildBan[],
		);
	}

	override values(guild: string): ReturnCache<GuildBan[]> {
		return fakePromise(super.values(guild)).then(
			bans =>
				bans
					.map(rawBan => {
						return rawBan ? new GuildBan(this.client, rawBan, guild) : undefined;
					})
					.filter(Boolean) as GuildBan[],
		);
	}
}
