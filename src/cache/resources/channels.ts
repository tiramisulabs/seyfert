import { fakePromise } from '../../common';
import { type AllChannels, channelFrom } from '../../structures';
import type { APIChannel } from '../../types';
import type { CacheFrom, ReturnCache } from '../index';
import { GuildRelatedResource } from './default/guild-related';

export class Channels extends GuildRelatedResource<any, APIChannel> {
	namespace = 'channel';

	//@ts-expect-error
	filter(data: APIChannel, id: string, guild_id: string, from: CacheFrom) {
		return true;
	}

	parse(data: APIChannel, id: string, guild_id: string) {
		const { permission_overwrites, ...rest } = super.parse(data, id, guild_id);
		return rest;
	}

	override get(id: string): ReturnCache<AllChannels | undefined> {
		return fakePromise(super.get(id)).then(rawChannel =>
			rawChannel ? channelFrom(rawChannel, this.client) : undefined,
		);
	}

	raw(id: string): ReturnCache<Omit<APIChannel, 'permission_overwrites'> | undefined> {
		return super.get(id);
	}

	override bulk(ids: string[]): ReturnCache<ReturnType<typeof channelFrom>[]> {
		return fakePromise(super.bulk(ids)).then(channels =>
			channels.map(rawChannel => channelFrom(rawChannel, this.client)),
		);
	}

	bulkRaw(ids: string[]): ReturnCache<Omit<APIChannel, 'permission_overwrites'>[]> {
		return super.bulk(ids);
	}

	override values(guild: string): ReturnCache<ReturnType<typeof channelFrom>[]> {
		return fakePromise(super.values(guild)).then(channels =>
			channels.map(rawChannel => channelFrom(rawChannel, this.client)),
		);
	}

	valuesRaw(guild: string): ReturnCache<Omit<APIChannel, 'permission_overwrites'>[]> {
		return super.values(guild);
	}
}
