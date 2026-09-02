import type { Awaitable } from '../../common';

export type AdapterRelationship = readonly [to: string, id: string];
/**
 * A cache value and the relationship that owns it.
 * Keys must use `resource.id` or `resource.scope.id`; IDs and namespace segments cannot contain dots.
 * Each resource namespace must consistently use one of those layouts.
 * Adapters assume these preconditions and do not validate them at runtime.
 */
export type AdapterEntry = readonly [key: string, value: any, relationship: AdapterRelationship];

export interface Adapter {
	isAsync: boolean;

	start(): Awaitable<void>;

	scan(query: string, keys?: false): Awaitable<any[]>;
	scan(query: string, keys: true): Awaitable<string[]>;
	scan(query: string, keys?: boolean): Awaitable<(any | string)[]>;

	bulkGet(keys: string[]): Awaitable<any[]>;
	get(keys: string): Awaitable<any | null>;

	/** Stores each value and relationship as one atomic operation. Earlier entries may remain if a later entry fails. */
	bulkSet(entries: AdapterEntry[]): Awaitable<void>;
	/** Stores the value and relationship as one atomic operation. */
	set(key: string, value: any, relationship: AdapterRelationship): Awaitable<void>;

	/** Patches each value and stores its relationship atomically. Earlier entries may remain if a later entry fails. */
	bulkPatch(entries: AdapterEntry[]): Awaitable<void>;
	/** Patches the value and stores its relationship as one atomic operation. */
	patch(key: string, value: any, relationship: AdapterRelationship): Awaitable<void>;

	values(to: string): Awaitable<any[]>;

	keys(to: string): Awaitable<string[]>;

	count(to: string): Awaitable<number>;

	/** Removes each value and its owning relationship. Earlier entries may remain if a later removal fails. */
	bulkRemove(keys: string[]): Awaitable<void>;
	/** Removes the value and its owning relationship as one logical operation. */
	remove(key: string): Awaitable<void>;

	flush(): Awaitable<void>;

	contains(to: string, keys: string): Awaitable<boolean>;

	getToRelationship(to: string): Awaitable<string[]>;

	/** Removes the selected values and relationships owned by `to`. */
	removeToRelationship(to: string, keys: string | string[]): Awaitable<void>;

	/** Removes every value and relationship owned by the supplied relationships. */
	removeRelationship(to: string | string[]): Awaitable<void>;
}
