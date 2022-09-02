import type { CacheAdapter } from '../adapters/cache-adapter';
import type { DiscordUser } from '@biscuitland/api-types';

import { BaseResource } from './base-resource';

export class UserResource extends BaseResource {
	namespace = 'user' as const;

	adapter: CacheAdapter;

	constructor(adapter: CacheAdapter) {
		super();

		this.adapter = adapter;
	}

	/**
	 * @inheritDoc
	 */

	async get(id: string): Promise<DiscordUser | null> {
		const kv = await this.adapter.get(this.hashId(id));

		if (kv) {
			return kv;
		}

		return null;
	}

	/**
	 * @inheritDoc
	 */

	async set(id: string, data: any, expire?: number): Promise<void> {
		await this.adapter.set(this.hashId(id), data, expire);
	}

	/**
	 * @inheritDoc
	 */

	async remove(id: string): Promise<void> {
		await this.adapter.remove(this.hashId(id));
	}
}
