/**
 * refactor
 */
import type { CacheAdapter } from '../scheme/adapters/cache-adapter';
import type { DiscordPresenceUpdate } from '@biscuitland/api-types';
import { BaseResource } from './base-resource';
/**
 * Resource represented by an presence of discord
 */
export declare class PresenceResource extends BaseResource<DiscordPresenceUpdate> {
    #private;
    constructor(adapter: CacheAdapter, entity?: DiscordPresenceUpdate | null);
    /**
     * @inheritDoc
     */
    get(id: string): Promise<PresenceResource | null>;
    /**
     * @inheritDoc
     */
    set(id: string, data: any): Promise<void>;
    /**
     * @inheritDoc
     */
    items(): Promise<PresenceResource[]>;
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
