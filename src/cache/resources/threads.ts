import type { APIThreadChannel } from 'discord-api-types/v10';
import type { ReturnCache } from '../..';
import { fakePromise } from '../../common';
import { ThreadChannel } from '../../structures';
import { GuildRelatedResource } from './default/guild-related';

export class Threads extends GuildRelatedResource {
	namespace = 'thread';

	//@ts-expect-error
	filter(data: APIThreadChannel, id: string, guild_id?: string) {
		return true;
	}

	override get(id: string): ReturnCache<ThreadChannel | undefined> {
		return fakePromise(super.get(id)).then(rawThread =>
			rawThread ? new ThreadChannel(this.client, rawThread) : undefined,
		);
	}

	override bulk(ids: string[]): ReturnCache<ThreadChannel[]> {
		return fakePromise(super.bulk(ids) as APIThreadChannel[]).then(threads =>
			threads.map(rawThread => new ThreadChannel(this.client, rawThread)),
		);
	}

	override values(guild: string): ReturnCache<ThreadChannel[]> {
		return fakePromise(super.values(guild) as APIThreadChannel[]).then(threads =>
			threads.map(rawThread => new ThreadChannel(this.client, rawThread)),
		);
	}
}
