import { LimitedCollection } from '../../collection';
import { type MakeRequired, MergeOptions } from '../../common';
import { type CacheResourceLayout, getCacheResourceLayout, needsCacheStorageIndex } from './shared';
import type { Adapter, AdapterEntry, AdapterRelationship } from './types';

export interface ResourceLimitedMemoryAdapter {
	expire?: number;
	limit?: number;
}

export interface LimitedMemoryAdapterOptions<T> {
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
	overwrite?: ResourceLimitedMemoryAdapter;
	message?: ResourceLimitedMemoryAdapter;

	encode?(data: any): T;
	decode?(data: T): unknown;
}

export type LimitedMemoryStorageIndex<T> =
	| LimitedCollection<string, T>
	| readonly [storage: LimitedCollection<string, T>, relationship: AdapterRelationship];

export class LimitedMemoryAdapter<T> implements Adapter {
	isAsync = false;

	readonly storage = new Map<string, LimitedCollection<string, T>>();
	readonly relationships = new Map<string, Map<string, Set<string>>>();
	readonly keyToStorage = new Map<string, LimitedMemoryStorageIndex<T>>();

	options: MakeRequired<LimitedMemoryAdapterOptions<T>, 'default' | 'encode' | 'decode'>;

	constructor(options?: LimitedMemoryAdapterOptions<T>) {
		this.options = MergeOptions(
			{
				default: {
					expire: undefined,
					limit: Number.POSITIVE_INFINITY,
				},
				encode(data) {
					return data;
				},
				decode(data) {
					return data;
				},
			} satisfies LimitedMemoryAdapterOptions<T>,
			options,
		);
	}

	start() {
		//
	}

	scan(query: string, keys?: false): any[];
	scan(query: string, keys: true): string[];
	scan(query: string, keys = false) {
		const sq = query.split('.');
		const values: (string | unknown)[] = [];

		for (const storageEntry of this.storage.values()) {
			for (const [key, entry] of storageEntry.rawEntries()) {
				const keySplit = key.split('.');
				if (
					keySplit.length === sq.length &&
					keySplit.every((segment, index) => (sq[index] === '*' ? !!segment : sq[index] === segment))
				) {
					values.push(keys ? key : this.options.decode(entry.value));
				}
			}
		}

		return values;
	}

	bulkGet(keys: string[]) {
		const result: unknown[] = [];
		for (const key of keys) {
			const data = this.get(key);
			if (data !== undefined && data !== null) result.push(data);
		}
		return result;
	}

	private _getKeyResource(key: string) {
		const separator = key.indexOf('.');
		return separator === -1 ? key : key.slice(0, separator);
	}

	private _hasScopedStorageKey(resource: string, key: string) {
		return key.indexOf('.', resource.length + 1) !== -1;
	}

	private _getIndexedStorage(index: LimitedMemoryStorageIndex<T>) {
		return Array.isArray(index) ? index[0] : index;
	}

	private _deleteIndexedStorage(key: string, storageEntry: LimitedCollection<string, T>) {
		const index = this.keyToStorage.get(key);
		if (!index || this._getIndexedStorage(index) !== storageEntry) return;
		this._removeExplicitRelationship(index);
		this.keyToStorage.delete(key);
	}

	private _getStorageNamespaceFromKey(resource: string, layout: CacheResourceLayout, key: string) {
		if (layout !== 'guild-keyed' && !(layout === 'custom' && this._hasScopedStorageKey(resource, key))) {
			return resource;
		}

		const scopeEnd = key.indexOf('.', resource.length + 1);
		return scopeEnd === -1 ? resource : key.slice(0, scopeEnd);
	}

	private _getMessageNamespace(data: any) {
		const scope = Array.isArray(data) ? data[0]?.guild_id : data?.guild_id;
		return scope ? `message.${scope}` : 'message';
	}

