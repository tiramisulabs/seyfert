import { assert, describe, test } from 'vitest';
import { LimitedCollection } from '../src/collection';

describe('LimitedCollection', () => {
	test('iterates plain values and exposes raw metadata separately', () => {
		const collection = new LimitedCollection<string, number>();

		collection.set('one', 1);
		collection.set('two', 2);

		assert.deepEqual([...collection.values()], [1, 2]);
		assert.deepEqual([...collection.entries()], [
			['one', 1],
			['two', 2],
		]);
		assert.deepEqual([...collection], [
			['one', 1],
			['two', 2],
		]);
		assert.deepEqual([...collection.rawValues()], [
			{ value: 1, expire: -1, expireOn: -1 },
			{ value: 2, expire: -1, expireOn: -1 },
		]);
		assert.deepEqual([...collection.rawEntries()], [
			['one', { value: 1, expire: -1, expireOn: -1 }],
			['two', { value: 2, expire: -1, expireOn: -1 }],
		]);
	});
});
