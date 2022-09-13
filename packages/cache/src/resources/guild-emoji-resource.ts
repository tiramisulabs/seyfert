import type { CacheAdapter } from '../scheme/adapters/cache-adapter';
import type { DiscordEmoji } from '@biscuitland/api-types';

import { BaseResource } from './base-resource';
import { UserResource } from './user-resource';

/**
 * Resource represented by an emoji of discord
 */

export class GuildEmojiResource extends BaseResource<DiscordEmoji> {
	#namespace = 'emoji' as const;

	#adapter: CacheAdapter;

	#users: UserResource;

	constructor(
		adapter: CacheAdapter,
		entity?: DiscordEmoji | null,
		parent?: string
	) {
		super('emoji', adapter);

		this.#adapter = adapter;
		this.#users = new UserResource(adapter);

		if (entity) {
			this.setEntity(entity);
		}

		if (parent) {
			this.setParent(parent);
		}
	}

	/**
	 * @inheritDoc
	 */

	async get(
		id: string,
		guild: string | undefined = this.parent
	): Promise<GuildEmojiResource | null> {
		if (this.parent) {
			return this;
		}

		const kv = await this.#adapter.get(this.hashGuildId(id, guild));

		if (kv) {
			return new GuildEmojiResource(this.#adapter, kv, guild);
		}

		return null;
	}

	/**
	 * @inheritDoc
	 */

	async set(
		id: string,
		guild: string | undefined = this.parent,
		data: any
	): Promise<void> {
		if (data.user) {
			await this.#users.set(data.user.id, data.user);
		}

		delete data.user;
		delete data.roles;

		if (this.parent) {
			this.setEntity(data);
		}

		await this.addToRelationship(id, guild);
		await this.#adapter.set(this.hashGuildId(id, guild), data);
	}

	/**
	 * @inheritDoc
	 */

	async items(to: string): Promise<GuildEmojiResource[]> {
		if (!to && this.parent) {
			to = this.parent;
		}

		const data = await this.#adapter.items(this.hashId(to));

		if (data) {
			return data.map(dt => {
				const resource = new GuildEmojiResource(this.#adapter, dt);
				resource.setParent(to);

				return resource;
			});
		}

		return [];
	}

	/**
	 * @inheritDoc
	 */

	async remove(
		id: string,
		guild: string | undefined = this.parent
	): Promise<void> {
		await this.removeToRelationship(id, guild);
		await this.#adapter.remove(this.hashGuildId(id, guild));
	}

	/**
	 * @inheritDoc
	 */

	protected hashGuildId(id: string, guild?: string): string {
		if (!guild) {
			return this.hashId(id);
		}

		return `${this.#namespace}.${guild}.${id}`;
	}
}
