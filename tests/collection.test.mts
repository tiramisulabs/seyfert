import { assert, describe, expect, test, vi } from 'vitest';
import { Collection, LimitedCollection } from '../lib/collection';

describe('Collection', () => {
	test('sweep removes matching elements', () => {
		const c = new Collection<number, string>();
		c.set(1, 'one');
		c.set(2, 'two');
		c.set(3, 'three');
		const removed = c.sweep((_v, k) => k % 2 === 0);
		assert.equal(removed, 1);
		assert.equal(c.size, 2);
		assert.equal(c.has(2), false);
	});

	test('sweep returns 0 when nothing matches', () => {
		const c = new Collection<number, string>();
		c.set(1, 'one');
		assert.equal(c.sweep(() => false), 0);
		assert.equal(c.size, 1);
	});

	test('map transforms values', () => {
		const c = new Collection<number, string>();
		c.set(1, 'one');
		c.set(2, 'two');
		const result = c.map((v, k) => `${k}:${v}`);
		assert.deepEqual(result, ['1:one', '2:two']);
	});

	test('map on empty collection returns empty array', () => {
		const c = new Collection<number, string>();
		assert.deepEqual(c.map(v => v), []);
	});

	test('filter returns matching values', () => {
		const c = new Collection<number, number>();
		c.set(1, 10);
		c.set(2, 20);
		c.set(3, 30);
		const result = c.filter(v => v > 15);
		assert.deepEqual(result, [20, 30]);
	});

	test('filter returns empty array when nothing matches', () => {
		const c = new Collection<number, number>();
		c.set(1, 10);
		assert.deepEqual(c.filter(v => v > 100), []);
	});

	test('reduce with initial value', () => {
		const c = new Collection<number, number>();
		c.set(1, 1);
		c.set(2, 2);
		c.set(3, 3);
		assert.equal(c.reduce((acc, v) => acc + v, 0), 6);
	});

	test('reduce without initial value uses first element', () => {
		const c = new Collection<number, number>();
		c.set(1, 10);
		c.set(2, 20);
		assert.equal(c.reduce((acc, v) => acc + v), 30);
	});

	test('reduce on empty collection without initial value throws', () => {
		const c = new Collection<number, number>();
		expect(() => c.reduce((acc, v) => acc + v)).toThrow(TypeError);
	});

	test('every returns true when all match', () => {
		const c = new Collection<number, number>();
		c.set(1, 2);
		c.set(2, 4);
		assert.equal(c.every(v => v % 2 === 0), true);
	});

	test('every returns false when one fails', () => {
		const c = new Collection<number, number>();
		c.set(1, 2);
		c.set(2, 3);
		assert.equal(c.every(v => v % 2 === 0), false);
	});

	test('every returns true on empty collection', () => {
		const c = new Collection<number, number>();
		assert.equal(c.every(() => false), true);
	});

	test('some returns true when one matches', () => {
		const c = new Collection<number, number>();
		c.set(1, 1);
		c.set(2, 2);
		assert.equal(c.some(v => v === 2), true);
	});

	test('some returns false when none match', () => {
		const c = new Collection<number, number>();
		c.set(1, 1);
		assert.equal(c.some(v => v === 99), false);
	});

	test('some returns false on empty collection', () => {
		const c = new Collection<number, number>();
		assert.equal(c.some(() => true), false);
	});

	test('find returns first matching value', () => {
		const c = new Collection<number, string>();
		c.set(1, 'a');
		c.set(2, 'b');
		c.set(3, 'b');
		assert.equal(c.find(v => v === 'b'), 'b');
	});

	test('find returns undefined when nothing matches', () => {
		const c = new Collection<number, string>();
		c.set(1, 'a');
		assert.equal(c.find(v => v === 'z'), undefined);
	});

	test('findKey returns first matching key', () => {
		const c = new Collection<number, string>();
		c.set(1, 'a');
		c.set(2, 'b');
		c.set(3, 'c');
		assert.equal(c.findKey(v => v === 'b'), 2);
	});

	test('findKey returns undefined when nothing matches', () => {
		const c = new Collection<number, string>();
		c.set(1, 'a');
		assert.equal(c.findKey(v => v === 'z'), undefined);
	});
});

