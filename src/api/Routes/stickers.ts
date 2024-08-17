import type { RESTGetAPIStickerResult, RESTGetStickerPacksResult } from '../../types';
import type { ProxyRequestMethod } from '../Router';
import type { RestArguments } from '../api';

export interface StickerRoutes {
	stickers(id: string): {
		get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIStickerResult>;
	};
	'sticker-packs': {
		get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetStickerPacksResult>;
	};
}
