import { CacheAdapter } from './cache-adapter';

export class MemoryCacheAdapter implements CacheAdapter {
	/**
	 * @inheritDoc
	 */

	private readonly data = new Map<string, any>();

	/**
	 * @inheritDoc
	 */

	async get<T = unknown>(name: string): Promise<T | null> {
		const data = this.data.get(name);

		if (!data) {
			return null;
		}

		return JSON.parse(data);
	}

	/**
	 * @inheritDoc
	 */

	async set(name: string, data: unknown): Promise<void> {
		const stringData = JSON.stringify(data, (_, v) =>
			typeof v === 'bigint' ? v.toString() : v
		);

		this.data.set(name, stringData);
	}

	/**
	 * @inheritDoc
	 */

	async remove(name: string): Promise<void> {
		this.data.delete(name);
	}

	/**
	 * @inheritDoc
	 */

	async clear(): Promise<void> {
		this.data.clear();
	}
}
