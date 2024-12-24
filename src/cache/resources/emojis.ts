import type { CacheFrom, ReturnCache } from '../..';
import { type GuildEmojiStructure, Transformers } from '../../client/transformers';
import { fakePromise } from '../../common';
import type { APIEmoji } from '../../types';
import { GuildRelatedResource } from './default/guild-related';

export class Emojis extends GuildRelatedResource<any, APIEmoji> {
	namespace = 'emoji';

	//@ts-expect-error
	filter(data: APIEmoji, id: string, guild_id: string, from: CacheFrom) {
		return true;
	}

	override get(id: string): ReturnCache<GuildEmojiStructure | undefined> {
		return fakePromise(super.get(id)).then(rawEmoji =>
			rawEmoji ? Transformers.GuildEmoji(this.client, rawEmoji, rawEmoji.guild_id) : undefined,
		);
	}

	raw(id: string): ReturnCache<APIEmoji | undefined> {
		return super.get(id);
	}

	override bulk(ids: string[]): ReturnCache<GuildEmojiStructure[]> {
		return fakePromise(super.bulk(ids) as (APIEmoji & { id: string; guild_id: string })[]).then(emojis =>
			emojis.map(rawEmoji => Transformers.GuildEmoji(this.client, rawEmoji, rawEmoji.guild_id)),
		);
	}

	bulkRaw(ids: string[]): ReturnCache<(APIEmoji & { id: string; guild_id: string })[]> {
		return super.bulk(ids);
	}

	override values(guild: string): ReturnCache<GuildEmojiStructure[]> {
		return fakePromise(super.values(guild) as (APIEmoji & { id: string; guild_id: string })[]).then(emojis =>
			emojis.map(rawEmoji => Transformers.GuildEmoji(this.client, rawEmoji, rawEmoji.guild_id)),
		);
	}

	valuesRaw(guild: string): ReturnCache<(APIEmoji & { id: string; guild_id: string })[]> {
		return super.values(guild);
	}
}
