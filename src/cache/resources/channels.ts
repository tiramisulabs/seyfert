import type { APIChannel } from 'discord-api-types/v10';
import { fakePromise } from '../../common';
import type { AllChannels } from '../../structures';
import channelFrom from '../../structures/channels';
import type { ReturnCache } from '../index';
import { GuildRelatedResource } from './default/guild-related';

export class Channels extends GuildRelatedResource<any, APIChannel> {
	namespace = 'channel';

	parse(data: APIChannel, id: string, guild_id: string) {
		const { permission_overwrites, ...rest } = super.parse(data, id, guild_id);
		return rest;
	}

	raw(id: string): ReturnCache<APIChannel | undefined> {
		return super.get(id);
	}

	override get(id: string): ReturnCache<AllChannels | undefined> {
		return fakePromise(super.get(id)).then(rawChannel =>
			rawChannel ? channelFrom(rawChannel, this.client) : undefined,
		);
	}

	override bulk(ids: string[]): ReturnCache<ReturnType<typeof channelFrom>[]> {
		return fakePromise(super.bulk(ids)).then(channels =>
			channels.map(rawChannel => channelFrom(rawChannel, this.client)),
		);
	}

	override values(guild: string): ReturnCache<ReturnType<typeof channelFrom>[]> {
		return fakePromise(super.values(guild)).then(channels =>
			channels.map(rawChannel => channelFrom(rawChannel, this.client)),
		);
	}
}
