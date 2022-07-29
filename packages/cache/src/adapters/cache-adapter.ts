export interface CacheAdapter {
	/**
	 * @inheritDoc
	 */

	get<T = unknown>(name: string): Promise<T | unknown>;

	/**
	 * @inheritDoc
	 */

	set(name: string, data: unknown): Promise<void>;

	/**
	 * @inheritDoc
	 */

	remove(name: string): Promise<void>;

	/**
	 * @inheritDoc
	 */

	clear(): Promise<void>;

	/**
	 * @inheritDoc
	 */

	close?(): Promise<void>;
}
