import { LimitedCollection } from '../..';
import { type MakeRequired, MergeOptions } from '../../common';
import type { Adapter } from './types';
//TODO: optimizar esto
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

export class LimitedMemoryAdapter<T> implements Adapter {
	isAsync = false;

	readonly storage = new Map<string, LimitedCollection<string, T>>();
	readonly relationships = new Map<string, Map<string, Set<string>>>();
	readonly keyToStorage = new Map<string, LimitedCollection<string, T>>();

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
			for (const [key, entry] of storageEntry.entries()) {
				const keySplit = key.split('.');
				if (
					keySplit.length === sq.length &&
					keySplit.every((segment, i) => (sq[i] === '*' ? !!segment : sq[i] === segment))
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
		const separatorIndex = key.indexOf('.');
		return separatorIndex === -1 ? key : key.slice(0, separatorIndex);
	}

	private _getKeyScope(key: string) {
		const separatorIndex = key.indexOf('.');
		if (separatorIndex === -1) {
			return '';
		}

		const scopeStart = separatorIndex + 1;
		const scopeEnd = key.indexOf('.', scopeStart);
		return scopeEnd === -1 ? key.slice(scopeStart) : key.slice(scopeStart, scopeEnd);
	}

	private _supportsNamespaceIndex(resource: string) {
		switch (resource) {
			case 'channel':
			case 'emoji':
			case 'presence':
			case 'role':
			case 'stage_instance':
			case 'sticker':
			case 'overwrite':
			case 'message':
				return true;
			default:
				return false;
		}
	}

	private _setIndexedStorage(resource: string, key: string, storageEntry: LimitedCollection<string, T>) {
		if (!this._supportsNamespaceIndex(resource)) {
			return;
		}
		this.keyToStorage.set(key, storageEntry);
	}

	private _deleteIndexedStorage(resource: string, key: string) {
		if (!this._supportsNamespaceIndex(resource)) {
			return;
		}
		this.keyToStorage.delete(key);
	}

	private _getIndexedStorage(resource: string, key: string) {
		if (!this._supportsNamespaceIndex(resource)) {
			return;
		}
		return this.keyToStorage.get(key);
	}

	private _getDerivedNamespace(resource: string, scope: string) {
		switch (resource) {
			case 'ban':
			case 'member':
			case 'voice_state':
				return scope ? `${resource}.${scope}` : resource;
			default:
				return resource;
		}
	}

	private _isResourceNamespace(resource: string, namespace: string) {
		return namespace === resource || namespace.startsWith(`${resource}.`);
	}

	private _findNamespaceByStorage(resource: string, storageEntry: LimitedCollection<string, T>) {
		for (const [namespace, candidate] of this.storage.entries()) {
			if (candidate === storageEntry && this._isResourceNamespace(resource, namespace)) {
				return namespace;
			}
		}

		return undefined;
	}

	private _getStorageNamespace(resource: string, data: any) {
		const isArray = Array.isArray(data);
		if (isArray && data.length === 0) {
			return;
		}

		const scope = isArray ? data[0].guild_id : data.guild_id;
		return `${resource}${scope ? `.${scope}` : ''}`;
	}

	private _getStorageEntry(key: string) {
		const resource = this._getKeyResource(key);
		const supportsNamespaceIndex = this._supportsNamespaceIndex(resource);
		const indexedStorage = this._getIndexedStorage(resource, key);
		if (indexedStorage?.has(key)) {
			return {
				resource,
				storageEntry: indexedStorage,
			};
		}

		if (indexedStorage) {
			this._deleteIndexedStorage(resource, key);
		}

		if (!supportsNamespaceIndex) {
			const namespace = this._getDerivedNamespace(resource, this._getKeyScope(key));
			const storageEntry = this.storage.get(namespace);
			if (storageEntry?.has(key)) {
				return {
					resource,
					namespace,
					storageEntry,
				};
			}
		}

		for (const [namespace, storageEntry] of this.storage.entries()) {
			if (this._isResourceNamespace(resource, namespace) && storageEntry.has(key)) {
				this._setIndexedStorage(resource, key, storageEntry);
				return {
					resource,
					namespace,
					storageEntry,
				};
			}
		}

		return;
	}

	get(key: string) {
		const entry = this._getStorageEntry(key);
		if (!entry) {
			return null;
		}

		return this.options.decode(entry.storageEntry.get(key)!);
	}

	private __set(key: string, data: any) {
		const resource = this._getKeyResource(key);
		const namespace = this._getStorageNamespace(resource, data);
		if (!namespace) {
			return;
		}

		let storageEntry = this.storage.get(namespace);
		if (!storageEntry) {
			const self = this;
			storageEntry = new LimitedCollection({
				expire:
					this.options[resource as Exclude<keyof LimitedMemoryAdapterOptions<T>, 'decode' | 'encode'>]?.expire ??
					this.options.default.expire,
				limit:
					this.options[resource as Exclude<keyof LimitedMemoryAdapterOptions<T>, 'decode' | 'encode'>]?.limit ??
					this.options.default.limit,
				resetOnDemand: true,
				onDelete(k, value) {
					self._deleteIndexedStorage(resource, k);
					const relationshipNamespace = resource;
					const existsRelation = self.relationships.has(relationshipNamespace);
					if (existsRelation) {
						switch (relationshipNamespace) {
							case 'message':
								{
									const decodedValue = self.options.decode(value) as { channel_id?: string };
									if (decodedValue.channel_id)
										self.removeToRelationship(`${relationshipNamespace}.${decodedValue.channel_id}`, k.split('.')[1]);
								}
								break;
							case 'ban':
							case 'member':
							case 'voice_state':
								{
									const split = k.split('.');
									self.removeToRelationship(`${namespace}.${split[1]}`, split[2]);
								}
								break;
							case 'channel':
							case 'emoji':
							case 'presence':
							case 'role':
							case 'stage_instance':
							case 'sticker':
							case 'overwrite':
								self.removeToRelationship(namespace, k.split('.')[1]);
								break;
							// case 'guild':
							// case 'user':
							default:
								self.removeToRelationship(namespace, k.split('.')[1]);
								break;
						}
					}
				},
			});
			this.storage.set(namespace, storageEntry);
		}

		const previousBucket = this._getIndexedStorage(resource, key);
		if (previousBucket && previousBucket !== storageEntry) {
			previousBucket?.delete(key);
			if (previousBucket?.size === 0) {
				const previousNamespace = this._findNamespaceByStorage(resource, previousBucket);
				if (previousNamespace) {
					this.storage.delete(previousNamespace);
				}
			}
		}

		this._setIndexedStorage(resource, key, storageEntry);
		storageEntry.set(key, this.options.encode(data));
	}

	bulkSet(keys: [string, any][]) {
		for (const [key, value] of keys) {
			this.__set(key, value);
		}
	}

	set(keys: string, data: any) {
		this.__set(keys, data);
	}

	bulkPatch(keys: [string, any][]) {
		for (const [key, value] of keys) {
			const oldData = this.get(key);
			this.__set(key, Array.isArray(value) ? value : { ...(oldData ?? {}), ...value });
		}
	}

	patch(keys: string, data: any) {
		const oldData = this.get(keys);
		this.__set(keys, Array.isArray(data) ? data : { ...(oldData ?? {}), ...data });
	}

	values(to: string) {
		const array: any[] = [];
		const data = this.keys(to);

		for (const key of data) {
			const content = this.get(key);

			if (content !== undefined && content !== null) {
				array.push(content);
			}
		}

		return array;
	}

	keys(to: string) {
		const result: string[] = [];
		for (const id of this._getRelationshipSet(to)) {
			result.push(`${to}.${id}`);
		}
		return result;
	}

	count(to: string) {
		return this._getRelationshipSet(to).size;
	}

	bulkRemove(keys: string[]) {
		for (const i of keys) {
			this.remove(i);
		}
	}

	remove(key: string) {
		const entry = this._getStorageEntry(key);
		if (!entry) {
			return;
		}

		entry.storageEntry.delete(key);
		this._deleteIndexedStorage(entry.resource, key);
		if (entry.storageEntry.size === 0) {
			const namespace = entry.namespace ?? this._findNamespaceByStorage(entry.resource, entry.storageEntry);
			if (namespace) {
				this.storage.delete(namespace);
			}
		}
	}

	flush(): void {
		this.storage.clear();
		this.relationships.clear();
		this.keyToStorage.clear();
	}

	contains(to: string, keys: string): boolean {
		return this._getRelationshipSet(to).has(keys);
	}

	private _getRelationshipData(to: string) {
		const [key, subrelationKey = '*'] = to.split('.');
		return { key, subrelationKey };
	}

	private _getRelationshipSet(to: string) {
		const { key, subrelationKey } = this._getRelationshipData(to);
		if (!this.relationships.has(key)) this.relationships.set(key, new Map<string, Set<string>>());
		const relation = this.relationships.get(key)!;
		if (!relation.has(subrelationKey)) {
			relation.set(subrelationKey, new Set<string>());
		}
		return relation.get(subrelationKey)!;
	}

	getToRelationship(to: string): string[] {
		return [...this._getRelationshipSet(to)];
	}

	bulkAddToRelationShip(data: Record<string, string[]>) {
		for (const i in data) {
			this.addToRelationship(i, data[i]);
		}
	}

	addToRelationship(to: string, keys: string | string[]) {
		const data = this._getRelationshipSet(to);

		for (const key of Array.isArray(keys) ? keys : [keys]) {
			data.add(key);
		}
	}

	removeToRelationship(to: string, keys: string | string[]) {
		const data = this._getRelationshipSet(to);
		for (const key of Array.isArray(keys) ? keys : [keys]) {
			data.delete(key);
		}
	}

	removeRelationship(to: string | string[]) {
		for (const i of Array.isArray(to) ? to : [to]) {
			const { key, subrelationKey } = this._getRelationshipData(i);
			if (subrelationKey === '*') {
				this.relationships.delete(key);
				continue;
			}

			const relation = this.relationships.get(key);
			if (!relation) continue;
			relation.delete(subrelationKey);
			if (!relation.size) this.relationships.delete(key);
		}
	}
}
