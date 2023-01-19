import type { CacheAdapter } from '../scheme/adapters/cache-adapter';
/**
 * Base class for all resources
 * All Methods from BaseResource are also available on every class extends
 */
declare class Base<T> {
    #private;
    /**
     * Guild linked and assigned to the current entity (resource)
     */
    parent?: string;
    /**
     * Constructor
     */
    constructor(namespace: string, adapter: CacheAdapter);
    /**
     * Entity linked
     */
    setEntity(entity: T): void;
    /**
     * Parent linked
     */
    setParent(parent: string): void;
    /**
     * Count how many resources there are in the relationships
     */
    count(to: string): Promise<number>;
    /**
     * Check if the resource is in the relationships
     */
    contains(id: string, guild?: string): Promise<boolean>;
    /**
     * Gets the resource relationships
     */
    getToRelationship(id?: string): Promise<string[]>;
    /**
     * Adds the resource to relationships
     */
    addToRelationship(id: string, guild?: string): Promise<void>;
    /**
     * Removes the relationship resource
     */
    removeToRelationship(id: string, guild?: string): Promise<void>;
    /**
     * Construct an id consisting of namespace.id
     */
    protected hashId(id: string): string;
}
export declare const BaseResource: new <T>(data: string, adapter: CacheAdapter) => Base<T> & T;
export {};
