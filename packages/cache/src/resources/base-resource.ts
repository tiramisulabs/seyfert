/* eslint-disable @typescript-eslint/naming-convention */
import type { CacheAdapter } from '../scheme/adapters/cache-adapter';

/**
 * Base class for all resources
 * All Methods from BaseResource are also available on every class extends
 */

class Base<T> {
	/**
	 * Resource name
	 */

	#namespace = 'base';

	/**
	 * Adapter for storage processes and operations
	 */

	#adapter: CacheAdapter;

	/**
	 * Guild linked and assigned to the current entity (resource)
	 */

	parent?: string;

	/**
	 * Constructor
	 */

	constructor(namespace: string, adapter: CacheAdapter) {
		this.#namespace = namespace;
		this.#adapter = adapter;
	}

	/**
	 * Entity linked
	 */

	setEntity(entity: T): void {
		Object.assign(this, entity);
	}

	/**
	 * Parent linked
	 */

	setParent(parent: string): void {
		// rename
		this.parent = parent;
	}

	/**
	 * Count how many resources there are in the relationships
	 */

	async count(to: string): Promise<number> {
		return await this.#adapter.count(this.hashId(to));
	}

	/**
	 * Check if the resource is in the relationships
	 */

	async contains(
		id: string,
		guild: string = this.parent as string
	): Promise<boolean> {
		return await this.#adapter.contains(this.hashId(guild), id);
	}

	/**
	 * Gets the resource relationships
	 */

	async getToRelationship(
		id: string = this.parent as string
	): Promise<string[]> {
		return await this.#adapter.getToRelationship(this.hashId(id));
	}

	/**
	 * Adds the resource to relationships
	 */

	async addToRelationship(
		id: string,
		guild: string = this.parent as string
	): Promise<void> {
		await this.#adapter.addToRelationship(this.hashId(guild), id);
	}

	/**
	 * Removes the relationship resource
	 */

	async removeToRelationship(
		id: string,
		guild: string = this.parent as string
	): Promise<void> {
		await this.#adapter.removeToRelationship(this.hashId(guild), id);
	}

	/**
	 * Construct an id consisting of namespace.id
	 */

	protected hashId(id: string): string {
		return `${this.#namespace}.${id}`;
	}
}

export const BaseResource = Base as new <T>(
	data: string,
	adapter: CacheAdapter
) => Base<T> & T;
