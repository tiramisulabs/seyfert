import type { Awaitable } from '../../common';

export interface Adapter {
	isAsync: boolean;

	scan(query: string, keys?: false): Awaitable<any[]>;
	scan(query: string, keys: true): Awaitable<string[]>;
	scan(query: string, keys?: boolean): Awaitable<(any | string)[]>;

	bulkGet(keys: string[]): Awaitable<any[]>;
	get(keys: string): Awaitable<any | null>;

	bulkSet(keyValue: [string, any][]): Awaitable<void>;
	set(id: string, data: any): Awaitable<void>;

	bulkPatch(updateOnly: boolean, keyValue: [string, any][]): Awaitable<void>;
	patch(updateOnly: boolean, id: string, data: any): Awaitable<void>;

	values(to: string): Awaitable<any[]>;

	keys(to: string): Awaitable<string[]>;

	count(to: string): Awaitable<number>;

	bulkRemove(keys: string[]): Awaitable<void>;
	remove(keys: string): Awaitable<void>;

	flush(): Awaitable<void>;

	contains(to: string, keys: string): Awaitable<boolean>;

	getToRelationship(to: string): Awaitable<string[]>;

	bulkAddToRelationShip(data: Record<string, string[]>): Awaitable<void>;

	addToRelationship(to: string, keys: string | string[]): Awaitable<void>;

	removeToRelationship(to: string, keys: string | string[]): Awaitable<void>;

	removeRelationship(to: string | string[]): Awaitable<void>;
}
