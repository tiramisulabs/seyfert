import type { RESTGetAPIStickerResult, RESTGetNitroStickerPacksResult } from 'discord-api-types/v10';
import type { ProxyRequestMethod } from '../Router';
import type { RestArguments } from '../api';

export interface StickerRoutes {
	stickers(id: string): {
		get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIStickerResult>;
	};
	'sticker-packs': {
		get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetNitroStickerPacksResult>;
	};
}
