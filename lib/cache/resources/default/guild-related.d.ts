import type { GatewayIntentBits } from 'discord-api-types/v10';
import type { BaseClient } from '../../../client/base';
import type { UsingClient } from '../../../commands';
import type { Cache, ReturnCache } from '../../index';
export declare class GuildRelatedResource<T = any, S = any> {
    protected cache: Cache;
    client: BaseClient;
    namespace: string;
    constructor(cache: Cache, client?: UsingClient);
    filter(data: any, id: string, guild_id?: string): boolean;
    parse(data: any, id: string, guild_id: string): any;
    get adapter(): import("../../index").Adapter;
    removeIfNI(intent: keyof typeof GatewayIntentBits, id: string | string[], guildId: string): import("../../../common").Awaitable<void>;
    setIfNI(intent: keyof typeof GatewayIntentBits, id: string, guildId: string, data: S): void;
    get(id: string): ReturnCache<(T & {
        guild_id: string;
    }) | undefined>;
    bulk(ids: string[]): ReturnCache<(T & {
        guild_id: string;
    })[]>;
    set(__keys: string, guild: string, data: S): ReturnCache<void>;
    set(__keys: [string, S][], guild: string): ReturnCache<void>;
    patch(__keys: string, guild?: string, data?: any): ReturnCache<void>;
    patch(__keys: [string, any][], guild?: string): ReturnCache<void>;
    remove(id: string | string[], guild: string): import("../../../common").Awaitable<void>;
    keys(guild: string): ReturnCache<string[]>;
    values(guild: string): ReturnCache<(T & {
        guild_id: string;
    })[]>;
    count(to: string): ReturnCache<number>;
    contains(id: string, guild: string): ReturnCache<boolean>;
    getToRelationship(guild: string): import("../../../common").Awaitable<string[]>;
    addToRelationship(id: string | string[], guild: string): import("../../../common").Awaitable<void>;
    removeToRelationship(id: string | string[], guild: string): import("../../../common").Awaitable<void>;
    removeRelationship(id: string | string[]): import("../../../common").Awaitable<void>;
    hashId(id: string): string;
}
