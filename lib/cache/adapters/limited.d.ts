import { LimitedCollection } from '../..';
import { type MakeRequired } from '../../common';
import type { Adapter } from './types';
export interface ResourceLimitedMemoryAdapter {
    expire?: number;
    limit?: number;
}
export interface LimitedMemoryAdapterOptions {
    default?: ResourceLimitedMemoryAdapter;
    guild?: ResourceLimitedMemoryAdapter;
    user?: ResourceLimitedMemoryAdapter;
    ban?: ResourceLimitedMemoryAdapter;
    member?: ResourceLimitedMemoryAdapter;
    voice_state?: ResourceLimitedMemoryAdapter;
    channel?: ResourceLimitedMemoryAdapter;
    emoji?: ResourceLimitedMemoryAdapter;
    presence?: ResourceLimitedMemoryAdapter;
    role?: ResourceLimitedMemoryAdapter;
    stage_instance?: ResourceLimitedMemoryAdapter;
    sticker?: ResourceLimitedMemoryAdapter;
    thread?: ResourceLimitedMemoryAdapter;
    overwrite?: ResourceLimitedMemoryAdapter;
    message?: ResourceLimitedMemoryAdapter;
}
export declare class LimitedMemoryAdapter implements Adapter {
    isAsync: boolean;
    readonly storage: Map<string, LimitedCollection<string, string>>;
    readonly relationships: Map<string, Map<string, string[]>>;
    options: MakeRequired<LimitedMemoryAdapterOptions, 'default'>;
    constructor(options: LimitedMemoryAdapterOptions);
    scan(query: string, keys?: false): any[];
    scan(query: string, keys: true): string[];
    bulkGet(keys: string[]): any[];
    get(keys: string): any;
    private __set;
    bulkSet(keys: [string, any][]): void;
    set(keys: string, data: any): void;
    bulkPatch(updateOnly: boolean, keys: [string, any][]): void;
    patch(updateOnly: boolean, keys: string, data: any): void;
    values(to: string): any[];
    keys(to: string): string[];
    count(to: string): number;
    bulkRemove(keys: string[]): void;
    remove(key: string): void;
    flush(): void;
    contains(to: string, keys: string): boolean;
    getToRelationship(to: string): string[];
    bulkAddToRelationShip(data: Record<string, string[]>): void;
    addToRelationship(to: string, keys: string | string[]): void;
    removeToRelationship(to: string, keys: string | string[]): void;
    removeRelationship(to: string | string[]): void;
}
