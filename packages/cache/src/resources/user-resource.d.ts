/**
 * refactor
 */
import type { CacheAdapter } from '../scheme/adapters/cache-adapter';
import type { DiscordUser } from '@biscuitland/api-types';
import { BaseResource } from './base-resource';
/**
 * Resource represented by an user of discord
 */
export declare class UserResource extends BaseResource<DiscordUser> {
    #private;
    constructor(adapter: CacheAdapter, entity?: DiscordUser | null);
    /**
     * @inheritDoc
     */
    get(id: string): Promise<UserResource | null>;
    /**
     * @inheritDoc
     */
    set(id: string, data: any): Promise<void>;
    /**
     * @inheritDoc
     */
    items(): Promise<UserResource[]>;
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
