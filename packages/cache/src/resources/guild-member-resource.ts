import { CacheAdapter } from '../adapters/cache-adapter';
import { DiscordMember } from '@biscuitland/api-types';

import { BaseResource } from './base-resource';
import { UserResource } from './user-resource';

export class GuildMemberResource extends BaseResource {
	namespace: 'member' = 'member';

	adapter: CacheAdapter;
	users: UserResource;

	constructor(adapter: CacheAdapter) {
		super();

		this.adapter = adapter;
		this.users = new UserResource(adapter);
	}

	/**
	 * @inheritDoc
	 */

	async get(
		id: string,
		guild: string
	): Promise<(DiscordMember & { id: string }) | null> {
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
		if (!data.id) {
			data.id = id;
		}

		if (data.user) {
			await this.users.set(data.user.id, data.user);
		}

		if (!data.guild_id) {
			data.guild_id = guild;
		}

		delete data.user;

		await this.addToRelationship(id, guild);
		await this.adapter.set(this.hashGuildId(id, guild), data, expire);
	}

	/**
	 * @inheritDoc
	 */

	async remove(id: string, guild: string): Promise<void> {
		await this.adapter.remove(this.hashGuildId(id, guild));
	}
}
