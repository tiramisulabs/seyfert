import { MergeOptions } from './common';

/**
 * Represents a collection that extends the built-in Map class.
 * @template K The type of the keys in the collection.
 * @template V The type of the values in the collection.
 */
export class Collection<K, V> extends Map<K, V> {
	/**
	 * Removes elements from the collection based on a filter function.
	 * @param fn The filter function that determines which elements to remove.
	 * @param thisArg The value to use as `this` when executing the filter function.
	 * @returns The number of elements removed from the collection.
	 * @example
	 * const collection = new Collection<number, string>();
	 * collection.set(1, 'one');
	 * collection.set(2, 'two');
	 * collection.set(3, 'three');
	 * const removedCount = collection.sweep((value, key) => key % 2 === 0);
	 * console.log(removedCount); // Output: 1
	 * console.log(collection.size); // Output: 2
	 */
	sweep(fn: (value: V, key: K, collection: this) => unknown): number {
		const previous = this.size;
		for (const [key, val] of this) {
			if (fn(val, key, this)) this.delete(key);
		}
		return previous - this.size;
	}

	/**
	 * Creates a new array with the results of calling a provided function on every element in the collection.
	 * @param fn The function that produces an element of the new array.
	 * @param thisArg The value to use as `this` when executing the map function.
	 * @returns A new array with the results of calling the provided function on every element in the collection.
	 * @example
	 * const collection = new Collection<number, string>();
	 * collection.set(1, 'one');
	 * collection.set(2, 'two');
	 * collection.set(3, 'three');
	 * const mappedArray = collection.map((value, key) => `${key}: ${value}`);
	 * console.log(mappedArray); // Output: ['1: one', '2: two', '3: three']
	 */
	map<T = any>(fn: (value: V, key: K, collection: this) => T): T[] {
		const result: T[] = [];

		for (const [key, value] of this.entries()) {
			result.push(fn(value, key, this));
		}

		return result;
	}

	/**
	 * Creates a new array with all elements that pass the test implemented by the provided function.
	 * @param fn The function to test each element of the collection.
	 * @param thisArg The value to use as `this` when executing the filter function.
	 * @returns A new array with the elements that pass the test.
	 * @example
	 * const collection = new Collection<number, string>();
	 * collection.set(1, 'one');
	 * collection.set(2, 'two');
	 * collection.set(3, 'three');
	 * const filteredArray = collection.filter((value, key) => key % 2 === 0);
	 * console.log(filteredArray); // Output: ['two']
	 */
	filter(fn: (value: V, key: K, collection: this) => boolean): V[] {
		const result: V[] = [];

		for (const [key, value] of this.entries()) {
			if (fn(value, key, this)) result.push(value);
		}

		return result;
	}

	/**
	 * Apply a function against an accumulator and each element in the collection (from left to right) to reduce it to a single value.
	 * @param fn The function to execute on each element in the collection.
	 * @param initialValue The initial value of the accumulator.
	 * @returns The value that results from the reduction.
	 * @example
	 * const collection = new Collection<number, number>();
	 * collection.set(1, 1);
	 * collection.set(2, 2);
	 * collection.set(3, 3);
	 * const sum = collection.reduce((acc, value) => acc + value, 0);
	 * console.log(sum); // Output: 6
	 */
	reduce<T = any>(fn: (accumulator: T, value: V, key: K, collection: this) => T, initialValue?: T): T {
		const entries = this.entries();
		const first = entries.next().value as [K, V];
		let result = initialValue;

		if (result !== undefined) {
			result = fn(result, first[1], first[0], this);
		} else {
			result = first[1] as unknown as T;
		}

		for (const [key, value] of entries) {
			result = fn(result, value, key, this);
		}

		return result as T;
	}

