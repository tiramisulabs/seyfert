import { assert, describe, expect, test, vi } from 'vitest';
import { Collection, LimitedCollection } from '../src/collection';

function withFakeTimers(run: () => void) {
	vi.useFakeTimers();
	try {
		run();
	} finally {
		vi.useRealTimers();
	}
}

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
		assert.equal(
			c.sweep(() => false),
			0,
		);
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
		assert.deepEqual(
			c.map(v => v),
			[],
		);
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
		assert.deepEqual(
			c.filter(v => v > 100),
			[],
		);
	});

	test('filterCollection preserves keys in a new collection', () => {
		const collection = new Collection<string, { type: 'keep' | 'drop'; label: string }>([
			['one', { type: 'keep', label: 'first' }],
			['two', { type: 'drop', label: 'second' }],
			['three', { type: 'keep', label: 'third' }],
		]);

		const filtered = collection.filterCollection(value => value.type === 'keep');

		assert.instanceOf(filtered, Collection);
		assert.notEqual(filtered, collection);
		assert.deepEqual(
			[...filtered.entries()],
			[
				['one', { type: 'keep', label: 'first' }],
				['three', { type: 'keep', label: 'third' }],
			],
		);
	});

	test('reduce with initial value', () => {
		const c = new Collection<number, number>();
		c.set(1, 1);
		c.set(2, 2);
		c.set(3, 3);
		assert.equal(
			c.reduce((acc, v) => acc + v, 0),
			6,
		);
	});

	test('reduce without initial value uses first element', () => {
		const c = new Collection<number, number>();
		c.set(1, 10);
		c.set(2, 20);
		assert.equal(
			c.reduce((acc, v) => acc + v),
			30,
		);
	});

	test('reduce on empty collection without initial value throws', () => {
		const c = new Collection<number, number>();
		expect(() => c.reduce((acc, v) => acc + v)).toThrow(TypeError);
	});

	test('every returns true when all match', () => {
		const c = new Collection<number, number>();
		c.set(1, 2);
		c.set(2, 4);
		assert.equal(
			c.every(v => v % 2 === 0),
			true,
		);
	});

	test('every returns false when one fails', () => {
		const c = new Collection<number, number>();
		c.set(1, 2);
		c.set(2, 3);
		assert.equal(
			c.every(v => v % 2 === 0),
			false,
		);
	});

	test('every returns true on empty collection', () => {
		const c = new Collection<number, number>();
		assert.equal(
			c.every(() => false),
			true,
		);
	});

	test('some returns true when one matches', () => {
		const c = new Collection<number, number>();
		c.set(1, 1);
		c.set(2, 2);
		assert.equal(
			c.some(v => v === 2),
			true,
		);
	});

	test('some returns false when none match', () => {
		const c = new Collection<number, number>();
		c.set(1, 1);
		assert.equal(
			c.some(v => v === 99),
			false,
		);
	});

	test('some returns false on empty collection', () => {
		const c = new Collection<number, number>();
		assert.equal(
			c.some(() => true),
			false,
		);
	});

	test('find returns first matching value', () => {
		const c = new Collection<number, string>();
		c.set(1, 'a');
		c.set(2, 'b');
		c.set(3, 'b');
		assert.equal(
			c.find(v => v === 'b'),
			'b',
		);
	});

	test('find returns undefined when nothing matches', () => {
		const c = new Collection<number, string>();
		c.set(1, 'a');
		assert.equal(
			c.find(v => v === 'z'),
			undefined,
		);
	});

	test('findKey returns first matching key', () => {
		const c = new Collection<number, string>();
		c.set(1, 'a');
		c.set(2, 'b');
		c.set(3, 'c');
		assert.equal(
			c.findKey(v => v === 'b'),
			2,
		);
	});

	test('findKey returns undefined when nothing matches', () => {
		const c = new Collection<number, string>();
		c.set(1, 'a');
		assert.equal(
			c.findKey(v => v === 'z'),
			undefined,
		);
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
		assert.equal(c.set(1, 'one'), false);
		assert.equal(c.size, 0);
	});

	test('set reports limit acceptance independently of reentrant deletion', () => {
		const retained = new LimitedCollection<number, string>();
		assert.equal(retained.set(1, 'one'), true);

		const fractionalLimit = new LimitedCollection<number, string>({ limit: 0.5 });
		assert.equal(fractionalLimit.set(1, 'one'), false);
		assert.equal(fractionalLimit.size, 0);

		let reentrant: LimitedCollection<number, string>;
		reentrant = new LimitedCollection({
			limit: 1,
			onDelete(key) {
				if (key === 1) reentrant.delete(2);
			},
		});
		reentrant.set(1, 'one');
		assert.equal(reentrant.set(2, 'two'), true);
		assert.equal(reentrant.has(2), false);
	});

	test('rejects NaN limits but preserves zero and infinity behavior', () => {
		let thrown: unknown;

		try {
			new LimitedCollection<string, number>({ limit: Number.NaN });
		} catch (error) {
			thrown = error;
		}

		assert.equal(thrown instanceof TypeError, true);
		assert.equal((thrown as Error).message.includes('NaN'), true);

		const zeroLimit = new LimitedCollection<string, number>({ limit: 0 });
		zeroLimit.set('one', 1);
		assert.equal(zeroLimit.size, 0);

		const negativeLimit = new LimitedCollection<string, number>({ limit: -1 });
		negativeLimit.set('one', 1);
		assert.equal(negativeLimit.size, 0);

		const infiniteLimit = new LimitedCollection<string, number>({ limit: Number.POSITIVE_INFINITY });
		infiniteLimit.set('one', 1);
		assert.equal(infiniteLimit.size, 1);
	});

	test('rejects NaN and finite expirations that exceed the runtime timer limit', () => {
		assert.throws(() => new LimitedCollection({ expire: Number.NaN }), TypeError);
		assert.throws(() => new LimitedCollection({ expire: 2_147_483_648 }), RangeError);
		assert.doesNotThrow(() => new LimitedCollection({ expire: 2_147_483_647 }));

		const collection = new LimitedCollection<string, number>();
		assert.throws(() => collection.set('invalid', 1, Number.NaN), TypeError);
		assert.throws(() => collection.set('invalid', 1, 2_147_483_648), RangeError);

		const disabledCollection = new LimitedCollection<string, number>({ limit: 0 });
		assert.doesNotThrow(() => disabledCollection.set('ignored', 1, Number.NaN));
		assert.equal(disabledCollection.size, 0);
	});

	test('treats infinities and non-positive expirations as no expiration', () => {
		vi.useFakeTimers();
		try {
			const collection = new LimitedCollection<string, number>({ expire: Number.POSITIVE_INFINITY });
			collection.set('default', 1);
			collection.set('zero', 2, 0);
			collection.set('negative-finite', 3, -1);
			collection.set('negative-infinite', 4, Number.NEGATIVE_INFINITY);
			collection.set('positive', 5, Number.POSITIVE_INFINITY);

			for (const key of ['default', 'zero', 'negative-finite', 'negative-infinite', 'positive']) {
				assert.equal(collection.raw(key)?.expire, -1);
				assert.equal(collection.raw(key)?.expireOn, -1);
			}
			assert.equal(collection.closer, undefined);
			assert.equal(vi.getTimerCount(), 0);
		} finally {
			vi.clearAllTimers();
			vi.useRealTimers();
		}
	});

	test('replacing the closer through Map key equality cancels its timer', () => {
		vi.useFakeTimers();
		const onDelete = vi.fn();
		try {
			const key = Number.NaN;
			const collection = new LimitedCollection<number, number>({ onDelete });
			collection.set(key, 1, 100);
			assert.equal(vi.getTimerCount(), 1);

			collection.set(key, 2, Number.POSITIVE_INFINITY);
			assert.equal(vi.getTimerCount(), 0);

			vi.advanceTimersByTime(101);
			assert.equal(collection.get(key), 2);
			assert.equal(onDelete.mock.calls.length, 0);
		} finally {
			vi.clearAllTimers();
			vi.useRealTimers();
		}
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

	test('onDelete observes the entry before it is removed', () => {
		let observed: { hasKey: boolean; size: number } | undefined;
		let c: LimitedCollection<number, string>;
		c = new LimitedCollection({
			limit: 1,
			onDelete: key => {
				observed = { hasKey: c.has(key), size: c.size };
			},
		});
		c.set(1, 'one');
		c.set(2, 'two');

		assert.deepEqual(observed, { hasKey: true, size: 2 });
	});

	test('clear empties collection', () => {
		const c = new LimitedCollection<number, string>();
		c.set(1, 'one');
		c.set(2, 'two');
		c.clear();
		assert.equal(c.size, 0);
	});

	test('expire removes element after timeout', () => {
		withFakeTimers(() => {
			const c = new LimitedCollection<number, string>();
			c.set(1, 'one', 100);
			assert.equal(c.has(1), true);
			vi.advanceTimersByTime(101);
			assert.equal(c.has(1), false);
		});
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
		withFakeTimers(() => {
			const c = new LimitedCollection<number, string>({ resetOnDemand: true });
			c.set(1, 'one', 100);
			vi.advanceTimersByTime(80);
			c.get(1); // should reset the expiry
			vi.advanceTimersByTime(80);
			assert.equal(c.has(1), true);
			vi.advanceTimersByTime(21);
			assert.equal(c.has(1), false);
		});
	});

	test('clears expiration timers when the collection is cleared', () => {
		withFakeTimers(() => {
			const c = new LimitedCollection<number, string>({ expire: 100 });
			c.set(1, 'one');
			assert.equal(vi.getTimerCount(), 1);
			c.clear();
			assert.equal(vi.getTimerCount(), 0);
			vi.advanceTimersByTime(200);
			assert.equal(c.size, 0);
		});
	});

	test('keeps one tracked timer when an expiration callback replaces the collection', () => {
		withFakeTimers(() => {
			const c = new LimitedCollection<number, string>({
				expire: 100,
				onDelete: key => {
					if (key !== 1) return;
					c.clear();
					c.set(2, 'two');
				},
			});
			c.set(1, 'one');

			vi.advanceTimersByTime(100);
			assert.equal(c.has(2), true);
			assert.equal(vi.getTimerCount(), 1);

			c.clear();
			assert.equal(vi.getTimerCount(), 0);
		});
	});

	test('expires a large batch with one callback per element', () => {
		withFakeTimers(() => {
			const drainFirstBatch = (size: number) => {
				const deleted: number[] = [];
				const c = new LimitedCollection<number, string>({ onDelete: key => deleted.push(key) });
				for (let key = 0; key < size; key++) c.set(key, String(key), 100);
				vi.advanceTimersByTime(100);
				assert.ok(c.size > 0 && c.size < size);
				assert.equal(deleted.length, size - c.size);
				const firstBatchSize = deleted.length;
				vi.runAllTimers();
				assert.equal(c.size, 0);
				assert.equal(deleted.length, size);
				assert.equal(new Set(deleted).size, size);
				return firstBatchSize;
			};

			assert.equal(drainFirstBatch(1_500), drainFirstBatch(3_000));
		});
	});

	test('cancels a pending expiration continuation when cleared', () => {
		withFakeTimers(() => {
			const deleted: number[] = [];
			const c = new LimitedCollection<number, string>({ onDelete: key => deleted.push(key) });
			for (let key = 0; key < 1_500; key++) c.set(key, String(key), 100);

			vi.advanceTimersByTime(100);
			assert.ok(c.size > 0 && c.size < 1_500);
			const deletedBeforeClear = deleted.length;
			assert.equal(vi.getTimerCount(), 1);
			c.clear();
			assert.equal(vi.getTimerCount(), 0);

			vi.runAllTimers();
			assert.equal(deleted.length, deletedBeforeClear);
		});
	});

	test('preserves an entry when its eviction callback throws', () => {
		withFakeTimers(() => {
			const c = new LimitedCollection<number, string>({
				limit: 1,
				onDelete: key => {
					if (key === 1) throw new Error('rejected deletion');
				},
			});
			c.set(1, 'one', 60_000);
			expect(() => c.set(2, 'two', 100)).toThrow('rejected deletion');
			assert.equal(c.has(1), true);
			assert.equal(c.has(2), true);

			vi.advanceTimersByTime(100);
			assert.equal(c.has(2), false);
			assert.equal(c.has(1), true);
			assert.equal(vi.getTimerCount(), 1);
		});
	});

	test('preserves expiration when a delete callback throws', () => {
		withFakeTimers(() => {
			const c = new LimitedCollection<number, string>({
				onDelete: () => {
					throw new Error('rejected deletion');
				},
			});
			c.set(1, 'one', 100);
			expect(() => c.delete(1)).toThrow('rejected deletion');
			assert.equal(c.has(1), true);
			assert.equal(vi.getTimerCount(), 1);
		});
	});

	test('does not retry a failed expiration and continues with later entries', () => {
		withFakeTimers(() => {
			const calls: number[] = [];
			const c = new LimitedCollection<number, string>({
				onDelete: key => {
					calls.push(key);
					if (key === 1) throw new Error('rejected deletion');
				},
			});
			c.set(1, 'one', 100);
			c.set(2, 'two', 200);

			expect(() => vi.advanceTimersByTime(100)).toThrow('rejected deletion');
			assert.deepEqual(calls, [1]);
			assert.equal(c.has(1), true);
			assert.equal(c.has(2), true);
			assert.equal(vi.getTimerCount(), 1);

			vi.advanceTimersByTime(100);
			assert.deepEqual(calls, [1, 2]);
			assert.equal(c.has(1), true);
			assert.equal(c.has(2), false);
			assert.equal(vi.getTimerCount(), 0);
		});
	});

	test('overwriting the closer with a later expiry does not expire early', () => {
		withFakeTimers(() => {
			const c = new LimitedCollection<number, string>();
			c.set(1, 'one', 100);
			vi.advanceTimersByTime(50);
			c.set(1, 'one-again', 200);
			vi.advanceTimersByTime(60);
			assert.equal(c.has(1), true);
			vi.advanceTimersByTime(139);
			assert.equal(c.has(1), true);
			vi.advanceTimersByTime(2);
			assert.equal(c.has(1), false);
		});
	});

	test('replacing the closer with a later expiration schedules the next closer immediately', () => {
		vi.useFakeTimers();
		try {
			const collection = new LimitedCollection<string, number>();
			collection.set('replaced', 1, 100);
			collection.set('next', 2, 200);
			vi.advanceTimersByTime(20);

			collection.set('replaced', 3, 300);
			assert.equal(vi.getTimerCount(), 1);

			vi.advanceTimersToNextTimer();
			assert.equal(collection.has('next'), false);
			assert.equal(collection.get('replaced'), 3);
		} finally {
			vi.clearAllTimers();
			vi.useRealTimers();
		}
	});

	test('keys, values, entries iterate correctly', () => {
		const c = new LimitedCollection<number, string>();
		c.set(1, 'one');
		c.set(2, 'two');
		assert.deepEqual([...c.keys()], [1, 2]);
		assert.deepEqual([...c.values()], ['one', 'two']);
		assert.deepEqual(
			[...c.entries()],
			[
				[1, 'one'],
				[2, 'two'],
			],
		);
	});

	test('iterates plain values and exposes raw metadata separately', () => {
		const collection = new LimitedCollection<string, number>();

		collection.set('one', 1);
		collection.set('two', 2);

		assert.deepEqual([...collection.values()], [1, 2]);
		assert.deepEqual(
			[...collection.entries()],
			[
				['one', 1],
				['two', 2],
			],
		);
		assert.deepEqual(
			[...collection],
			[
				['one', 1],
				['two', 2],
			],
		);
		assert.deepEqual(
			[...collection.rawValues()],
			[
				{ value: 1, expire: -1, expireOn: -1 },
				{ value: 2, expire: -1, expireOn: -1 },
			],
		);
		assert.deepEqual(
			[...collection.rawEntries()],
			[
				['one', { value: 1, expire: -1, expireOn: -1 }],
				['two', { value: 2, expire: -1, expireOn: -1 }],
			],
		);
	});
});
