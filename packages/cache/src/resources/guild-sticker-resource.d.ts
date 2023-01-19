import type { CacheAdapter } from '../scheme/adapters/cache-adapter';
import type { DiscordSticker } from '@biscuitland/api-types';
import { BaseResource } from './base-resource';
/**
 * Resource represented by an sticker of discord
 */
export declare class GuildStickerResource extends BaseResource<DiscordSticker> {
    #private;
    constructor(adapter: CacheAdapter, entity?: DiscordSticker | null, parent?: string);
    /**
     * @inheritDoc
     */
    get(id: string, guild: string): Promise<GuildStickerResource | null>;
    /**
     * @inheritDoc
     */
    set(id: string, guild: string | undefined, data: any): Promise<void>;
    /**
     * @inheritDoc
     */
    items(to: string): Promise<GuildStickerResource[]>;
    /**
     * @inheritDoc
     */
    remove(id: string, guild?: string | undefined): Promise<void>;
    /**
     * @inheritDoc
     */
    protected hashGuildId(id: string, guild?: string): string;
}
