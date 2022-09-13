/**
 * refactor
 */

import type { CacheAdapter } from '../scheme/adapters/cache-adapter';
import type { DiscordPresenceUpdate } from '@biscuitland/api-types';

import { BaseResource } from './base-resource';
import { UserResource } from './user-resource';

/**
 * Resource represented by an presence of discord
 */

export class PresenceResource extends BaseResource<DiscordPresenceUpdate> {
	#namespace = 'presence' as const;

	#adapter: CacheAdapter;

	#users: UserResource;

	constructor(adapter: CacheAdapter, entity?: DiscordPresenceUpdate | null) {
		super('presence', adapter);

		this.#adapter = adapter;
		this.#users = new UserResource(this.#adapter);

		if (entity) {
			this.setEntity(entity);
		}
	}

	/**
	 * @inheritDoc
	 */

	async get(id: string): Promise<PresenceResource | null> {
		if (this.parent) {
			return this;
		}

		const kv = await this.#adapter.get(this.hashId(id));

		if (kv) {
			return new PresenceResource(this.#adapter, kv);
		}

		return null;
	}

	/**
	 * @inheritDoc
	 */

	async set(id: string, data: any): Promise<void> {
		if (data.user) {
			await this.#users.set(data.user.id, data.user);
		}

		delete data.user;
		delete data.roles;

		delete data.guild_id;

		if (this.parent) {
			this.setEntity(data);
		}

		await this.addToRelationship(id);
		await this.#adapter.set(this.hashId(id), data);
	}

	/**
	 * @inheritDoc
	 */

	async items(): Promise<PresenceResource[]> {
		const data = await this.#adapter.items(this.#namespace);

		if (data) {
			return data.map(dt => new PresenceResource(this.#adapter, dt));
		}

		return [];
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

	async remove(id: string): Promise<void> {
		await this.removeToRelationship(id);
		await this.#adapter.remove(this.hashId(id));
	}

	/**
	 * @inheritDoc
	 */

	async contains(id: string): Promise<boolean> {
		return await this.#adapter.contains(this.#namespace, id);
	}

	/**
	 * @inheritDoc
	 */

	async getToRelationship(): Promise<string[]> {
		return await this.#adapter.getToRelationship(this.#namespace);
	}

	/**
	 * @inheritDoc
	 */

	async addToRelationship(id: string): Promise<void> {
		await this.#adapter.addToRelationship(this.#namespace, id);
	}

	/**
	 * @inheritDoc
	 */

	async removeToRelationship(id: string): Promise<void> {
		await this.#adapter.removeToRelationship(this.#namespace, id);
	}
}
