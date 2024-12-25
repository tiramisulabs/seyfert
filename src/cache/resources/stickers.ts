import type { CacheFrom, ReturnCache } from '../..';
import { type StickerStructure, Transformers } from '../../client/transformers';
import { fakePromise } from '../../common';
import type { APISticker } from '../../types';
import { GuildRelatedResource } from './default/guild-related';

export class Stickers extends GuildRelatedResource<any, APISticker> {
	namespace = 'sticker';

	//@ts-expect-error
	filter(data: APISticker, id: string, guild_id: string, from: CacheFrom) {
		return true;
	}

	override get(id: string): ReturnCache<StickerStructure | undefined> {
		return fakePromise(super.get(id)).then(rawSticker =>
			rawSticker ? Transformers.Sticker(this.client, rawSticker) : undefined,
		);
	}

	raw(id: string): ReturnCache<APISticker | undefined> {
		return super.get(id);
	}

	override bulk(ids: string[]): ReturnCache<StickerStructure[]> {
		return fakePromise(super.bulk(ids) as APISticker[]).then(emojis =>
			emojis.map(rawSticker => Transformers.Sticker(this.client, rawSticker)),
		);
	}

	bulkRaw(ids: string[]): ReturnCache<APISticker[]> {
		return super.bulk(ids);
	}

	override values(guild: string): ReturnCache<StickerStructure[]> {
		return fakePromise(super.values(guild) as APISticker[]).then(emojis =>
			emojis.map(rawSticker => Transformers.Sticker(this.client, rawSticker)),
		);
	}

	valuesRaw(guild: string): ReturnCache<APISticker[]> {
		return super.values(guild);
	}
}
