import type { CacheAdapter } from '../scheme/adapters/cache-adapter';
import type { DiscordRole } from '@biscuitland/api-types';

import { BaseResource } from './base-resource';

/**
 * Resource represented by an role of discord
 */

export class GuildRoleResource extends BaseResource<DiscordRole> {
	#namespace = 'role' as const;

	#adapter: CacheAdapter;

	constructor(
		adapter: CacheAdapter,
		entity?: DiscordRole | null,
		parent?: string
	) {
		super('role', adapter);

		this.#adapter = adapter;

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
	): Promise<GuildRoleResource | null> {
		if (this.parent) {
			return this;
		}

		const kv = await this.#adapter.get(this.hashGuildId(id, guild));

		if (kv) {
			return new GuildRoleResource(this.#adapter, kv, guild);
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
		if (!data.id) {
			data.id = id;
		}

		if (!data.guild_id) {
			data.guild_id = guild;
		}

		if (this.parent) {
			this.setEntity(data);
		}

		await this.addToRelationship(id, guild);
		await this.#adapter.set(this.hashGuildId(id, guild), data);
	}

	/**
	 * @inheritDoc
	 */

	async count(): Promise<number> {
		return await this.#adapter.count(this.#namespace);
	}

	/**
	 * @inheritDoc
	 */

	async items(to: string): Promise<GuildRoleResource[]> {
		if (!to && this.parent) {
			to = this.parent;
		}

		const data = await this.#adapter.items(this.hashId(to));

		if (data) {
			return data.map(dt => {
				const resource = new GuildRoleResource(this.#adapter, dt);
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