	private _getStorageEntry(key: string) {
		const index = this.keyToStorage.get(key);
		if (index) {
			const indexedStorage = this._getIndexedStorage(index);
			if (indexedStorage.has(key)) return { storageEntry: indexedStorage };
			this._deleteIndexedStorage(key, indexedStorage);
			return undefined;
		}

		const resource = this._getKeyResource(key);
		const layout = getCacheResourceLayout(resource);
		if (layout !== 'guild-indexed' && layout !== 'message') {
			const namespace = this._getStorageNamespaceFromKey(resource, layout, key);
			const storageEntry = this.storage.get(namespace);
			if (storageEntry?.has(key)) return { storageEntry };
		}
		return undefined;
	}

	get(key: string) {
		const entry = this._getStorageEntry(key);
		return entry ? this.options.decode(entry.storageEntry.get(key)!) : null;
	}

	private _getWithoutRefresh(key: string) {
		const entry = this._getStorageEntry(key);
		const data = entry?.storageEntry.raw(key);
		return data ? this.options.decode(data.value) : null;
	}

	private _getRelationshipData(to: string) {
		const separator = to.indexOf('.');
		return separator === -1 ? [to, '*'] : [to.slice(0, separator), to.slice(separator + 1)];
	}

	private _getExplicitRelationshipSet(to: string) {
		const [resource, scope] = this._getRelationshipData(to);
		return this.relationships.get(resource)?.get(scope);
	}

	private _ensureExplicitRelationshipSet(to: string) {
		const [resource, scope] = this._getRelationshipData(to);
		let relationships = this.relationships.get(resource);
		if (!relationships) {
			relationships = new Map();
			this.relationships.set(resource, relationships);
		}
		let ids = relationships.get(scope);
		if (!ids) {
			ids = new Set();
			relationships.set(scope, ids);
		}
		return ids;
	}

	private _removeExplicitRelationship(index: LimitedMemoryStorageIndex<T>) {
		if (!Array.isArray(index)) return;
		const [to, id] = index[1];
		const [resource, scope] = this._getRelationshipData(to);
		const relationships = this.relationships.get(resource);
		const ids = relationships?.get(scope);
		ids?.delete(id);
		if (ids?.size === 0) relationships?.delete(scope);
		if (relationships?.size === 0) this.relationships.delete(resource);
	}

	private _syncMessageRelationship(relationship: AdapterRelationship) {
		this._ensureExplicitRelationshipSet(relationship[0]).add(relationship[1]);
	}

	private _deleteEmptyStorage(namespace: string, storageEntry: LimitedCollection<string, T>) {
		if (storageEntry.size === 0 && this.storage.get(namespace) === storageEntry) this.storage.delete(namespace);
	}

	private _createStorageEntry(resource: string, namespace: string) {
		const resourceOptions =
			this.options[resource as Exclude<keyof LimitedMemoryAdapterOptions<T>, 'decode' | 'encode'>];
		const expire = resourceOptions?.expire ?? this.options.default.expire;
		const bucket = new LimitedCollection<string, T>({
			expire,
			limit: resourceOptions?.limit ?? this.options.default.limit,
			resetOnDemand: (expire ?? 0) > 0,
			onDelete: key => {
				this._deleteIndexedStorage(key, bucket);
				if (bucket.size === 1 && bucket.has(key) && this.storage.get(namespace) === bucket) {
					this.storage.delete(namespace);
				}
			},
		});
		this.storage.set(namespace, bucket);
		return bucket;
	}

