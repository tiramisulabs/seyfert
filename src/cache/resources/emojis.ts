import type { ApplicationEmojiStructure, CacheFrom, ReturnCache } from '../..';
import { type GuildEmojiStructure, Transformers } from '../../client/transformers';
import { fakePromise } from '../../common';
import type { APIApplicationEmoji, APIEmoji } from '../../types';
import { GuildRelatedResource } from './default/guild-related';

export class Emojis extends GuildRelatedResource<any, APIEmoji | APIApplicationEmoji> {
	namespace = 'emoji';

	//@ts-expect-error
	filter(data: APIEmoji, id: string, guild_id: string, from: CacheFrom) {
		return true;
	}

	override get(id: string): ReturnCache<GuildEmojiStructure | ApplicationEmojiStructure | undefined> {
		return fakePromise(super.get(id)).then(rawEmoji => {
			if (!rawEmoji) return undefined;
			if (rawEmoji.guild_id === this.client.applicationId) return Transformers.ApplicationEmoji(this.client, rawEmoji);
			return Transformers.GuildEmoji(this.client, rawEmoji, rawEmoji.guild_id);
		});
	}

	raw(id: string): ReturnCache<APIEmoji | undefined> {
		return super.get(id);
	}

	override bulk(ids: string[]): ReturnCache<(GuildEmojiStructure | ApplicationEmojiStructure)[]> {
		return fakePromise(super.bulk(ids) as (APIEmoji & { id: string; guild_id: string })[]).then(emojis =>
			emojis.map(rawEmoji => {
				if (rawEmoji.guild_id === this.client.applicationId)
					return Transformers.ApplicationEmoji(this.client, rawEmoji as APIApplicationEmoji);
				return Transformers.GuildEmoji(this.client, rawEmoji, rawEmoji.guild_id);
			}),
		);
	}

	bulkRaw(ids: string[]): ReturnCache<(APIEmoji & { id: string; guild_id: string })[]> {
		return super.bulk(ids);
	}

	override values(guild: string): ReturnCache<(GuildEmojiStructure | ApplicationEmojiStructure)[]> {
		return fakePromise(super.values(guild) as (APIEmoji & { id: string; guild_id: string })[]).then(emojis =>
			emojis.map(rawEmoji => {
				if (rawEmoji.guild_id === this.client.applicationId)
					return Transformers.ApplicationEmoji(this.client, rawEmoji as APIApplicationEmoji);
				return Transformers.GuildEmoji(this.client, rawEmoji, rawEmoji.guild_id);
			}),
		);
	}

	valuesRaw(
		guild: string,
	): ReturnCache<(((APIEmoji & { id: string }) | APIApplicationEmoji) & { guild_id: string })[]> {
		return super.values(guild);
	}
}
