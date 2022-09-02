import type { CacheAdapter } from '../adapters/cache-adapter';

export class BaseResource {
	namespace = 'base';

	adapter!: CacheAdapter; // replace

	/**
	 * @inheritDoc
	 */

	async count(to: string): Promise<number> {
		return await this.adapter.count(this.hashId(to));
	}

	/**
	 * @inheritDoc
	 */

	async contains(to: string, id: string): Promise<boolean> {
		return await this.adapter.contains(this.hashId(to), id);
	}

	/**
	 * @inheritDoc
	 */

	async getToRelationship(to: string): Promise<string[]> {
		return await this.adapter.getToRelationship(this.hashId(to));
	}

	/**
	 * @inheritDoc
	 */

	async addToRelationship(to: string, id: string): Promise<void> {
		await this.adapter.addToRelationship(this.hashId(to), id);
	}

	/**
	 * @inheritDoc // to-do replace
	 */

	async removeToRelationship(to: string, id: string): Promise<void> {
		await this.adapter.removeToRelationship(this.hashId(to), id);
	}

	/**
	 * @inheritDoc
	 */

	hashId(id: string): string {
		return `${this.namespace}.${id}`;
	}

	/**
	 * @inheritDoc
	 */

	hashGuildId(id: string, guild: string): string {
		return `${this.namespace}.${guild}.${id}`;
	}
}
