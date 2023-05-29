import { RESTGetAPIStickerResult, RESTGetNitroStickerPacksResult } from '@biscuitland/common';
import { RestArguments } from '../REST';
import { RequestMethod } from '../Router';

export interface StickerRoutes {
  stickers(id: string): {
    get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIStickerResult>;
  };
  'sticker-packs': {
    get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetNitroStickerPacksResult>;
  };
}
