import type { Session, Snowflake } from './deps.ts';

export class Collection<V> extends Map<Snowflake, V> {
    constructor(session: Session, entries?: Iterable<readonly [Snowflake, V]>) {
        super(entries);
        this.session = session;
    }

    readonly session: Session;

    get(key: Snowflake): V | undefined {
        return super.get(key);
    }

    set(key: Snowflake, value: V): this {
        return super.set(key, value);
    }

    has(key: Snowflake): boolean {
        return super.has(key);
    }

    clear(): void {
        return super.clear();
    }

    random(): V | undefined;
    random(amount: number): V[];
    random(amount?: number): V | V[] | undefined {
        const arr = [...this.values()];
        if (typeof amount === 'undefined') return arr[Math.floor(Math.random() * arr.length)];
        if (!arr.length) return [];
        if (amount && amount > arr.length) amount = arr.length;
        return Array.from(
            { length: Math.min(amount, arr.length) },
            (): V => arr.splice(Math.floor(Math.random() * arr.length), 1)[0],
        );
    }

    find(fn: (value: V, key: Snowflake, structCache: this) => boolean): V | undefined {
        for (const [key, value] of this.entries()) {
            if (fn(value, key, this)) return value;
        }
        return undefined;
    }

    filter(fn: (value: V, key: Snowflake, structCache: this) => boolean): Collection<V> {
        const result = new Collection<V>(this.session);

        for (const [key, value] of this.entries()) {
            if (fn(value, key, this)) result.set(key, value);
        }

        return result;
    }

    forEach<T>(fn: (value: V, key: Snowflake, structCache: this) => T): void {
        super.forEach((v: V, k: Snowflake) => {
            fn(v, k, this);
        });
    }

    clone(): Collection<V> {
        return new Collection(this.session, this.entries());
    }

    concat(structures: Collection<V>[]): Collection<V> {
        const conc = this.clone();

        for (const structure of structures) {
            if (!structure || !(structure instanceof Collection)) {
                continue;
            }

            for (const [key, value] of structure.entries()) {
                conc.set(key, value);
            }
        }
        return conc;
    }

    some(fn: (value: V, key: Snowflake, structCache: this) => boolean): boolean {
        for (const [key, value] of this.entries()) {
            if (fn(value, key, this)) {
                return true;
            }
        }
        return false;
    }

    every(fn: (value: V, key: Snowflake, structCache: this) => boolean): boolean {
        for (const [key, value] of this.entries()) {
            if (!fn(value, key, this)) {
                return false;
            }
        }
        return true;
    }

    first(): V | undefined;
    first(amount: number): V[];
    first(amount?: number): V | V[] | undefined {
        if (!amount || amount <= 1) {
            return this.values().next().value;
        }
        const values = [...this.values()];
        amount = Math.min(values.length, amount);
        return values.slice(0, amount);
    }

    last(): V | undefined;
    last(amount: number): V[];
    last(amount?: number): V | V[] | undefined {
        const values = [...this.values()];
        if (!amount || amount <= 1) {
            return values[values.length - 1];
        }
        amount = Math.min(values.length, amount);
        return values.slice(-amount);
    }

    reverse(): this {
        const entries = [...this.entries()].reverse();
        this.clear();
        for (const [key, value] of entries) this.set(key, value);
        return this;
    }

    map<T>(fn: (value: V, key: Snowflake, collection: this) => T): T[] {
        const result: T[] = [];
        for (const [key, value] of this.entries()) {
            result.push(fn(value, key, this));
        }
        return result;
    }

    reduce<T>(fn: (acc: T, value: V, key: Snowflake, structCache: this) => T, initV?: T): T {
        const entries = this.entries();
        const first = entries.next().value;
        let result = initV;
        if (result !== undefined) {
            result = fn(result, first[1], first[0], this);
        } else {
            result = first;
        }
        for (const [key, value] of entries) {
            result = fn(result!, value, key, this);
        }
        return result!;
    }

    get size(): number {
        return super.size;
    }

    get empty(): boolean {
        return this.size === 0;
    }

    updateFields(key: Snowflake, obj: Partial<V>) {
        const value = this.get(key);

        if (!value) {
            return;
        }

        for (const prop in obj) {
            if (obj[prop]) {
                value[prop] = obj[prop]!;
            }
        }

        return this.set(key, value);
    }

    getOr(key: Snowflake, or: V): V | undefined {
        return this.get(key) ?? or;
    }

    retrieve<T>(key: Snowflake, fn: (value: V) => T) {
        const value = this.get(key);

        if (!value) {
            return;
        }

        return fn(value);
    }
}

export default Collection;
