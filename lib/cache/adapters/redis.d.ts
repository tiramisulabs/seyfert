import type { RedisOptions } from 'ioredis';
import type { Adapter } from './types';
interface RedisAdapterOptions {
    namespace?: string;
}
export declare class RedisAdapter implements Adapter {
    isAsync: boolean;
    client: import('ioredis').Redis;
    namespace: string;
    constructor(data: ({
        client: import('ioredis').Redis;
    } | {
        redisOptions: RedisOptions;
    }) & RedisAdapterOptions);
    private __scanSets;
    scan(query: string, returnKeys?: false): Promise<any[]>;
    scan(query: string, returnKeys: true): Promise<string[]>;
    bulkGet(keys: string[]): Promise<(Record<string, any> | Record<string, any>[] | undefined)[]>;
    get(keys: string): Promise<any>;
    bulkSet(data: [string, any][]): Promise<void>;
    set(id: string, data: any): Promise<void>;
    bulkPatch(updateOnly: boolean, data: [string, any][]): Promise<void>;
    patch(updateOnly: boolean, id: string, data: any): Promise<void>;
    values(to: string): Promise<any[]>;
    keys(to: string): Promise<string[]>;
    count(to: string): Promise<number>;
    bulkRemove(keys: string[]): Promise<void>;
    remove(keys: string): Promise<void>;
    flush(): Promise<void>;
    contains(to: string, keys: string): Promise<boolean>;
    getToRelationship(to: string): Promise<string[]>;
    bulkAddToRelationShip(data: Record<string, string[]>): Promise<void>;
    addToRelationship(to: string, keys: string | string[]): Promise<void>;
    removeToRelationship(to: string, keys: string | string[]): Promise<void>;
    removeRelationship(to: string | string[]): Promise<void>;
    protected buildKey(key: string): string;
}
export {};
