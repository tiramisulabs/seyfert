import type { Redis, RedisOptions } from 'ioredis';

import { CacheAdapter } from './cache-adapter';
import IORedis from 'ioredis';

export interface BaseOptions {
	prefix?: string;
}

export interface BuildOptions extends BaseOptions, RedisOptions {}

export interface ClientOptions extends BaseOptions {
	client: Redis;
}

export type Options = BuildOptions | ClientOptions;

export class RedisCacheAdapter implements CacheAdapter {
	static readonly DEFAULTS = {
		prefix: 'biscuitland',
	};

	private readonly client: Redis;

	options: Options;

	constructor(options?: Options) {
		this.options = Object.assign(RedisCacheAdapter.DEFAULTS, options);

		if ((this.options as ClientOptions).client) {
			this.client = (this.options as ClientOptions).client;
		} else {
			const { ...redisOpt } = this.options as BuildOptions;
			this.client = new IORedis(redisOpt);
		}
	}

	_getPrefix(name: string) {
		return `${this.options.prefix}:${name}`;
	}

	/**
	 * @inheritDoc
	 */

	async get<T = unknown>(name: string): Promise<T | null> {
		const completKey = this._getPrefix(name);
		const data = await this.client.get(completKey);

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

		const completeKey = this._getPrefix(name);

		await this.client.set(completeKey, stringData);
	}

	/**
	 * @inheritDoc
	 */

	async remove(name: string): Promise<void> {
		const completKey = this._getPrefix(name);
		await this.client.del(completKey);
	}

	/**
	 * @inheritDoc
	 */

	async clear(): Promise<void> {
		this.client.disconnect();
	}

	/**
	 * @inheritDoc
	 */

	async close(): Promise<void> {
		this.client.disconnect();
	}
}
