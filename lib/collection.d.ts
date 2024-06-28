/**
 * Represents a collection that extends the built-in Map class.
 * @template K The type of the keys in the collection.
 * @template V The type of the values in the collection.
 */
export declare class Collection<K, V> extends Map<K, V> {
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
    sweep(fn: (value: V, key: K, collection: this) => unknown): number;
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
    map<T = any>(fn: (value: V, key: K, collection: this) => T): T[];
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
    filter(fn: (value: V, key: K, collection: this) => boolean): V[];
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
    reduce<T = any>(fn: (accumulator: T, value: V, key: K, collection: this) => T, initialValue?: T): T;
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
    every(fn: (value: V, key: K, collection: this) => boolean): boolean;
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
    some(fn: (value: V, key: K, collection: this) => boolean): boolean;
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
    find(fn: (value: V, key: K, collection: this) => boolean): V | undefined;
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
    findKey(fn: (value: V, key: K, collection: this) => boolean): K | undefined;
}
type LimitedCollectionData<V> = {
    expire: number;
    expireOn: number;
    value: V;
};
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
export declare class LimitedCollection<K, V> {
    static readonly default: LimitedCollectionOptions<any, any>;
    private readonly data;
    private readonly options;
    private timeout;
    constructor(options?: Partial<LimitedCollectionOptions<K, V>>);
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
    set(key: K, value: V, customExpire?: number): void;
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
    raw(key: K): LimitedCollectionData<V> | undefined;
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
    get(key: K): V | undefined;
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
    has(key: K): boolean;
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
    delete(key: K): boolean;
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
    get closer(): LimitedCollectionData<V> | undefined;
    /**
     * Returns the number of elements in the limited collection.
     * @returns The number of elements in the collection.
     * @example
     * const collection = new LimitedCollection<number, string>();
     * collection.set(1, 'one');
     * collection.set(2, 'two');
     * console.log(collection.size); // Output: 2
     */
    get size(): number;
    private resetTimeout;
    private stopTimeout;
    private startTimeout;
    keys(): IterableIterator<K>;
    values(): IterableIterator<LimitedCollectionData<V>>;
    entries(): IterableIterator<[K, LimitedCollectionData<V>]>;
    clear(): void;
    private clearExpired;
}
export {};
