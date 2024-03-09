export interface Adapter {
	scan(query: string, keys?: false): RPV<any[]>;
	scan(query: string, keys: true): RPV<string[]>;
	scan(query: string, keys?: boolean): RPV<(any | string)[]>;

	get(keys: string[]): RPV<any[]>;
	get(keys: string): RPV<any | null>;
	get(keys: string | string[]): RPV<any | null>;

	set(keyValue: [string, any][]): RPV<void>;
	set(id: string, data: any): RPV<void>;
	set(id: string | [string, any][], data?: any): RPV<void>;

	patch(updateOnly: boolean, keyValue: [string, any][]): RPV<void>;
	patch(updateOnly: boolean, id: string, data: any): RPV<void>;
	patch(updateOnly: boolean, id: string | [string, any][], data?: any): RPV<void>;

	values(to: string): RPV<any[]>;

	keys(to: string): RPV<string[]>;

	count(to: string): RPV<number>;

	remove(keys: string | string[]): RPV<void>;

	contains(to: string, keys: string): RPV<boolean>;

	getToRelationship(to: string): RPV<string[]>;

	bulkAddToRelationShip(data: Record<string, string[]>): RPV<void>;

	addToRelationship(to: string, keys: string | string[]): RPV<void>;

	removeToRelationship(to: string, keys: string | string[]): RPV<void>;

	removeRelationship(to: string | string[]): RPV<void>;
}

export type RPV<V> = Promise<V> | V;