	/**
	 * Checks if all elements in the collection pass a test implemented by the provided function.
	 * @param fn The function to test each element of the collection.
	 * @returns `true` if all elements pass the test, otherwise `false`.
	 * @example
	 * const collection = new Collection<number, number>();
	 * collection.set(1, 1);
	 * collection.set(2, 2);
	 * collection.set(3, 3);
	 * const allGreaterThanZero = collection.every(value => value > 0);
	 * console.log(allGreaterThanZero); // Output: true
	 */
	every(fn: (value: V, key: K, collection: this) => boolean): boolean {
		for (const [key, value] of this.entries()) {
			if (!fn(value, key, this)) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Checks if at least one element in the collection passes a test implemented by the provided function.
	 * @param fn The function to test each element of the collection.
	 * @returns `true` if at least one element passes the test, otherwise `false`.
	 * @example
	 * const collection = new Collection<number, number>();
	 * collection.set(1, 1);
	 * collection.set(2, 2);
	 * collection.set(3, 3);
	 * const hasEvenValue = collection.some(value => value % 2 === 0);
	 * console.log(hasEvenValue); // Output: true
	 */
	some(fn: (value: V, key: K, collection: this) => boolean): boolean {
		for (const [key, value] of this.entries()) {
			if (fn(value, key, this)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Returns the value of the first element in the collection that satisfies the provided testing function.
	 * @param fn The function to test each element of the collection.
	 * @returns The value of the first element that passes the test. `undefined` if no element passes the test.
	 * @example
	 * const collection = new Collection<number, number>();
	 * collection.set(1, 1);
	 * collection.set(2, 2);
	 * collection.set(3, 3);
	 * const firstEvenValue = collection.find(value => value % 2 === 0);
	 * console.log(firstEvenValue); // Output: 2
	 */
	find(fn: (value: V, key: K, collection: this) => boolean): V | undefined {
		for (const [key, value] of this.entries()) {
			if (fn(value, key, this)) {
				return value;
			}
		}
		return undefined;
	}

	/**
	 * Returns the first key in the collection that satisfies the provided testing function.
	 * @param fn The function to test each element of the collection.
	 * @returns The first key that passes the test. `undefined` if no element passes the test.
	 * @example
	 * const collection = new Collection<number, number>();
	 * collection.set(1, 1);
	 * collection.set(2, 2);
	 * collection.set(3, 3);
	 * const firstEvenKey = collection.findKey(value => value % 2 === 0);
	 * console.log(firstEvenKey); // Output: 2
	 */
	findKey(fn: (value: V, key: K, collection: this) => boolean): K | undefined {
		for (const [key, value] of this.entries()) {
			if (fn(value, key, this)) {
				return key;
			}
		}
		return undefined;
	}
}

type LimitedCollectionData<V> = { expire: number; expireOn: number; value: V };

export interface LimitedCollectionOptions<K, V> {
	limit: number;
	expire: number;
	onDelete?: (key: K, value: V) => void;
	resetOnDemand: boolean;
}

/**
 * Creates a new array with the results of calling a provided function on every element in the collection.
 * @param fn The function that produces an element of the new array.
 * @param thisArg The value to use as `this` when executing the map function.
 * @returns A new array with the results of calling the provided function on every element in the collection.
 * @example
 * const collection = new Collection<number, string>();
 * collection.set(1, 'one');
 * collection.set(2, 'two');
 * collection.set(3, 'three');
 * const mappedArray = collection.map((value, key) => `${key}: ${value}`);
 * console.log(mappedArray); // Output: ['1: one', '2: two', '3: three']
 */
export class LimitedCollection<K, V> {
	static readonly default: LimitedCollectionOptions<any, any> = {
		resetOnDemand: false,
		limit: Number.POSITIVE_INFINITY,
		expire: 0,
	};

	private readonly data = new Map<K, LimitedCollectionData<V>>();

	private readonly options: LimitedCollectionOptions<K, V>;
	private timeout: NodeJS.Timeout | undefined = undefined;

	constructor(options: Partial<LimitedCollectionOptions<K, V>> = {}) {
		this.options = MergeOptions(LimitedCollection.default, options);
	}

	/**
	 * Adds an element to the limited collection.
	 * @param key The key of the element.
	 * @param value The value of the element.
	 * @param customExpire The custom expiration time for the element.
	 * @example
	 * const collection = new LimitedCollection<number, string>({ limit: 3 });
	 * collection.set(1, 'one');
	 * collection.set(2, 'two');
	 * collection.set(3, 'three');
	 * console.log(collection.size); // Output: 3
	 * collection.set(4, 'four');
	 * console.log(collection.size); // Output: 3
	 * console.log(collection.get(1)); // Output: undefined
	 */
	set(key: K, value: V, customExpire = this.options.expire) {
		if (this.options.limit <= 0) {
			return;
		}

		const expireOn = Date.now() + customExpire;
		this.data.set(
			key,
			customExpire > 0 ? { value, expire: customExpire, expireOn } : { value, expire: -1, expireOn: -1 },
		);

		if (this.size > this.options.limit) {
			const iter = this.data.keys();
			while (this.size > this.options.limit) {
				const keyValue = iter.next().value;
				this.delete(keyValue);
			}
		}

		if (this.closer?.expireOn === expireOn) {
			this.resetTimeout();
		}
	}

	/**
	 * Returns the raw data of an element in the limited collection.
	 * @param key The key of the element.
	 * @returns The raw data of the element, or `undefined` if the element does not exist.
	 * @example
	 * const collection = new LimitedCollection<number, string>();
	 * collection.set(1, 'one');
	 * const rawData = collection.raw(1);
	 * console.log(rawData); // Output: { value: 'one', expire: -1, expireOn: -1 }
	 */
	raw(key: K) {
		return this.data.get(key);
	}

	/**
	 * Returns the value of an element in the limited collection.
	 * @param key The key of the element.
	 * @returns The value of the element, or `undefined` if the element does not exist.
	 * @example
	 * const collection = new LimitedCollection<number, string>();
	 * collection.set(1, 'one');
	 * const value = collection.get(1);
	 * console.log(value); // Output: 'one'
	 */
	get(key: K) {
		const data = this.data.get(key);
		if (this.options.resetOnDemand && data && data.expire !== -1) {
			const oldExpireOn = data.expireOn;
			data.expireOn = Date.now() + data.expire;
			if (this.closer?.expireOn === oldExpireOn) {
				this.resetTimeout();
			}
		}
		return data?.value;
	}

	/**
	 * Checks if an element exists in the limited collection.
	 * @param key The key of the element.
	 * @returns `true` if the element exists, `false` otherwise.
	 * @example
	 * const collection = new LimitedCollection<number, string>();
	 * collection.set(1, 'one');
	 * console.log(collection.has(1)); // Output: true
	 * console.log(collection.has(2)); // Output: false
	 */
	has(key: K) {
		return this.data.has(key);
	}

	/**
	 * Removes an element from the limited collection.
	 * @param key The key of the element to remove.
	 * @returns `true` if the element was removed, `false` otherwise.
	 * @example
	 * const collection = new LimitedCollection<number, string>();
	 * collection.set(1, 'one');
	 * console.log(collection.delete(1)); // Output: true
	 * console.log(collection.delete(2)); // Output: false
	 */
	delete(key: K) {
		const value = this.raw(key);
		if (value) {
			if (value.expireOn === this.closer?.expireOn) setImmediate(() => this.resetTimeout());
			this.options.onDelete?.(key, value.value);
		}
		return this.data.delete(key);
	}

	/**
	 * Returns the element in the limited collection that is closest to expiration.
	 * @returns The element that is closest to expiration, or `undefined` if the collection is empty.
	 * @example
	 * const collection = new LimitedCollection<number, string>();
	 * collection.set(1, 'one', 1000);
	 * collection.set(2, 'two', 2000);
	 * collection.set(3, 'three', 500);
	 * const closestElement = collection.closer;
	 * console.log(closestElement); // Output: { value: 'three', expire: 500, expireOn: [current timestamp + 500] }
	 */
	get closer() {
		let d: LimitedCollectionData<V> | undefined;
		for (const value of this.data.values()) {
			if (value.expire === -1) {
				continue;
			}
			if (!d) {
				d = value;
				continue;
			}
			if (d.expireOn > value.expireOn) {
				d = value;
			}
		}
		return d;
	}

	/**
	 * Returns the number of elements in the limited collection.
	 * @returns The number of elements in the collection.
	 * @example
	 * const collection = new LimitedCollection<number, string>();
	 * collection.set(1, 'one');
	 * collection.set(2, 'two');
	 * console.log(collection.size); // Output: 2
	 */
	get size() {
		return this.data.size;
	}

	private resetTimeout() {
		this.stopTimeout();
		this.startTimeout();
	}

	private stopTimeout() {
		clearTimeout(this.timeout);
		this.timeout = undefined;
	}

	private startTimeout() {
		const { expireOn, expire } = this.closer || { expire: -1, expireOn: -1 };
		if (expire === -1) {
			return;
		}
		if (this.timeout) {
			this.stopTimeout();
		}
		this.timeout = setTimeout(() => {
			this.clearExpired();
			this.resetTimeout();
		}, expireOn - Date.now());
	}

	keys() {
		return this.data.keys();
	}

	values() {
		return this.data.values();
	}

	entries() {
		return this.data.entries();
	}

	clear() {
		this.data.clear();
		this.resetTimeout();
	}

	private clearExpired() {
		for (const [key, value] of this.data) {
			if (value.expireOn === -1) {
				continue;
			}
			if (Date.now() >= value.expireOn) {
				this.options.onDelete?.(key, value.value);
				this.data.delete(key);
			}
		}
	}
}
