import { CacheAdapter } from '../adapters/cache-adapter';
import { DiscordEmoji } from '@biscuitland/api-types';

import { BaseResource } from './base-resource';

export class GuildEmojiResource extends BaseResource {
	namespace: 'emoji' = 'emoji';

	adapter: CacheAdapter;

	constructor(adapter: CacheAdapter) {
		super();

		this.adapter = adapter;
	}

	/**
	 * @inheritDoc
	 */

	async get(id: string, guild: string): Promise<DiscordEmoji | null> {
		const kv = await this.adapter.get(this.hashGuildId(id, guild));

		if (kv) {
			return kv;
		}

		return null;
	}

	/**
	 * @inheritDoc
	 */

	async set(
		id: string,
		guild: string,
		data: any,
		expire?: number
	): Promise<void> {
		await this.adapter.set(this.hashGuildId(id, guild), data, expire);
	}

	/**
	 * @inheritDoc
	 */

	async remove(id: string, guild: string): Promise<void> {
		await this.adapter.remove(this.hashGuildId(id, guild));
	}
}
