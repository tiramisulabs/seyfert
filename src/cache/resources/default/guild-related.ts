import type { GatewayIntentBits } from 'discord-api-types/v10';
import type { BaseClient } from '../../../client/base';
import type { UsingClient } from '../../../commands';
import { fakePromise } from '../../../common';
import type { Cache, ReturnCache } from '../../index';

export class GuildRelatedResource<T = any, S = any> {
	client!: BaseClient;
	namespace = 'base';

	constructor(
		protected cache: Cache,
		client?: UsingClient,
	) {
		if (client) {
			this.client = client;
		}
	}

	/** @internal */
	__setClient(client: UsingClient) {
		this.client = client;
	}

	//@ts-expect-error
	filter(data: any, id: string, guild_id?: string) {
		return true;
	}

	parse(data: any, id: string, guild_id: string) {
		if (!data.id) data.id = id;
		data.guild_id = guild_id;
		return data;
	}

	get adapter() {
		return this.cache.adapter;
	}

	removeIfNI(intent: keyof typeof GatewayIntentBits, id: string | string[], guildId: string) {
		if (!this.cache.hasIntent(intent)) {
			return this.remove(id, guildId);
		}
	}

	setIfNI(intent: keyof typeof GatewayIntentBits, id: string, guildId: string, data: S) {
		if (!this.cache.hasIntent(intent)) {
			return this.set(id, guildId, data);
		}
	}

	get(id: string): ReturnCache<(T & { guild_id: string }) | undefined> {
		return this.adapter.get(this.hashId(id));
	}

	bulk(ids: string[]): ReturnCache<(T & { guild_id: string })[]> {
		return fakePromise(this.adapter.bulkGet(ids.map(x => this.hashId(x)))).then(x => x.filter(y => y));
	}

	set(__keys: string, guild: string, data: S): ReturnCache<void>;
	set(__keys: [string, S][], guild: string): ReturnCache<void>;
	set(__keys: string | [string, S][], guild: string, data?: S): ReturnCache<void> {
		const keys = (Array.isArray(__keys) ? __keys : [[__keys, data]]).filter(x =>
			this.filter(x[1], x[0] as string, guild),
		) as [string, any][];

		return fakePromise(
			this.addToRelationship(
				keys.map(x => x[0]),
				guild,
			),
		).then(
			() =>
				this.adapter.bulkSet(
					keys.map(([key, value]) => {
						return [this.hashId(key), this.parse(value, key, guild)] as const;
					}),
				) as void,
		);
	}

	patch(__keys: string, guild?: string, data?: any): ReturnCache<void>;
	patch(__keys: [string, any][], guild?: string): ReturnCache<void>;
	patch(__keys: string | [string, any][], guild?: string, data?: any): ReturnCache<void> {
		const keys = (Array.isArray(__keys) ? __keys : [[__keys, data]]).filter(x => this.filter(x[1], x[0], guild)) as [
			string,
			any,
		][];

		if (guild) {
			return fakePromise(
				this.addToRelationship(
					keys.map(x => x[0]),
					guild,
				),
			).then(
				() =>
					this.adapter.bulkPatch(
						false,
						keys.map(([key, value]) => {
							return [this.hashId(key), this.parse(value, key, guild)] as const;
						}),
					) as void,
			);
		}
		return fakePromise(
			this.adapter.bulkPatch(
				true,
				keys.map(([key, value]) => {
					return [this.hashId(key), value];
				}),
			),
		).then(x => x);
	}

	remove(id: string | string[], guild: string) {
		const ids = Array.isArray(id) ? id : [id];
		return fakePromise(this.removeToRelationship(ids, guild)).then(() =>
			this.adapter.bulkRemove(ids.map(x => this.hashId(x))),
		);
	}

	keys(guild: string): ReturnCache<string[]> {
		return guild === '*'
			? (this.adapter.scan(this.hashId(guild), true) as string[])
			: (fakePromise(this.adapter.getToRelationship(this.hashId(guild))).then(keys =>
					keys.map(x => `${this.namespace}.${x}`),
				) as string[]);
	}

	values(guild: string): ReturnCache<(T & { guild_id: string })[]> {
		return guild === '*'
			? (fakePromise(this.adapter.scan(this.hashId(guild))).then(x => x) as (T & { guild_id: string })[])
			: (fakePromise(this.adapter.getToRelationship(this.hashId(guild))).then(keys =>
					this.adapter.bulkGet(keys.map(x => `${this.namespace}.${x}`)),
				) as (T & { guild_id: string })[]);
	}

	count(to: string): ReturnCache<number> {
		return to === '*'
			? fakePromise(this.keys(to)).then(x => x.length)
			: (this.adapter.count(this.hashId(to)) as number);
	}

	contains(id: string, guild: string): ReturnCache<boolean> {
		return this.adapter.contains(this.hashId(guild), id) as boolean;
	}

	getToRelationship(guild: string) {
		return this.adapter.getToRelationship(this.hashId(guild));
	}

	addToRelationship(id: string | string[], guild: string) {
		return this.adapter.addToRelationship(this.hashId(guild), id);
	}

	removeToRelationship(id: string | string[], guild: string) {
		return this.adapter.removeToRelationship(this.hashId(guild), id);
	}

	removeRelationship(id: string | string[]) {
		return this.adapter.removeRelationship((Array.isArray(id) ? id : [id]).map(x => this.hashId(x)));
	}

	hashId(id: string) {
		return id.startsWith(this.namespace) ? id : `${this.namespace}.${id}`;
	}
}
