import type { UsingClient } from '../../../commands';
import type { Cache, ReturnCache } from '../../index';

export class BaseRelationShip {
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

	add(to: string, keys: string[]): ReturnCache<void> {
		return this.cache.adapter.addToRelationship(this.buildKey(to), keys) as never;
	}

	get(to: string): ReturnCache<string[]> {
		return this.cache.adapter.getToRelationship(this.buildKey(to)) as never;
	}

	remove(to: string, keys: string[]): ReturnCache<void> {
		return this.cache.adapter.removeToRelationship(this.buildKey(to), keys) as never;
	}

	delete(to: string): ReturnCache<void> {
		return this.cache.adapter.removeRelationship(this.buildKey(to)) as never;
	}

	buildKey(to: string) {
		return `${this.namespace}_rs.${to}`;
	}
}
