import type { GatewayIntentBits } from 'discord-api-types/v10';
import type { UsingClient } from '../../../commands';
import type { Cache, ReturnCache } from '../../index';
export declare class BaseResource<T = any, S = any> {
    protected cache: Cache;
    client: UsingClient;
    namespace: string;
    constructor(cache: Cache, client?: UsingClient);
    filter(data: any, id: string): boolean;
    get adapter(): import("../../index").Adapter;
    removeIfNI(intent: keyof typeof GatewayIntentBits, id: string): import("../../../common").Awaitable<void>;
    setIfNI(intent: keyof typeof GatewayIntentBits, id: string, data: S): import("../../../common").Awaitable<void>;
    get(id: string): ReturnCache<T | undefined>;
    bulk(ids: string[]): ReturnCache<T[]>;
    set(id: string, data: S): import("../../../common").Awaitable<void>;
    patch(id: string, data: S): import("../../../common").Awaitable<void>;
    remove(id: string): import("../../../common").Awaitable<void>;
    keys(): ReturnCache<string[]>;
    values(): ReturnCache<T[]>;
    count(): ReturnCache<number>;
    contains(id: string): ReturnCache<boolean>;
    getToRelationship(): import("../../../common").Awaitable<string[]>;
    addToRelationship(id: string | string[]): import("../../../common").Awaitable<void>;
    removeToRelationship(id: string | string[]): import("../../../common").Awaitable<void>;
    hashId(id: string): string;
}
