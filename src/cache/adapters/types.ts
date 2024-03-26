import type { Awaitable } from '../../common';

export interface Adapter {
	isAsync: boolean;

	scan(query: string, keys?: false): Awaitable<any[]>;
	scan(query: string, keys: true): Awaitable<string[]>;
	scan(query: string, keys?: boolean): Awaitable<(any | string)[]>;

	get(keys: string[]): Awaitable<any[]>;
	get(keys: string): Awaitable<any | null>;
	get(keys: string | string[]): Awaitable<any | null>;

	set(keyValue: [string, any][]): Awaitable<void>;
	set(id: string, data: any): Awaitable<void>;
	set(id: string | [string, any][], data?: any): Awaitable<void>;

	patch(updateOnly: boolean, keyValue: [string, any][]): Awaitable<void>;
	patch(updateOnly: boolean, id: string, data: any): Awaitable<void>;
	patch(updateOnly: boolean, id: string | [string, any][], data?: any): Awaitable<void>;

	values(to: string): Awaitable<any[]>;

	keys(to: string): Awaitable<string[]>;

	count(to: string): Awaitable<number>;

	remove(keys: string | string[]): Awaitable<void>;

	contains(to: string, keys: string): Awaitable<boolean>;

	getToRelationship(to: string): Awaitable<string[]>;

	bulkAddToRelationShip(data: Record<string, string[]>): Awaitable<void>;

	addToRelationship(to: string, keys: string | string[]): Awaitable<void>;

	removeToRelationship(to: string, keys: string | string[]): Awaitable<void>;

	removeRelationship(to: string | string[]): Awaitable<void>;
}
