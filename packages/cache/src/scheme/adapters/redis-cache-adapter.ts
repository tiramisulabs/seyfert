/**
 * refactor
 */

import type { CacheAdapter } from './cache-adapter';

import type { RedisOptions } from 'ioredis';
import type Redis from 'ioredis';
import IORedis from 'ioredis';

interface BaseOptions {
	namespace: string;
	expire?: number;
}

interface BuildOptions extends BaseOptions, RedisOptions {}

interface ClientOptions extends BaseOptions {
	client: Redis;
}

type Options = BuildOptions | ClientOptions;

export class RedisCacheAdapter implements CacheAdapter {
	static readonly DEFAULTS = {
		namespace: 'biscuitland',
	};

	readonly options: Options;

	readonly client: Redis;

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
		const data = await this.client.get(this.build(id));

		if (!data) {
			return null;
		}

		return JSON.parse(data);
	}

	/**
	 * @inheritDoc
	 */

	async set(id: string, data: unknown): Promise<void> {
		const expire = this.options.expire;

		if (expire) {
			await this.client.set(
				this.build(id),
				JSON.stringify(data),
				'EX',
				expire
			);
		} else {
			await this.client.set(this.build(id), JSON.stringify(data));
		}
	}

	/**
	 * @inheritDoc
	 */

	async items(to: string): Promise<any[]> {
		const array: unknown[] = [];

		let data = await this.getToRelationship(to);
		data = data.map(id => this.build(`${to}.${id}`));

		if (data && data.length > 0) {
			const items = await this.client.mget(data);

			for (const item of items) {
				if (item) {
					array.push(JSON.parse(item));
				}
			}
		}

		return array;
	}

	/**
	 * @inheritDoc
	 */

	async count(to: string): Promise<number> {
		return new Promise((resolve, reject) => {
			this.client.scard(this.build(to), (err, result) => {
				if (err) {
					return reject(err);
				}

				return resolve(result || 0);
			});
		});
	}

	/**
	 * @inheritDoc
	 */

	async remove(id: string): Promise<void> {
		await this.client.del(this.build(id));
	}

	/**
	 * @inheritDoc
	 */

	async contains(to: string, id: string): Promise<boolean> {
		return new Promise((resolve, reject) => {
			this.client.sismember(this.build(to), id, (err, result) => {
				if (err) {
					return reject(err);
				}

				return resolve(result === 1);
			});
		});
	}

	/**
	 * @inheritDoc
	 */

	async getToRelationship(to: string): Promise<string[]> {
		return new Promise((resolve, reject) => {
			this.client.smembers(this.build(to), (err, result) => {
				if (err) {
					reject(err);
				}

				resolve(result || []);
			});
		});
	}

	/**
	 * @inheritDoc
	 */

	async addToRelationship(to: string, id: string): Promise<void> {
		return new Promise((resolve, reject) => {
			this.client.sadd(this.build(to), id, err => {
				if (err) {
					reject(err);
				}

				resolve();
			});
		});
	}

	/**
	 * @inheritDoc
	 */

	async removeToRelationship(to: string, id: string): Promise<void> {
		return new Promise((resolve, reject) => {
			this.client.srem(this.build(to), id, err => {
				if (err) {
					reject(err);
				}

				resolve();
			});
		});
	}

	/**
	 * @inheritDoc
	 */

	protected build(id: string): string {
		return `${this.options.namespace}:${id}`;
	}
}
