/**
 * refactor
 */

import type { CacheAdapter } from './cache-adapter';
import type { MemoryOptions, MO } from '../../types';

import { Options } from '../../utils/options';

export class MemoryCacheAdapter implements CacheAdapter {
	static readonly DEFAULTS = {
		expire: 3600000,
	};

	readonly relationships = new Map<string, string[]>();
	readonly storage = new Map<string, { data: any; expire?: number }>();

	readonly options: MO;

	constructor(options?: MemoryOptions) {
		this.options = Options({}, MemoryCacheAdapter.DEFAULTS, options);
	}

	/**
	 * @inheritDoc
	 */

	get<T = any>(id: string): T | null {
		const data = this.storage.get(id);

		if (data) {
			if (data.expire && data.expire < Date.now()) {
				this.storage.delete(id);
			} else {
				return JSON.parse(data.data);
			}
		}

		return null;
	}

	/**
	 * @inheritDoc
	 */

	set(id: string, data: any): void {
		const expire = this.options.expire;

		if (expire) {
			this.storage.set(id, {
				data: JSON.stringify(data),
				expire: Date.now() + expire,
			});
		} else {
			this.storage.set(id, { data: JSON.stringify(data) });
		}
	}

	/**
	 * @inheritDoc
	 */

	items(to: string): any[] {
		const array: unknown[] = [];
		let data = this.getToRelationship(to);

		data = data.map(id => `${to}.${id}`);

		for (const key of data) {
			const content = this.get(key);

			if (content) {
				array.push(content);
			}
		}

		return array;
	}

	/**
	 * @inheritDoc
	 */

	count(to: string): number {
		return this.getToRelationship(to).length;
	}

	/**
	 * @inheritDoc
	 */

	remove(id: string): void {
		this.storage.delete(id);
	}

	/**
	 * @inheritDoc
	 */

	contains(to: string, id: string): boolean {
		return this.getToRelationship(to).includes(id);
	}

	/**
	 * @inheritDoc
	 */

	getToRelationship(to: string): string[] {
		return this.relationships.get(to) || [];
	}

	/**
	 * @inheritDoc
	 */

	addToRelationship(to: string, id: string): void {
		const data = this.getToRelationship(to);

		if (data.includes(id)) {
			return;
		}

		data.push(id);

		const has = !!this.relationships.get(to);

		if (!has) {
			this.relationships.set(to, data);
		}
	}

	/**
	 * @inheritDoc
	 */

	removeToRelationship(to: string, id: string): void {
		const data = this.getToRelationship(to);

		if (data) {
			const idx = data.indexOf(id);

			if (idx === -1) {
				return;
			}

			data.splice(idx, 1);
		}
	}
}