describe('LimitedCollection', () => {
	test('set and get', () => {
		const c = new LimitedCollection<number, string>();
		c.set(1, 'one');
		assert.equal(c.get(1), 'one');
		assert.equal(c.size, 1);
	});

	test('has returns correct results', () => {
		const c = new LimitedCollection<number, string>();
		c.set(1, 'one');
		assert.equal(c.has(1), true);
		assert.equal(c.has(2), false);
	});

	test('delete removes element', () => {
		const c = new LimitedCollection<number, string>();
		c.set(1, 'one');
		assert.equal(c.delete(1), true);
		assert.equal(c.has(1), false);
		assert.equal(c.size, 0);
	});

	test('delete returns false for missing key', () => {
		const c = new LimitedCollection<number, string>();
		assert.equal(c.delete(1), false);
	});

	test('evicts oldest when limit exceeded', () => {
		const c = new LimitedCollection<number, string>({ limit: 2 });
		c.set(1, 'one');
		c.set(2, 'two');
		c.set(3, 'three');
		assert.equal(c.size, 2);
		assert.equal(c.has(1), false);
		assert.equal(c.get(2), 'two');
		assert.equal(c.get(3), 'three');
	});

	test('limit 0 rejects all inserts', () => {
		const c = new LimitedCollection<number, string>({ limit: 0 });
		c.set(1, 'one');
		assert.equal(c.size, 0);
	});

	test('raw returns internal data', () => {
		const c = new LimitedCollection<number, string>();
		c.set(1, 'one');
		const raw = c.raw(1);
		assert.equal(raw?.value, 'one');
		assert.equal(raw?.expire, -1);
		assert.equal(raw?.expireOn, -1);
	});

	test('raw with custom expire has positive expire', () => {
		const c = new LimitedCollection<number, string>();
		c.set(1, 'one', 5000);
		const raw = c.raw(1);
		assert.equal(raw?.expire, 5000);
		assert.notEqual(raw?.expireOn, -1);
	});

	test('onDelete callback fires on eviction', () => {
		const deleted: [number, string][] = [];
		const c = new LimitedCollection<number, string>({
			limit: 1,
			onDelete: (k, v) => deleted.push([k, v]),
		});
		c.set(1, 'one');
		c.set(2, 'two');
		assert.deepEqual(deleted, [[1, 'one']]);
	});

	test('onDelete callback fires on manual delete', () => {
		const deleted: [number, string][] = [];
		const c = new LimitedCollection<number, string>({
			onDelete: (k, v) => deleted.push([k, v]),
		});
		c.set(1, 'one');
		c.delete(1);
		assert.deepEqual(deleted, [[1, 'one']]);
	});

	test('clear empties collection', () => {
		const c = new LimitedCollection<number, string>();
		c.set(1, 'one');
		c.set(2, 'two');
		c.clear();
		assert.equal(c.size, 0);
	});

	test('expire removes element after timeout', () => {
		vi.useFakeTimers();
		const c = new LimitedCollection<number, string>();
		c.set(1, 'one', 100);
		assert.equal(c.has(1), true);
		vi.advanceTimersByTime(101);
		assert.equal(c.has(1), false);
		vi.useRealTimers();
	});

	test('closer returns element with soonest expiry', () => {
		const c = new LimitedCollection<number, string>();
		c.set(1, 'one', 5000);
		c.set(2, 'two', 1000);
		c.set(3, 'three', 3000);
		assert.equal(c.closer?.value, 'two');
	});

	test('closer returns undefined when no expiring elements', () => {
		const c = new LimitedCollection<number, string>();
		c.set(1, 'one');
		assert.equal(c.closer, undefined);
	});

	test('resetOnDemand extends expiry on get', () => {
		vi.useFakeTimers();
		const c = new LimitedCollection<number, string>({ resetOnDemand: true });
		c.set(1, 'one', 100);
		vi.advanceTimersByTime(80);
		c.get(1); // should reset the expiry
		vi.advanceTimersByTime(80);
		assert.equal(c.has(1), true);
		vi.advanceTimersByTime(21);
		assert.equal(c.has(1), false);
		vi.useRealTimers();
	});

	test('keys, values, entries iterate correctly', () => {
		const c = new LimitedCollection<number, string>();
		c.set(1, 'one');
		c.set(2, 'two');
		assert.deepEqual([...c.keys()], [1, 2]);
		assert.deepEqual(
			[...c.values()].map(v => v.value),
			['one', 'two'],
		);
		assert.deepEqual(
			[...c.entries()].map(([k, v]) => [k, v.value]),
			[
				[1, 'one'],
				[2, 'two'],
			],
		);
	});
});
