/**
 * refactor
 */
import type { CacheAdapter } from '../scheme/adapters/cache-adapter';
import type { DiscordVoiceState } from '@biscuitland/api-types';
import { BaseResource } from './base-resource';
/**
 * Resource represented by an voice state of discord
 */
export declare class GuildVoiceResource extends BaseResource<DiscordVoiceState> {
    #private;
    constructor(adapter: CacheAdapter, entity?: DiscordVoiceState | null, parent?: string);
    /**
     * @inheritDoc
     */
    get(id: string, guild?: string | undefined): Promise<GuildVoiceResource | null>;
    /**
     * @inheritDoc
     */
    set(id: string, guild: string | undefined, data: any): Promise<void>;
    /**
     * @inheritDoc
     */
    items(to: string): Promise<GuildVoiceResource[]>;
    /**
     * @inheritDoc
     */
    remove(id: string, guild?: string | undefined): Promise<void>;
    /**
     * @inheritDoc
     */
    protected hashGuildId(id: string, guild?: string): string;
}
