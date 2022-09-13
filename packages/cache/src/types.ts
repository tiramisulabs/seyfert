import type { Cache } from './cache';
import type { CacheAdapter } from './scheme/adapters/cache-adapter';

import type { MemoryCacheAdapter } from './scheme/adapters/memory-cache-adapter';

//

export type CacheOptions = Pick<
	CO,
	Exclude<keyof CO, keyof typeof Cache.DEFAULTS>
> &
	Partial<CO>;

export interface CO {
	/**
	 * Adapter to be used for storing resources
	 * @default MemoryCacheAdapter
	 */

	adapter: CacheAdapter;
}

//

export type MemoryOptions = Pick<
	MO,
	Exclude<keyof MO, keyof typeof MemoryCacheAdapter.DEFAULTS>
> &
	Partial<MO>;

export interface MO {
	/**
	 * Time the resource will be stored
	 * @default 3600000
	 */

	expire: number;
}

//

export type RedisOptions = Pick<
	RO,
	Exclude<keyof RO, keyof typeof MemoryCacheAdapter.DEFAULTS>
> &
	Partial<RO>;

export interface RO {
	/**
	 * Time the resource will be stored
	 * @default 300
	 */

	expire: number;
}
