/**
 * Base class for all adapters
 * All Methods from CacheAdapter are also available on every class extends
 */

export interface CacheAdapter {
	/**
	 * Gets the resource to adapter
	 */

	get(id: string): any | Promise<any>;
	get(id: string, guild: string): string | Promise<string>;

	/**
	 * Sets the resource to adapter
	 */

	set(id: string, data: any): void | Promise<void>;
	set(id: string, guild: string, data: any): void | Promise<void>;

	/**
	 * Get the items of a relationship
	 */

	items(to?: string): any[] | Promise<any[]>;

	/**
	 * Count how many resources there are in the relationships
	 */

	count(to: string): number | Promise<number>;

	/**
	 * Removes the adapter resource
	 */

	remove(id: string): void | Promise<void>;
	remove(id: string, guild: string): void | Promise<void>;

	/**
	 * Check if the resource is in the relationships
	 */

	contains(to: string, id: string): boolean | Promise<boolean>;

	/**
	 * Gets the resource relationships
	 */

	getToRelationship(to: string): string[] | Promise<string[]>;

	/**
	 * Adds the resource to relationships
	 */

	addToRelationship(to: string, id: string): void | Promise<void>;

	/**
	 * Removes the relationship resource
	 */

	removeToRelationship(to: string, id: string): void | Promise<void>;
}
