import type { CacheAdapter } from '../scheme/adapters/cache-adapter';
import type { DiscordEmoji } from '@biscuitland/api-types';
import { BaseResource } from './base-resource';
/**
 * Resource represented by an emoji of discord
 */
export declare class GuildEmojiResource extends BaseResource<DiscordEmoji> {
    #private;
    constructor(adapter: CacheAdapter, entity?: DiscordEmoji | null, parent?: string);
    /**
     * @inheritDoc
     */
    get(id: string, guild?: string | undefined): Promise<GuildEmojiResource | null>;
    /**
     * @inheritDoc
     */
    set(id: string, guild: string | undefined, data: any): Promise<void>;
    /**
     * @inheritDoc
     */
    items(to: string): Promise<GuildEmojiResource[]>;
    /**
     * @inheritDoc
     */
    remove(id: string, guild?: string | undefined): Promise<void>;
    /**
     * @inheritDoc
     */
    protected hashGuildId(id: string, guild?: string): string;
}
