import type { CacheAdapter } from '../adapters/cache-adapter';
import type { DiscordChannel } from '@biscuitland/api-types';

import { BaseResource } from './base-resource';

export class ChannelResource extends BaseResource {
	namespace = 'channel' as const;

	adapter: CacheAdapter;

	constructor(adapter: CacheAdapter) {
		super();

		this.adapter = adapter;
	}

	/**
	 * @inheritDoc
	 */

	async get(id: string): Promise<DiscordChannel | null> {
		const kv = await this.adapter.get(this.hashId(id));

		if (kv) {
			return kv;
		}

		return null;
	}

	/**
	 * @inheritDoc // to-do rework
	 */

	async set(id: string, data: any, expire?: number): Promise<void> {
		delete data.recipients;

		await this.addToRelationship(id);
		await this.adapter.set(this.hashId(id), data, expire);
	}

	/**
	 * @inheritDoc
	 */

	async count(): Promise<number> {
		return await this.adapter.count(this.namespace);
	}

	/**
	 * @inheritDoc
	 */

	async remove(id: string): Promise<void> {
		await this.adapter.remove(this.hashId(id));
	}

	/**
	 * @inheritDoc
	 */

	async contains(id: string): Promise<boolean> {
		return await this.adapter.contains(this.namespace, id);
	}

	/**
	 * @inheritDoc
	 */

	async getToRelationship(): Promise<string[]> {
		return await this.adapter.getToRelationship(this.namespace);
	}

	/**
	 * @inheritDoc
	 */

	async addToRelationship(id: string): Promise<void> {
		await this.adapter.addToRelationship(this.namespace, id);
	}
}
