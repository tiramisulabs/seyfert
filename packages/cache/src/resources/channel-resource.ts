/**
 * refactor
 */

import type { CacheAdapter } from '../scheme/adapters/cache-adapter';
import type { DiscordChannel } from '@biscuitland/api-types';

import { BaseResource } from './base-resource';
import { UserResource } from './user-resource';

/**
 * Resource represented by an channel of discord
 */

export class ChannelResource extends BaseResource<DiscordChannel> {
	#namespace = 'channel';

	#adapter: CacheAdapter;

	#users: UserResource;

	constructor(adapter: CacheAdapter, entity?: DiscordChannel | null) {
		super('channel', adapter);

		this.#adapter = adapter;
		this.#users = new UserResource(adapter);

		if (entity) {
			this.setEntity(entity);
		}
	}

	/**
	 * @inheritDoc
	 */

	async get(id: string): Promise<ChannelResource | null> {
		if (this.parent) {
			return this;
		}

		const kv = await this.#adapter.get(this.hashId(id));

		if (kv) {
			return new ChannelResource(this.#adapter, kv);
		}

		return null;
	}

	/**
	 * @inheritDoc
	 */

	async set(id: string, data: any): Promise<void> {
		if (data.recipients) {
			const recipients = [];

			for (const recipient of data.recipients) {
				recipients.push(this.#users.set(recipient.id, recipient));
			}

			await Promise.all(recipients);
		}

		delete data.recipients;
		delete data.permission_overwrites;

		await this.addToRelationship(id);
		await this.#adapter.set(this.hashId(id), data);
	}

	/**
	 * @inheritDoc
	 */

	async items(): Promise<ChannelResource[]> {
		const data = await this.#adapter.items(this.#namespace);

		if (data) {
			return data.map(dt => {
				const resource = new ChannelResource(this.#adapter, dt);
				resource.setParent(resource.id);

				return resource;
			});
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
