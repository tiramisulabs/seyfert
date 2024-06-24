import type { GatewayIntentBits } from 'discord-api-types/v10';
import type { UsingClient } from '../../../commands';
import { fakePromise } from '../../../common';
import type { Cache, ReturnCache } from '../../index';

export class BaseResource<T = any, S = any> {
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
	filter(data: any, id: string) {
		return true;
	}

	get adapter() {
		return this.cache.adapter;
	}

	removeIfNI(intent: keyof typeof GatewayIntentBits, id: string) {
		if (!this.cache.hasIntent(intent)) {
			return this.remove(id);
		}
		return;
	}

	setIfNI(intent: keyof typeof GatewayIntentBits, id: string, data: S) {
		if (!this.cache.hasIntent(intent)) {
			return this.set(id, data);
		}
	}

	get(id: string): ReturnCache<T | undefined> {
		return this.adapter.get(this.hashId(id));
	}

	bulk(ids: string[]): ReturnCache<T[]> {
		return fakePromise(this.adapter.bulkGet(ids.map(id => this.hashId(id)))).then(x => x.filter(y => y));
	}

	set(id: string, data: S) {
		if (!this.filter(data, id)) return;
		return fakePromise(this.addToRelationship(id)).then(() => this.adapter.set(this.hashId(id), data));
	}

	patch(id: string, data: S) {
		if (!this.filter(data, id)) return;
		return fakePromise(this.addToRelationship(id)).then(() => this.adapter.patch(false, this.hashId(id), data));
	}

	remove(id: string) {
		return fakePromise(this.removeToRelationship(id)).then(() => this.adapter.remove(this.hashId(id)));
	}

	keys(): ReturnCache<string[]> {
		return this.adapter.keys(this.namespace) as string[];
	}

	values(): ReturnCache<T[]> {
		return this.adapter.values(this.namespace) as T[];
	}

	count(): ReturnCache<number> {
		return this.adapter.count(this.namespace) as number;
	}

	contains(id: string): ReturnCache<boolean> {
		return this.adapter.contains(this.namespace, id) as boolean;
	}

	getToRelationship() {
		return this.adapter.getToRelationship(this.namespace);
	}

	addToRelationship(id: string | string[]) {
		return this.adapter.addToRelationship(this.namespace, id);
	}

	removeToRelationship(id: string | string[]) {
		return this.adapter.removeToRelationship(this.namespace, id);
	}

	hashId(id: string) {
		return id.startsWith(this.namespace) ? id : `${this.namespace}.${id}`;
	}
}
