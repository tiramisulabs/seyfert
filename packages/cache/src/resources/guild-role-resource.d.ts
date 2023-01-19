import type { CacheAdapter } from '../scheme/adapters/cache-adapter';
import type { DiscordRole } from '@biscuitland/api-types';
import { BaseResource } from './base-resource';
/**
 * Resource represented by an role of discord
 */
export declare class GuildRoleResource extends BaseResource<DiscordRole> {
    #private;
    constructor(adapter: CacheAdapter, entity?: DiscordRole | null, parent?: string);
    /**
     * @inheritDoc
     */
    get(id: string, guild?: string | undefined): Promise<GuildRoleResource | null>;
    /**
     * @inheritDoc
     */
    set(id: string, guild: string | undefined, data: any): Promise<void>;
    /**
     * @inheritDoc
     */
    count(): Promise<number>;
    /**
     * @inheritDoc
     */
    items(to: string): Promise<GuildRoleResource[]>;
    /**
     * @inheritDoc
     */
    remove(id: string, guild?: string | undefined): Promise<void>;
    /**
     * @inheritDoc
     */
    protected hashGuildId(id: string, guild?: string): string;
}
