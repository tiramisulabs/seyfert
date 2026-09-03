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
	filter<S extends V>(fn: (value: V, key: K, collection: this) => value is S): S[];
	filter(fn: (value: V, key: K, collection: this) => boolean): V[];
	filter(fn: (value: V, key: K, collection: this) => boolean): V[] {
		const result: V[] = [];

		for (const [key, value] of this.entries()) {
			if (fn(value, key, this)) result.push(value);
		}

		return result;
	}

	filterCollection<S extends V>(fn: (value: V, key: K, collection: this) => value is S): Collection<K, S>;
	filterCollection(fn: (value: V, key: K, collection: this) => boolean): Collection<K, V>;
	filterCollection(fn: (value: V, key: K, collection: this) => boolean): Collection<K, V> {
		const result = new Collection<K, V>();

		for (const [key, value] of this.entries()) {
			if (fn(value, key, this)) result.set(key, value);
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
		let result: T;
		if (initialValue !== undefined) {
			result = initialValue;
		} else {
			const first = entries.next();
			if (first.done) throw new TypeError('Reduce of empty collection with no initial value');
			result = first.value[1] as unknown as T;
		}
		for (const [key, value] of entries) {
			result = fn(result, value, key, this);
		}
		return result;
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
	find<S extends V>(fn: (value: V, key: K, collection: this) => value is S): S | undefined;
	find(fn: (value: V, key: K, collection: this) => boolean): V | undefined;
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

export type LimitedCollectionData<V> = { expire: number; expireOn: number; value: V };
type LimitedCollectionExpiration = { expire: number; expireOn: number };
type LimitedCollectionCloser<K> = LimitedCollectionExpiration & { key: K };
type LimitedCollectionExpirationNode<K> = LimitedCollectionCloser<K> & { index: number };
type LimitedCollectionExpirationSchedule =
	| { type: 'immediate'; handle: NodeJS.Immediate }
	| { type: 'timeout'; handle: NodeJS.Timeout };

const expirationBatchSize = 1_024;
const maxTimerDelay = 2_147_483_647;

class LimitedCollectionExpirationQueue<K> {
	private readonly byKey = new Map<K, LimitedCollectionExpirationNode<K>>();
	private readonly heap: LimitedCollectionExpirationNode<K>[] = [];

	get size() {
		return this.byKey.size;
	}

	get first(): LimitedCollectionCloser<K> | undefined {
		return this.heap[0];
	}

	get(key: K): LimitedCollectionExpiration | undefined {
		return this.byKey.get(key);
	}

	set(key: K, expire: number, expireOn: number) {
		const expiration = this.byKey.get(key);
		if (expiration) {
			const previousExpireOn = expiration.expireOn;
			expiration.expire = expire;
			expiration.expireOn = expireOn;
			this._rebalance(expiration, previousExpireOn);
			return;
		}

		const node = { key, expire, expireOn, index: this.heap.length };
		this.byKey.set(key, node);
		this.heap.push(node);
		this._siftUp(node.index);
	}

	refresh(key: K, expireOn: number) {
		const expiration = this.byKey.get(key);
		if (!expiration) return false;
		const wasFirst = expiration.index === 0;
		const previousExpireOn = expiration.expireOn;
		expiration.expireOn = expireOn;
		this._rebalance(expiration, previousExpireOn);
		return wasFirst && previousExpireOn !== expireOn;
	}

	delete(key: K) {
		const expiration = this.byKey.get(key);
		if (!expiration) return false;
		const index = expiration.index;
		const last = this.heap.pop()!;
		this.byKey.delete(key);
		if (index < this.heap.length) {
			this.heap[index] = last;
			last.index = index;
			const parent = Math.floor((index - 1) / 2);
			if (index > 0 && this._compare(last, this.heap[parent]!) < 0) this._siftUp(index);
			else this._siftDown(index);
		}
		return true;
	}

	private _compare(left: LimitedCollectionExpirationNode<K>, right: LimitedCollectionExpirationNode<K>) {
		return left.expireOn - right.expireOn;
	}

	private _swap(left: number, right: number) {
		const value = this.heap[left]!;
		this.heap[left] = this.heap[right]!;
		this.heap[right] = value;
		this.heap[left]!.index = left;
		value.index = right;
	}

	private _siftUp(index: number) {
		while (index > 0) {
			const parent = Math.floor((index - 1) / 2);
			if (this._compare(this.heap[index]!, this.heap[parent]!) >= 0) break;
			this._swap(index, parent);
			index = parent;
		}
	}

	private _siftDown(index: number) {
		while (true) {
			const left = index * 2 + 1;
			const right = left + 1;
			let smallest = index;
			if (left < this.heap.length && this._compare(this.heap[left]!, this.heap[smallest]!) < 0) smallest = left;
			if (right < this.heap.length && this._compare(this.heap[right]!, this.heap[smallest]!) < 0) smallest = right;
			if (smallest === index) break;
			this._swap(index, smallest);
			index = smallest;
		}
	}

	private _rebalance(expiration: LimitedCollectionExpirationNode<K>, previousExpireOn: number) {
		if (expiration.expireOn < previousExpireOn) this._siftUp(expiration.index);
		else if (expiration.expireOn > previousExpireOn) this._siftDown(expiration.index);
	}
}

function validateLimitedCollectionExpiration(expire: number) {
	if (Number.isNaN(expire)) throw new TypeError('LimitedCollection expiration cannot be NaN');
	if (Number.isFinite(expire) && expire > maxTimerDelay)
		throw new RangeError('LimitedCollection expiration cannot exceed the maximum timer delay');
}

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

	private readonly data = new Map<K, V>();
	private expirations: LimitedCollectionExpirationQueue<K> | undefined;

	private readonly options: LimitedCollectionOptions<K, V>;
	private expirationSchedule: LimitedCollectionExpirationSchedule | undefined;

	constructor(options: Partial<LimitedCollectionOptions<K, V>> = {}) {
		this.options = MergeOptions(LimitedCollection.default, options);
		if (Number.isNaN(this.options.limit)) throw new TypeError('LimitedCollection limit cannot be NaN');
		validateLimitedCollectionExpiration(this.options.expire);
	}

	/**
	 * Adds an element to the limited collection.
	 * @param key The key of the element.
	 * @param value The value of the element.
	 * @param customExpire The custom expiration time for the element.
	 * @returns Whether the configured limit accepted the entry. Reentrant mutations from `onDelete` do not change this result.
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
			return false;
		}
		const retained = this.options.limit >= 1;
		validateLimitedCollectionExpiration(customExpire);

		const expireOn = Number.isFinite(customExpire) && customExpire > 0 ? Date.now() + customExpire : -1;
		if (expireOn === -1 && !this.expirations) {
			this.data.set(key, value);
			if (this.size > this.options.limit) {
				const iter = this.data.keys();
				while (this.size > this.options.limit) {
					const keyValue = iter.next().value!;
					this.delete(keyValue);
				}
			}
			return retained;
		}

		const previousCloser = this.expirations?.first;
		const previousExpireOn = previousCloser?.expireOn;
		this.data.set(key, value);

		if (expireOn !== -1) {
			(this.expirations ??= new LimitedCollectionExpirationQueue()).set(key, customExpire, expireOn);
		} else {
			this._removeExpiration(key);
		}

		try {
			if (this.size > this.options.limit) {
				const iter = this.data.keys();
				while (this.size > this.options.limit) {
					const keyValue = iter.next().value!;
					this.delete(keyValue);
				}
			}
		} finally {
			const closer = this.expirations?.first;
			if (previousCloser !== closer || previousExpireOn !== closer?.expireOn) {
				this.rescheduleExpiration();
			}
		}
		return retained;
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
		const value = this.data.get(key);
		if (value === undefined && !this.data.has(key)) {
			return;
		}
		const resolvedValue = value as V;

		if (!this.expirations) {
			return {
				value: resolvedValue,
				expire: -1,
				expireOn: -1,
			};
		}

		const expiration = this.expirations.get(key);
		return {
			value: resolvedValue,
			expire: expiration?.expire ?? -1,
			expireOn: expiration?.expireOn ?? -1,
		};
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
		const value = this.data.get(key);
		if (value === undefined && !this.data.has(key)) {
			return;
		}

		const expirations = this.expirations;
		if (!this.options.resetOnDemand || !expirations) {
			return value;
		}

		const expiration = expirations.get(key);
		if (expiration && expirations.refresh(key, Date.now() + expiration.expire)) this.rescheduleExpiration();
		return value;
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
		return this._delete(key);
	}

	private _delete(key: K, reschedule = true) {
		const value = this.data.get(key);
		if (value === undefined && !this.data.has(key)) {
			return false;
		}
		const resolvedValue = value as V;
		if (!this.expirations) {
			this.options.onDelete?.(key, resolvedValue);
			return this.data.delete(key);
		}

		const previousCloser = this.expirations.first;
		const previousExpireOn = previousCloser?.expireOn;

		this.options.onDelete?.(key, resolvedValue);
		const result = this.data.delete(key);
		this._removeExpiration(key);
		const closer = this.expirations?.first;
		if (reschedule && (previousCloser !== closer || previousExpireOn !== closer?.expireOn)) {
			this.rescheduleExpiration();
		}
		return result;
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
		const closer = this.expirations?.first;
		if (!closer) {
			return;
		}

		const value = this.data.get(closer.key);
		if (value === undefined && !this.data.has(closer.key)) {
			return;
		}
		return {
			value: value as V,
			expire: closer.expire,
			expireOn: closer.expireOn,
		};
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

	private rescheduleExpiration() {
		this.cancelExpiration();
		this.scheduleExpiration();
	}

	private cancelExpiration() {
		const schedule = this.expirationSchedule;
		if (!schedule) return;
		if (schedule.type === 'immediate') clearImmediate(schedule.handle);
		else clearTimeout(schedule.handle);
		this.expirationSchedule = undefined;
	}

	private scheduleExpiration() {
		const closer = this.expirations?.first;
		if (!closer) {
			return;
		}
		const delay = Math.max(0, Math.min(maxTimerDelay, closer.expireOn - Date.now()));
		const drain = () => {
			this.expirationSchedule = undefined;
			try {
				this.drainExpired(expirationBatchSize);
			} finally {
				this.rescheduleExpiration();
			}
		};
		this.expirationSchedule =
			delay === 0 && typeof setImmediate === 'function'
				? { type: 'immediate', handle: setImmediate(drain) }
				: { type: 'timeout', handle: setTimeout(drain, delay) };
	}

	keys() {
		return this.data.keys();
	}

	values(): IterableIterator<V> {
		return this.data.values();
	}

	rawValues(): IterableIterator<LimitedCollectionData<V>> {
		return (function* (self: LimitedCollection<K, V>) {
			for (const key of self.data.keys()) {
				yield self.raw(key)!;
			}
		})(this);
	}

	entries(): IterableIterator<[K, V]> {
		return this.data.entries();
	}

	rawEntries(): IterableIterator<[K, LimitedCollectionData<V>]> {
		return (function* (self: LimitedCollection<K, V>) {
			for (const key of self.data.keys()) {
				yield [key, self.raw(key)!] as [K, LimitedCollectionData<V>];
			}
		})(this);
	}

	[Symbol.iterator]() {
		return this.entries();
	}

	clear() {
		this.cancelExpiration();
		this.data.clear();
		this.expirations = undefined;
	}

	private drainExpired(limit: number) {
		let deleted = 0;
		const now = Date.now();
		while (deleted < limit) {
			const expiration = this.expirations?.first;
			if (!expiration || now < expiration.expireOn) break;
			const expireOn = expiration.expireOn;
			try {
				this._delete(expiration.key, false);
			} catch (error) {
				if (this.expirations?.get(expiration.key)?.expireOn === expireOn) this._removeExpiration(expiration.key);
				throw error;
			}
			deleted++;
		}
	}

	private _removeExpiration(key: K) {
		const expirations = this.expirations;
		if (!expirations) return;
		expirations.delete(key);
		if (expirations.size === 0) this.expirations = undefined;
	}
}
