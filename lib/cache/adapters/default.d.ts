import type { Adapter } from './types';
export declare class MemoryAdapter implements Adapter {
    isAsync: boolean;
    readonly storage: Map<string, string>;
    readonly relationships: Map<string, string[]>;
    scan(query: string, keys?: false): any[];
    scan(query: string, keys: true): string[];
    bulkGet(keys: string[]): any[];
    get(keys: string): any;
    bulkSet(keys: [string, any][]): void;
    set(key: string, data: any): void;
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
