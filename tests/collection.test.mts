import { assert, describe, test } from 'vitest';
import { Collection, LimitedCollection } from '../src/collection';

describe('Collection', () => {
	test('filterCollection preserves keys in a new collection', () => {
		const collection = new Collection<string, { type: 'keep' | 'drop'; label: string }>([
			['one', { type: 'keep', label: 'first' }],
			['two', { type: 'drop', label: 'second' }],
			['three', { type: 'keep', label: 'third' }],
		]);

		const filtered = collection.filterCollection(value => value.type === 'keep');

		assert.instanceOf(filtered, Collection);
		assert.notEqual(filtered, collection);
		assert.deepEqual([...filtered.entries()], [
			['one', { type: 'keep', label: 'first' }],
			['three', { type: 'keep', label: 'third' }],
		]);
	});
});

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
