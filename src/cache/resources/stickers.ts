import type { APISticker } from 'discord-api-types/v10';
import type { ReturnCache } from '../..';
import { fakePromise } from '../../common';
import { Sticker } from '../../structures';
import { GuildRelatedResource } from './default/guild-related';

export class Stickers extends GuildRelatedResource {
	namespace = 'sticker';

	override get(id: string): ReturnCache<Sticker | undefined> {
		return fakePromise(super.get(id)).then(rawSticker =>
			rawSticker ? new Sticker(this.client, rawSticker) : undefined,
		);
	}

	override bulk(ids: string[]): ReturnCache<Sticker[]> {
		return fakePromise(super.bulk(ids) as APISticker[]).then(emojis =>
			emojis.map(rawSticker => new Sticker(this.client, rawSticker)),
		);
	}

	override values(guild: string): ReturnCache<Sticker[]> {
		return fakePromise(super.values(guild) as APISticker[]).then(emojis =>
			emojis.map(rawSticker => new Sticker(this.client, rawSticker)),
		);
	}
}
