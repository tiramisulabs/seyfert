import type { APIEmoji } from 'discord-api-types/v10';
import type { ReturnCache } from '../..';
import { fakePromise } from '../../common';
import { GuildRelatedResource } from './default/guild-related';
import { type GuildEmojiStructure, Transformers } from '../../client/transformers';

export class Emojis extends GuildRelatedResource<any, APIEmoji> {
	namespace = 'emoji';

	//@ts-expect-error
	filter(data: APIEmoji, id: string, guild_id?: string) {
		return true;
	}

	override get(id: string): ReturnCache<GuildEmojiStructure | undefined> {
		return fakePromise(super.get(id)).then(rawEmoji =>
			rawEmoji ? Transformers.GuildEmoji(this.client, rawEmoji, rawEmoji.guild_id) : undefined,
		);
	}

	override bulk(ids: string[]): ReturnCache<GuildEmojiStructure[]> {
		return fakePromise(super.bulk(ids) as (APIEmoji & { id: string; guild_id: string })[]).then(emojis =>
			emojis.map(rawEmoji => Transformers.GuildEmoji(this.client, rawEmoji, rawEmoji.guild_id)),
		);
	}

	override values(guild: string): ReturnCache<GuildEmojiStructure[]> {
		return fakePromise(super.values(guild) as (APIEmoji & { id: string; guild_id: string })[]).then(emojis =>
			emojis.map(rawEmoji => Transformers.GuildEmoji(this.client, rawEmoji, rawEmoji.guild_id)),
		);
	}
}
