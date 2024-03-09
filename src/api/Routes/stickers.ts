import type { RESTGetAPIStickerResult, RESTGetNitroStickerPacksResult } from '../../common';
import type { RestArguments } from '../api';
import type { ProxyRequestMethod } from '../Router';

export interface StickerRoutes {
	stickers(id: string): {
		get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIStickerResult>;
	};
	'sticker-packs': {
		get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetNitroStickerPacksResult>;
	};
}
