/**
 * refactor
 */
import type { CacheAdapter } from './cache-adapter';
import type { RedisOptions } from 'ioredis';
import type Redis from 'ioredis';
interface BaseOptions {
    namespace: string;
    expire?: number;
}
interface BuildOptions extends BaseOptions, RedisOptions {
}
interface ClientOptions extends BaseOptions {
    client: Redis;
}
declare type Options = BuildOptions | ClientOptions;
export declare class RedisCacheAdapter implements CacheAdapter {
    static readonly DEFAULTS: {
        namespace: string;
    };
    readonly options: Options;
    readonly client: Redis;
    constructor(options?: Options);
    /**
     * @inheritDoc
     */
    get(id: string): Promise<any>;
    /**
     * @inheritDoc
     */
    set(id: string, data: unknown): Promise<void>;
    /**
     * @inheritDoc
     */
    items(to: string): Promise<any[]>;
    /**
     * @inheritDoc
     */
    count(to: string): Promise<number>;
    /**
     * @inheritDoc
     */
    remove(id: string): Promise<void>;
    /**
     * @inheritDoc
     */
    contains(to: string, id: string): Promise<boolean>;
    /**
     * @inheritDoc
     */
    getToRelationship(to: string): Promise<string[]>;
    /**
     * @inheritDoc
     */
    addToRelationship(to: string, id: string): Promise<void>;
    /**
     * @inheritDoc
     */
    removeToRelationship(to: string, id: string): Promise<void>;
    /**
     * @inheritDoc
     */
    protected build(id: string): string;
}
export {};
