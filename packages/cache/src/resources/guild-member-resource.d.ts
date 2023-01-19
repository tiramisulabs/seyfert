import type { CacheAdapter } from '../scheme/adapters/cache-adapter';
import type { DiscordMember } from '@biscuitland/api-types';
import { BaseResource } from './base-resource';
/**
 * Resource represented by an member of discord
 */
export declare class GuildMemberResource extends BaseResource<DiscordMember> {
    #private;
    constructor(adapter: CacheAdapter, entity?: DiscordMember | null, parent?: string);
    /**
     * @inheritDoc
     */
    get(id: string, guild?: string | undefined): Promise<GuildMemberResource | null>;
    /**
     * @inheritDoc
     */
    set(id: string, guild: string | undefined, data: any): Promise<void>;
    /**
     * @inheritDoc
     */
    items(to: string): Promise<GuildMemberResource[]>;
    /**
     * @inheritDoc
     */
    remove(id: string, guild?: string | undefined): Promise<void>;
    /**
     * @inheritDoc
     */
    protected hashGuildId(id: string, guild?: string): string;
}
