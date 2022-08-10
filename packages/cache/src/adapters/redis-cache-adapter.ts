import type { CacheAdapter } from './cache-adapter';

import Redis, { RedisOptions } from 'ioredis';
import IORedis from 'ioredis';

interface BaseOptions {
	namespace: string;
	expire?: number;
}

interface BuildOptions extends BaseOptions, RedisOptions { }

interface ClientOptions extends BaseOptions {
	client: Redis;
}
 
type Options = BuildOptions | ClientOptions;

export class RedisCacheAdapter implements CacheAdapter {
	private static readonly DEFAULTS = {
		namespace: 'biscuitland'
	};

	private readonly client: Redis;

	readonly options: Options;

	constructor(options?: Options) {
		this.options = Object.assign(RedisCacheAdapter.DEFAULTS, options);

		if ((this.options as ClientOptions).client) {
			this.client = (this.options as ClientOptions).client;
		} else {
			const { ...redisOpt } = this.options as BuildOptions;
			this.client = new IORedis(redisOpt);
		}
	}

	/**
	 * @inheritDoc
	 */

	async get(id: string): Promise<any> {
		const data = await this.client.get(this.composite(id));

		if (!data) {
			return null;
		}

		return JSON.parse(data);
	}

	/**
	 * @inheritDoc
	 */

	async set(id: string, data: unknown, expire = this.options.expire): Promise<void> {
		if (expire) {
			await this.client.set(this.composite(id), JSON.stringify(data), 'EX', expire);
		} else {
			await this.client.set(this.composite(id), JSON.stringify(data));
		}
	}

	/**
	 * @inheritDoc
	 */

	async count(_to: string): Promise<number> {
		throw new Error('Method not implemented.');
	}

	/**
	 * @inheritDoc
	 */

	async remove(id: string): Promise<void> {
		await this.client.del(this.composite(id));
	}

	/**
	 * @inheritDoc
	 */

	async contains(_to: string, _id: string): Promise<boolean> {
		throw new Error('Method not implemented.');
	}

	/**
	 * @inheritDoc
	 */

	async getToRelationship(_to: string): Promise<string[]> {
		throw new Error('Method not implemented.');
	}

	/**
	 * @inheritDoc
	 */

	async addToRelationship(_to: string, _id: string): Promise<void> {
		throw new Error('Method not implemented.');
	}

	/**
	 * @inheritDoc
	 */

	async removeToRelationship(_to: string, _id: string): Promise<void> {
		throw new Error('Method not implemented.');
	}

	/**
	 * @inheritDoc
	 */

	composite(id: string): string {		
		return `${this.options.namespace}:${id}`;
	}
}