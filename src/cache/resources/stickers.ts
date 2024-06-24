import type { APISticker } from 'discord-api-types/v10';
import type { ReturnCache } from '../..';
import { fakePromise } from '../../common';
import { GuildRelatedResource } from './default/guild-related';
import { type StickerStructure, Transformers } from '../../client/transformers';

export class Stickers extends GuildRelatedResource<any, APISticker> {
	namespace = 'sticker';

	//@ts-expect-error
	filter(data: APISticker, id: string, guild_id?: string) {
		return true;
	}

	override get(id: string): ReturnCache<StickerStructure | undefined> {
		return fakePromise(super.get(id)).then(rawSticker =>
			rawSticker ? Transformers.Sticker(this.client, rawSticker) : undefined,
		);
	}

	override bulk(ids: string[]): ReturnCache<StickerStructure[]> {
		return fakePromise(super.bulk(ids) as APISticker[]).then(emojis =>
			emojis.map(rawSticker => Transformers.Sticker(this.client, rawSticker)),
		);
	}

	override values(guild: string): ReturnCache<StickerStructure[]> {
		return fakePromise(super.values(guild) as APISticker[]).then(emojis =>
			emojis.map(rawSticker => Transformers.Sticker(this.client, rawSticker)),
		);
	}
}
