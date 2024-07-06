import type { GatewayIntentBits } from 'discord-api-types/v10';
import type { UsingClient } from '../../../commands';
import { fakePromise } from '../../../common';
import type { Cache, ReturnCache } from '../../index';

export class GuildBasedResource<T = any, S = any> {
	client!: UsingClient;
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
	filter(data: any, id: string, guild_id: string) {
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
		return;
	}

	setIfNI(intent: keyof typeof GatewayIntentBits, id: string, guildId: string, data: S) {
		if (!this.cache.hasIntent(intent)) {
			return this.set(id, guildId, data);
		}
	}

	get(id: string, guild: string): ReturnCache<(T & { guild_id: string }) | undefined> {
		return this.adapter.get(this.hashGuildId(guild, id));
	}

	bulk(ids: string[], guild: string): ReturnCache<(T & { guild_id: string })[]> {
		return fakePromise(this.adapter.bulkGet(ids.map(id => this.hashGuildId(guild, id)))).then(x => x.filter(y => y));
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
		).then(() =>
			this.adapter.bulkSet(
				keys.map(([key, value]) => {
					return [this.hashGuildId(guild, key), this.parse(value, key, guild)] as const;
				}),
			),
		) as void;
	}

	patch(__keys: string, guild: string, data: S): ReturnCache<void>;
	patch(__keys: [string, any][], guild: string): ReturnCache<void>;
	patch(__keys: string | [string, any][], guild: string, data?: any): ReturnCache<void> {
		const keys = (Array.isArray(__keys) ? __keys : [[__keys, data]]).filter(x => this.filter(x[1], x[0], guild)) as [
			string,
			any,
		][];

		return fakePromise(this.adapter.bulkGet(keys.map(([key]) => this.hashGuildId(guild, key)))).then(oldDatas =>
			fakePromise(
				this.addToRelationship(
					keys.map(x => x[0]),
					guild,
				),
			).then(() =>
				this.adapter.bulkSet(
					keys.map(([key, value]) => {
						const oldData = oldDatas.find(x => x.id === key) ?? {};
						return [this.hashGuildId(guild, key), this.parse({ ...oldData, ...value }, key, guild)];
					}),
				),
			),
		) as void;
	}

	remove(id: string | string[], guild: string) {
		const ids = Array.isArray(id) ? id : [id];
		return fakePromise(this.removeToRelationship(ids, guild)).then(() =>
			this.adapter.bulkRemove(ids.map(x => this.hashGuildId(guild, x))),
		);
	}

	keys(guild: string): ReturnCache<string[]> {
		return this.adapter.scan(this.hashGuildId(guild, '*'), true) as string[];
	}

	values(guild: string): ReturnCache<(T & { guild_id: string })[]> {
		return this.adapter.scan(this.hashGuildId(guild, '*')) as any[];
	}

	count(guild: string): ReturnCache<number> {
		return fakePromise(this.adapter.scan(this.hashGuildId(guild, '*'), true)).then(data => data.length);
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

	hashGuildId(guild: string, id: string) {
		return id.startsWith(this.namespace) ? id : `${this.namespace}.${guild}.${id}`;
	}
}
