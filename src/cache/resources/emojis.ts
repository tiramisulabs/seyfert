import type { ReturnCache } from '../..';
import { fakePromise, type APIEmoji } from '../../common';
import { GuildEmoji } from '../../structures';
import { GuildRelatedResource } from './default/guild-related';

export class Emojis extends GuildRelatedResource {
	namespace = 'emoji';

	override get(id: string): ReturnCache<GuildEmoji | undefined> {
		return fakePromise(super.get(id)).then(rawEmoji =>
			rawEmoji ? new GuildEmoji(this.client, rawEmoji, rawEmoji.guild_id) : undefined,
		);
	}

	override bulk(ids: string[]): ReturnCache<GuildEmoji[]> {
		return fakePromise(super.bulk(ids) as (APIEmoji & { id: string; guild_id: string })[]).then(emojis =>
			emojis.map(rawEmoji => new GuildEmoji(this.client, rawEmoji, rawEmoji.guild_id)),
		);
	}

	override values(guild: string): ReturnCache<GuildEmoji[]> {
		return fakePromise(super.values(guild) as (APIEmoji & { id: string; guild_id: string })[]).then(emojis =>
			emojis.map(rawEmoji => new GuildEmoji(this.client, rawEmoji, rawEmoji.guild_id)),
		);
	}
}
