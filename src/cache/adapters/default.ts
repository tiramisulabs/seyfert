import { needsCacheStorageIndex } from './shared';
import type { Adapter, AdapterEntry, AdapterRelationship } from './types';

export interface MemoryAdapterOptions<T> {
	encode(data: any): T;
	decode(data: T): unknown;
}

export class MemoryAdapter<T> implements Adapter {
	isAsync = false;

	readonly storage = new Map<string, Map<string, T>>();
	readonly keyToStorage = new Map<string, string>();

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
		for (const storageEntry of this.storage.values()) {
			for (const [key, value] of storageEntry) {
				const keySplit = key.split('.');
				if (
					keySplit.length === sq.length &&
					keySplit.every((segment, i) => (sq[i] === '*' ? !!segment : sq[i] === segment))
				) {
					values.push(keys ? key : this.options.decode(value));
				}
			}
		}

		return values;
	}

	bulkGet(keys: string[]) {
		const result: unknown[] = [];
		for (const key of keys) {
			const storageEntry = this._getStorageEntry(key);
			if (!storageEntry) continue;
			const data = storageEntry.get(key);
			if (data !== undefined || storageEntry.has(key)) result.push(this.options.decode(data!));
		}
		return result;
	}

	get(key: string) {
		const storageEntry = this._getStorageEntry(key);
		if (!storageEntry) return null;
		const data = storageEntry.get(key);
		if (data === undefined && !storageEntry.has(key)) return null;
		return this.options.decode(data!);
	}

	private _getStorageNamespace(key: string) {
		const indexed = this.keyToStorage.get(key);
		if (indexed !== undefined) return indexed;
		const resourceEnd = key.indexOf('.');
		if (resourceEnd === -1) return undefined;
		const idStart = key.lastIndexOf('.');
		return key.slice(0, resourceEnd === idStart ? resourceEnd : idStart);
	}

	private _getStorageEntry(key: string) {
		const namespace = this._getStorageNamespace(key);
		if (namespace === undefined) return undefined;
		const storageEntry = this.storage.get(namespace);
		if (!storageEntry && this.keyToStorage.get(key) === namespace) this.keyToStorage.delete(key);
		return storageEntry;
	}

	private _moveIndexedEntry(key: string, namespace: string) {
		const previousNamespace = this.keyToStorage.get(key);
		if (previousNamespace === undefined || previousNamespace === namespace) return;
		const previousStorage = this.storage.get(previousNamespace);
		previousStorage?.delete(key);
		if (previousStorage?.size === 0) this.storage.delete(previousNamespace);
	}

	private _set(key: string, value: any, relationship: AdapterRelationship, patch: boolean) {
		const data = patch && !Array.isArray(value) ? { ...(this.get(key) ?? {}), ...value } : value;
		const encoded = this.options.encode(data);
		const namespace = relationship[0];
		let storageEntry = this.storage.get(namespace);
		if (!storageEntry) {
			storageEntry = new Map();
			this.storage.set(namespace, storageEntry);
		}
		const indexed = needsCacheStorageIndex(key, namespace);
		if (indexed) this._moveIndexedEntry(key, namespace);
		storageEntry.set(key, encoded);
		if (indexed) this.keyToStorage.set(key, namespace);
	}

	set(key: string, value: any, relationship: AdapterRelationship) {
		this._set(key, value, relationship, false);
	}

	bulkSet(entries: AdapterEntry[]) {
		for (const [key, value, relationship] of entries) this._set(key, value, relationship, false);
	}

	patch(key: string, value: any, relationship: AdapterRelationship) {
		this._set(key, value, relationship, true);
	}

	bulkPatch(entries: AdapterEntry[]) {
		for (const [key, value, relationship] of entries) this._set(key, value, relationship, true);
	}

	values(to: string) {
		const storageEntry = this.storage.get(to);
		if (!storageEntry) return [];
		const values: any[] = [];
		for (const value of storageEntry.values()) values.push(this.options.decode(value));
		return values;
	}

	keys(to: string) {
		return [...(this.storage.get(to)?.keys() ?? [])];
	}

	count(to: string) {
		return this.storage.get(to)?.size ?? 0;
	}

	bulkRemove(keys: string[]) {
		for (const key of keys) this.remove(key);
	}

	remove(key: string) {
		const namespace = this._getStorageNamespace(key);
		if (namespace === undefined) return;
		const storageEntry = this.storage.get(namespace);
		storageEntry?.delete(key);
		this.keyToStorage.delete(key);
		if (storageEntry?.size === 0) this.storage.delete(namespace);
	}

	flush(): void {
		this.storage.clear();
		this.keyToStorage.clear();
	}

	private _getRelationshipKey(to: string, id: string) {
		const storageEntry = this.storage.get(to);
		if (!storageEntry) return undefined;
		const scopedKey = `${to}.${id}`;
		if (storageEntry.has(scopedKey)) return scopedKey;
		const separator = to.indexOf('.');
		if (separator === -1) return undefined;
		const globalKey = `${to.slice(0, separator)}.${id}`;
		return storageEntry.has(globalKey) ? globalKey : undefined;
	}

	contains(to: string, id: string): boolean {
		return this._getRelationshipKey(to, id) !== undefined;
	}

	getToRelationship(to: string): string[] {
		const storageEntry = this.storage.get(to);
		if (!storageEntry) return [];
		const ids: string[] = [];
		for (const key of storageEntry.keys()) ids.push(key.slice(key.lastIndexOf('.') + 1));
		return ids;
	}

	removeToRelationship(to: string, keys: string | string[]) {
		for (const id of Array.isArray(keys) ? keys : [keys]) {
			const key = this._getRelationshipKey(to, id);
			if (key) this.remove(key);
		}
	}

	removeRelationship(to: string | string[]) {
		for (const relationship of Array.isArray(to) ? to : [to]) {
			const storageEntry = this.storage.get(relationship);
			if (!storageEntry) continue;
			for (const key of storageEntry.keys()) this.keyToStorage.delete(key);
			this.storage.delete(relationship);
		}
	}
}
