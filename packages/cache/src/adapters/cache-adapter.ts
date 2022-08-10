export interface CacheAdapter {
	/**
	 * @inheritDoc
	 */

	get(id: string): any | Promise<any>;
	get(id: string, guild?: string): string | Promise<string>;

	/**
	 * @inheritDoc
	 */

	set(id: string, data: any, expire?: number): void | Promise<void>;

	/**
	 * @inheritDoc
	 */

	count(to: string): number | Promise<number>;

	/**
	 * @inheritDoc
	 */

	remove(id: string): void | Promise<void>;

	/**
	 * @inheritDoc
	 */

	contains(to: string, id: string): boolean | Promise<boolean>;

	/**
	 * @inheritDoc
	 */

	getToRelationship(to: string): string[] | Promise<string[]>;

	/**
	 * @inheritDoc
	 */

	addToRelationship(to: string, id: string): void | Promise<void>;

	/**
	 * @inheritDoc
	 */

	removeToRelationship(to: string, id: string): void | Promise<void>;
}
