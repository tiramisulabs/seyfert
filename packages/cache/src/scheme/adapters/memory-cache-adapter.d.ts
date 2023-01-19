/**
 * refactor
 */
import type { CacheAdapter } from './cache-adapter';
import type { MemoryOptions, MO } from '../../types';
export declare class MemoryCacheAdapter implements CacheAdapter {
    static readonly DEFAULTS: {
        expire: number;
    };
    readonly relationships: Map<string, string[]>;
    readonly storage: Map<string, {
        data: any;
        expire?: number | undefined;
    }>;
    readonly options: MO;
    constructor(options?: MemoryOptions);
    /**
     * @inheritDoc
     */
    get<T = any>(id: string): T | null;
    /**
     * @inheritDoc
     */
    set(id: string, data: any): void;
    /**
     * @inheritDoc
     */
    items(to: string): any[];
    /**
     * @inheritDoc
     */
    count(to: string): number;
    /**
     * @inheritDoc
     */
    remove(id: string): void;
    /**
     * @inheritDoc
     */
    contains(to: string, id: string): boolean;
    /**
     * @inheritDoc
     */
    getToRelationship(to: string): string[];
    /**
     * @inheritDoc
     */
    addToRelationship(to: string, id: string): void;
    /**
     * @inheritDoc
     */
    removeToRelationship(to: string, id: string): void;
}
