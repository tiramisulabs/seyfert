import type { APIThreadChannel } from 'discord-api-types/v10';
import type { ReturnCache } from '../..';
import { fakePromise } from '../../common';
import { GuildRelatedResource } from './default/guild-related';
import { type ThreadChannelStructure, Transformers } from '../../client/transformers';

export class Threads extends GuildRelatedResource<any, APIThreadChannel> {
	namespace = 'thread';

	//@ts-expect-error
	filter(data: APIThreadChannel, id: string, guild_id?: string) {
		return true;
	}

	override get(id: string): ReturnCache<ThreadChannelStructure | undefined> {
		return fakePromise(super.get(id)).then(rawThread =>
			rawThread ? Transformers.ThreadChannel(this.client, rawThread) : undefined,
		);
	}

	override bulk(ids: string[]): ReturnCache<ThreadChannelStructure[]> {
		return fakePromise(super.bulk(ids) as APIThreadChannel[]).then(threads =>
			threads.map(rawThread => Transformers.ThreadChannel(this.client, rawThread)),
		);
	}

	override values(guild: string): ReturnCache<ThreadChannelStructure[]> {
		return fakePromise(super.values(guild) as APIThreadChannel[]).then(threads =>
			threads.map(rawThread => Transformers.ThreadChannel(this.client, rawThread)),
		);
	}
}
