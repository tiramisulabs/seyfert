/**
 * refactor
 */

import type { CacheAdapter } from '../scheme/adapters/cache-adapter';
import type { DiscordVoiceState } from '@biscuitland/api-types';

import { BaseResource } from './base-resource';

/**
 * Resource represented by an voice state of discord
 */

export class GuildVoiceResource extends BaseResource<DiscordVoiceState> {
	#namespace = 'voice' as const;

	#adapter: CacheAdapter;

	constructor(
		adapter: CacheAdapter,
		entity?: DiscordVoiceState | null,
		parent?: string
	) {
		super('voice', adapter);

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
	): Promise<GuildVoiceResource | null> {
		if (this.parent) {
			return this;
		}

		const kv = await this.#adapter.get(this.hashGuildId(id, guild));

		if (kv) {
			return new GuildVoiceResource(this.#adapter, kv, guild);
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
		if (!data.guild_id) {
			data.guild_id = guild;
		}

		delete data.member;

		if (this.parent) {
			this.setEntity(data);
		}

		await this.addToRelationship(id, guild);
		await this.#adapter.set(this.hashGuildId(id, guild), data);
	}

	/**
	 * @inheritDoc
	 */

	async items(to: string): Promise<GuildVoiceResource[]> {
		if (!to && this.parent) {
			to = this.parent;
		}

		const data = await this.#adapter.items(this.hashId(to));

		if (data) {
			return data.map(dt => {
				const resource = new GuildVoiceResource(this.#adapter, dt);
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
