import { LimitedCollection } from '../..';
import { MergeOptions, type MakeRequired } from '../../common';
import type { Adapter } from './types';
//TODO: optimizar esto
export interface ResourceLimitedMemoryAdapter {
	expire?: number;
	limit?: number;
}

export interface LimitedMemoryAdapterOptions {
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
	thread?: ResourceLimitedMemoryAdapter;
	overwrite?: ResourceLimitedMemoryAdapter;
	message?: ResourceLimitedMemoryAdapter;
}

export class LimitedMemoryAdapter implements Adapter {
	isAsync = false;

	readonly storage = new Map<string, LimitedCollection<string, string>>();
	readonly relationships = new Map<string, Map<string, string[]>>();

	options: MakeRequired<LimitedMemoryAdapterOptions, 'default'>;

	constructor(options: LimitedMemoryAdapterOptions) {
		this.options = MergeOptions(
			{
				default: {
					expire: undefined,
					limit: Number.POSITIVE_INFINITY,
				},
			} satisfies LimitedMemoryAdapterOptions,
			options,
		);
	}

	scan(query: string, keys?: false): any[];
	scan(query: string, keys: true): string[];
	scan(query: string, keys = false) {
		const values = [];
		const sq = query.split('.');
		for (const iterator of [...this.storage.values()].flatMap(x => x.entries()))
			for (const [key, value] of iterator) {
				if (key.split('.').every((value, i) => (sq[i] === '*' ? !!value : sq[i] === value))) {
					values.push(keys ? key : JSON.parse(value.value));
				}
			}

		return values;
	}

	bulkGet(keys: string[]) {
		const iterator = [...this.storage.values()];
		return keys
			.map(key => {
				const data = iterator.find(x => x.has(key))?.get(key);
				return data ? JSON.parse(data) : null;
			})
			.filter(x => x);
	}

	get(keys: string) {
		const data = [...this.storage.values()].find(x => x.has(keys))?.get(keys);
		return data ? JSON.parse(data) : null;
	}

	private __set(key: string, data: any) {
		const __guildId = Array.isArray(data) ? data[0].guild_id : data.guild_id;
		const namespace = `${key.split('.')[0]}${__guildId ? `.${__guildId}` : ''}`;
		const self = this;
		if (!this.storage.has(namespace)) {
			this.storage.set(
				namespace,
				new LimitedCollection({
					expire:
						this.options[key.split('.')[0] as keyof LimitedMemoryAdapterOptions]?.expire ?? this.options.default.expire,
					limit:
						this.options[key.split('.')[0] as keyof LimitedMemoryAdapterOptions]?.limit ?? this.options.default.limit,
					resetOnDemand: true,
					onDelete(k) {
						const relationshipNamespace = key.split('.')[0];
						const relation = self.relationships.get(relationshipNamespace);
						if (relation) {
							switch (relationshipNamespace) {
								case 'guild':
								case 'user':
									self.removeToRelationship(namespace, k.split('.')[1]);
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
								case 'thread':
								case 'overwrite':
								case 'message':
									self.removeToRelationship(namespace, k.split('.')[1]);
									break;
							}
						}
					},
				}),
			);
		}

		this.storage.get(namespace)!.set(key, JSON.stringify(data));
	}

	bulkSet(keys: [string, any][]) {
		for (const [key, value] of keys) {
			this.__set(key, value);
		}
	}

	set(keys: string, data: any) {
		this.__set(keys, data);
	}

	bulkPatch(updateOnly: boolean, keys: [string, any][]) {
		for (const [key, value] of keys) {
			const oldData = this.get(key);
			if (updateOnly && !oldData) {
				continue;
			}
			this.__set(key, Array.isArray(value) ? value : { ...(oldData ?? {}), ...value });
		}
	}

	patch(updateOnly: boolean, keys: string, data: any) {
		const oldData = this.get(keys);
		if (updateOnly && !oldData) {
			return;
		}
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
			this.storage.get(i.split('.')[0])?.delete(i);
		}
	}

	remove(key: string) {
		this.storage.get(key.split('.')[0])?.delete(key);
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
		return relation!.get(subrelationKey)!;
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
