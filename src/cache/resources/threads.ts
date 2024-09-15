import type { ReturnCache } from '../..';
import { type ThreadChannelStructure, Transformers } from '../../client/transformers';
import { fakePromise } from '../../common';
import type { APIThreadChannel } from '../../types';
import { GuildRelatedResource } from './default/guild-related';

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

	raw(id: string): ReturnCache<APIThreadChannel | undefined> {
		return super.get(id);
	}

	override bulk(ids: string[]): ReturnCache<ThreadChannelStructure[]> {
		return fakePromise(super.bulk(ids) as APIThreadChannel[]).then(threads =>
			threads.map(rawThread => Transformers.ThreadChannel(this.client, rawThread)),
		);
	}

	bulkRaw(ids: string[]): ReturnCache<APIThreadChannel[]> {
		return super.bulk(ids);
	}

	override values(guild: string): ReturnCache<ThreadChannelStructure[]> {
		return fakePromise(super.values(guild) as APIThreadChannel[]).then(threads =>
			threads.map(rawThread => Transformers.ThreadChannel(this.client, rawThread)),
		);
	}

	valuesRaw(guild: string): ReturnCache<APIThreadChannel[]> {
		return super.values(guild);
	}
}
