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
	readonly relationships = new Map<string, Map<string, string[]>>();

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
		const isWildcard = sq.map(segment => segment === '*');

		return [...this.storage.values()].flatMap(storageEntry =>
			Array.from(storageEntry.entries())
				.filter(([key]) => key.split('.').every((value, i) => isWildcard[i] || sq[i] === value))
				.map(([key, value]) => (keys ? key : this.options.decode(value.value))),
		);
	}

	bulkGet(keys: string[]) {
		const storageArray = Array.from(this.storage.values());
		const keySet = new Set(keys);

		return storageArray.flatMap(storageEntry => {
			const entries = Array.from(storageEntry.entries());
			return entries.filter(([key]) => keySet.has(key)).map(([, value]) => this.options.decode(value.value as T));
		});
	}

	get(key: string) {
		for (const storageEntry of this.storage.values()) {
			if (storageEntry.has(key)) {
				const data = storageEntry.get(key);
				return data ? this.options.decode(data) : null;
			}
		}
		return null;
	}

	private __set(key: string, data: any) {
		const isArray = Array.isArray(data);
		if (isArray && data.length === 0) {
			return;
		}
		const __guildId = isArray ? data[0].guild_id : data.guild_id;
		const namespace = `${key.split('.')[0]}${__guildId ? `.${__guildId}` : ''}`;
		const self = this;
		if (!this.storage.has(namespace)) {
			this.storage.set(
				namespace,
				new LimitedCollection({
					expire:
						this.options[key.split('.')[0] as Exclude<keyof LimitedMemoryAdapterOptions<T>, 'decode' | 'encode'>]
							?.expire ?? this.options.default.expire,
					limit:
						this.options[key.split('.')[0] as Exclude<keyof LimitedMemoryAdapterOptions<T>, 'decode' | 'encode'>]
							?.limit ?? this.options.default.limit,
					resetOnDemand: true,
					onDelete(k) {
						const relationshipNamespace = key.split('.')[0];
						const existsRelation = self.relationships.has(relationshipNamespace);
						if (existsRelation) {
							switch (relationshipNamespace) {
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
								case 'message':
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
				}),
			);
		}

		this.storage.get(namespace)!.set(key, this.options.encode(data));
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
		return this.getToRelationship(to).length;
	}

	bulkRemove(keys: string[]) {
		for (const i of keys) {
			this.remove(i);
		}
	}

	remove(key: string) {
		const keySplit = key.split('.');
		const parentNamespace = keySplit.at(0)!;
		switch (parentNamespace) {
			case 'ban':
			case 'member':
			case 'voice_state':
				{
					this.storage
						.get(`${parentNamespace}.${keySplit.at(1)}`)
						?.delete(`${parentNamespace}.${keySplit.at(1)}.${keySplit.at(2)}`);
				}
				break;
			case 'channel':
			case 'emoji':
			case 'presence':
			case 'role':
			case 'stage_instance':
			case 'sticker':
			case 'overwrite':
			case 'message':
				for (const keyStorage of this.storage.keys()) {
					if (keyStorage.startsWith(parentNamespace)) {
						const storage = this.storage.get(keyStorage)!;
						if (storage.has(key)) {
							storage.delete(key);
							break;
						}
					}
				}
				break;
			// case 'user':
			// case 'guild':
			default:
				this.storage.get(parentNamespace)?.delete(`${parentNamespace}.${keySplit.at(1)}`);
				break;
		}
	}

	flush(): void {
		this.storage.clear();
		this.relationships.clear();
	}

	contains(to: string, keys: string): boolean {
		return this.getToRelationship(to).includes(keys);
	}

	getToRelationship(to: string) {
		const key = to.split('.')[0];
		if (!this.relationships.has(key)) this.relationships.set(key, new Map<string, string[]>());
		const relation = this.relationships.get(key)!;
		const subrelationKey = to.split('.')[1] ?? '*';
		if (!relation.has(subrelationKey)) {
			relation.set(subrelationKey, []);
		}
		return relation.get(subrelationKey)!;
	}

	bulkAddToRelationShip(data: Record<string, string[]>) {
		for (const i in data) {
			this.addToRelationship(i, data[i]);
		}
	}

	addToRelationship(to: string, keys: string | string[]) {
		const key = to.split('.')[0];
		if (!this.relationships.has(key)) {
			this.relationships.set(key, new Map<string, string[]>());
		}

		const data = this.getToRelationship(to);

		for (const key of Array.isArray(keys) ? keys : [keys]) {
			if (!data.includes(key)) {
				data.push(key);
			}
		}
	}

	removeToRelationship(to: string, keys: string | string[]) {
		const data = this.getToRelationship(to);
		if (data) {
			for (const key of Array.isArray(keys) ? keys : [keys]) {
				const idx = data.indexOf(key);
				if (idx !== -1) {
					data.splice(idx, 1);
				}
			}
		}
	}

	removeRelationship(to: string | string[]) {
		for (const i of Array.isArray(to) ? to : [to]) {
			this.relationships.delete(i);
		}
	}
}