	private _set(key: string, value: any, relationship: AdapterRelationship, patch: boolean) {
		const data = patch && !Array.isArray(value) ? { ...(this._getWithoutRefresh(key) ?? {}), ...value } : value;
		const encoded = this.options.encode(data);
		const resource = this._getKeyResource(key);
		const layout = getCacheResourceLayout(resource);
		const namespace = layout === 'message' ? this._getMessageNamespace(data) : relationship[0];
		if (!namespace) return;

		const storageEntry = this.storage.get(namespace) ?? this._createStorageEntry(resource, namespace);
		const usesIndex = layout === 'message' || needsCacheStorageIndex(key, namespace);
		const previousMessageIndex = layout === 'message' ? this.keyToStorage.get(key) : undefined;
		const previousMessageStorage = previousMessageIndex ? this._getIndexedStorage(previousMessageIndex) : undefined;
		if (storageEntry.set(key, encoded)) {
			if (previousMessageStorage && previousMessageStorage !== storageEntry) previousMessageStorage.delete(key);
			if (usesIndex) {
				this.keyToStorage.set(key, layout === 'message' ? [storageEntry, relationship] : storageEntry);
			}
			if (layout === 'message') this._syncMessageRelationship(relationship);
		}
		this._deleteEmptyStorage(namespace, storageEntry);
	}

	set(key: string, value: any, relationship: AdapterRelationship) {
		this._set(key, value, relationship, false);
	}

	bulkSet(entries: AdapterEntry[]) {
		for (const [key, value, relationship] of entries) this.set(key, value, relationship);
	}

	patch(key: string, value: any, relationship: AdapterRelationship) {
		this._set(key, value, relationship, true);
	}

	bulkPatch(entries: AdapterEntry[]) {
		for (const [key, value, relationship] of entries) this.patch(key, value, relationship);
	}

	values(to: string) {
		const values: any[] = [];
		for (const key of this.keys(to)) {
			const value = this.get(key);
			if (value !== undefined && value !== null) values.push(value);
		}
		return values;
	}

	private _getRelationshipBucket(to: string) {
		return getCacheResourceLayout(this._getKeyResource(to)) === 'message' ? undefined : this.storage.get(to);
	}

	keys(to: string) {
		const bucket = this._getRelationshipBucket(to);
		if (bucket) return [...bucket.keys()];
		const keys: string[] = [];
		for (const [key, index] of this.keyToStorage) {
			if (Array.isArray(index) && index[1][0] === to) keys.push(key);
		}
		return keys;
	}

	count(to: string) {
		return this._getRelationshipBucket(to)?.size ?? this._getExplicitRelationshipSet(to)?.size ?? 0;
	}

	private _getBucketKey(to: string, id: string, bucket: LimitedCollection<string, T>) {
		const resource = this._getKeyResource(to);
		const layout = getCacheResourceLayout(resource);
		if (layout === 'guild-keyed') return `${to}.${id}`;
		if (layout !== 'custom') return `${resource}.${id}`;
		const scopedKey = `${to}.${id}`;
		return bucket.has(scopedKey) ? scopedKey : `${resource}.${id}`;
	}

	contains(to: string, id: string): boolean {
		const bucket = this._getRelationshipBucket(to);
		return bucket
			? bucket.has(this._getBucketKey(to, id, bucket))
			: (this._getExplicitRelationshipSet(to)?.has(id) ?? false);
	}

	getToRelationship(to: string): string[] {
		const bucket = this._getRelationshipBucket(to);
		if (!bucket) return [...(this._getExplicitRelationshipSet(to) ?? [])];
		const ids: string[] = [];
		for (const key of bucket.keys()) ids.push(key.slice(key.lastIndexOf('.') + 1));
		return ids;
	}

	bulkRemove(keys: string[]) {
		for (const key of keys) this.remove(key);
	}

	remove(key: string) {
		const entry = this._getStorageEntry(key);
		if (!entry) return;
		entry.storageEntry.delete(key);
	}

	removeToRelationship(to: string, keys: string | string[]) {
		const ids = new Set(Array.isArray(keys) ? keys : [keys]);
		for (const [key, index] of this.keyToStorage) {
			if (Array.isArray(index) && index[1][0] === to && ids.has(index[1][1])) this.remove(key);
		}
	}

	removeRelationship(to: string | string[]) {
		for (const relationship of Array.isArray(to) ? to : [to]) this.bulkRemove(this.keys(relationship));
	}

	flush(): void {
		for (const storageEntry of this.storage.values()) storageEntry.clear();
		this.storage.clear();
		this.relationships.clear();
		this.keyToStorage.clear();
	}
}
