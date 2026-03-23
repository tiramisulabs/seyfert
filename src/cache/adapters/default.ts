import type { Adapter } from './types';

export interface MemoryAdapterOptions<T> {
	encode(data: any): T;
	decode(data: T): unknown;
}

export class MemoryAdapter<T> implements Adapter {
	isAsync = false;

	readonly storage = new Map<string, T>();
	readonly relationships = new Map<string, Set<string>>();

	constructor(
		public options: MemoryAdapterOptions<T> = {
			encode(data) {
				return data;
			},
			decode(data) {
				return data;
			},
		},
	) {}

	start() {
		//
	}

	scan(query: string, keys?: false): any[];
	scan(query: string, keys: true): string[];
	scan(query: string, keys = false) {
		const values: (string | unknown)[] = [];
		const sq = query.split('.');
		for (const [key, value] of this.storage.entries()) {
			const keySplit = key.split('.');
			if (
				keySplit.length === sq.length &&
				keySplit.every((segment, i) => (sq[i] === '*' ? !!segment : sq[i] === segment))
			) {
				values.push(keys ? key : this.options.decode(value));
			}
		}

		return values;
	}

	bulkGet(keys: string[]) {
		const result: unknown[] = [];
		for (const key of keys) {
			const data = this.storage.get(key);
			if (data !== undefined) result.push(this.options.decode(data));
		}
		return result;
	}

	get(keys: string) {
		const data = this.storage.get(keys);
		return data ? this.options.decode(data) : null;
	}

	bulkSet(keys: [string, any][]) {
		for (const [key, value] of keys) {
			this.storage.set(key, this.options.encode(value));
		}
	}

	set(key: string, data: any) {
		this.storage.set(key, this.options.encode(data));
	}

	bulkPatch(keys: [string, any][]) {
		for (const [key, value] of keys) {
			const oldData = this.get(key);
			this.storage.set(
				key,
				Array.isArray(value) ? this.options.encode(value) : this.options.encode({ ...(oldData ?? {}), ...value }),
			);
		}
	}

	patch(keys: string, data: any) {
		const oldData = this.get(keys);
		this.storage.set(
			keys,
			Array.isArray(data) ? this.options.encode(data) : this.options.encode({ ...(oldData ?? {}), ...data }),
		);
	}

	values(to: string) {
		const array: any[] = [];
		const data = this.keys(to);

		for (const key of data) {
			const content = this.get(key);

			if (content) {
				array.push(content);
			}
		}

		return array;
	}

	keys(to: string) {
		return this.getToRelationship(to).map(id => `${to}.${id}`);
	}

	count(to: string) {
		return this.relationships.get(to)?.size ?? 0;
	}

	bulkRemove(keys: string[]) {
		for (const i of keys) {
			this.storage.delete(i);
		}
	}

	remove(key: string) {
		this.storage.delete(key);
	}

	flush(): void {
		this.storage.clear();
		this.relationships.clear();
	}

	contains(to: string, keys: string): boolean {
		return this.relationships.get(to)?.has(keys) ?? false;
	}

	getToRelationship(to: string): string[] {
		return [...(this.relationships.get(to) ?? [])];
	}

	bulkAddToRelationShip(data: Record<string, string[]>) {
		for (const i in data) {
			this.addToRelationship(i, data[i]);
		}
	}

	addToRelationship(to: string, keys: string | string[]) {
		if (!this.relationships.has(to)) {
			this.relationships.set(to, new Set());
		}

		const data = this.relationships.get(to)!;

		for (const key of Array.isArray(keys) ? keys : [keys]) {
			data.add(key);
		}
	}

	removeToRelationship(to: string, keys: string | string[]) {
		const data = this.relationships.get(to);
		if (data) {
			for (const key of Array.isArray(keys) ? keys : [keys]) {
				data.delete(key);
			}
		}
	}

	removeRelationship(to: string | string[]) {
		for (const i of Array.isArray(to) ? to : [to]) {
			this.relationships.delete(i);
		}
	}
}
