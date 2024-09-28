import type { RESTGetAPIStickerResult, RESTGetStickerPacksResult } from '../../types';
import type { RestArgumentsNoBody } from '../api';

export interface StickerRoutes {
	stickers(id: string): {
		get(args?: RestArgumentsNoBody): Promise<RESTGetAPIStickerResult>;
	};
	'sticker-packs': {
		get(args?: RestArgumentsNoBody): Promise<RESTGetStickerPacksResult>;
	};
}
