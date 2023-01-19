/**
 * refactor
 */
import type { CacheAdapter } from '../scheme/adapters/cache-adapter';
import type { DiscordChannel } from '@biscuitland/api-types';
import { BaseResource } from './base-resource';
/**
 * Resource represented by an channel of discord
 */
export declare class ChannelResource extends BaseResource<DiscordChannel> {
    #private;
    constructor(adapter: CacheAdapter, entity?: DiscordChannel | null);
    /**
     * @inheritDoc
     */
    get(id: string): Promise<ChannelResource | null>;
    /**
     * @inheritDoc
     */
    set(id: string, data: any): Promise<void>;
    /**
     * @inheritDoc
     */
    items(): Promise<ChannelResource[]>;
    /**
     * @inheritDoc
     */
    count(): Promise<number>;
    /**
     * @inheritDoc
     */
    remove(id: string): Promise<void>;
    /**
     * @inheritDoc
     */
    contains(id: string): Promise<boolean>;
    /**
     * @inheritDoc
     */
    getToRelationship(): Promise<string[]>;
    /**
     * @inheritDoc
     */
    addToRelationship(id: string): Promise<void>;
    /**
     * @inheritDoc
     */
    removeToRelationship(id: string): Promise<void>;
}
