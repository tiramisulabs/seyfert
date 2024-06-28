import type { APISticker } from 'discord-api-types/v10';
import type { ReturnCache } from '../..';
import { GuildRelatedResource } from './default/guild-related';
import { type StickerStructure } from '../../client/transformers';
export declare class Stickers extends GuildRelatedResource<any, APISticker> {
    namespace: string;
    filter(data: APISticker, id: string, guild_id?: string): boolean;
    get(id: string): ReturnCache<StickerStructure | undefined>;
    bulk(ids: string[]): ReturnCache<StickerStructure[]>;
    values(guild: string): ReturnCache<StickerStructure[]>;
}
