import { describe, expect, test } from 'vitest';
import { Client, LimitedMemoryAdapter, MemoryAdapter } from '../lib/index';
import { BaseClient } from '../lib/client/base';

// all intents
const intents = 53608447;

describe('test memory cache adapter', () => {
	const adapter = new MemoryAdapter();

	test('discord cache', () => {
		const client = new Client({
			getRC: () => ({
				locations: {
					base: '',
					output: '',
				},
				intents,
				token: '',
			}),
		});
		client.setServices({
			cache: {
				adapter,
			},
		});
		return client.cache.testAdapter();
	});
});

describe('test limited memory cache adapter', () => {
	const adapter = new LimitedMemoryAdapter();

	test('discord cache', () => {
		const client = new Client({
			getRC: () => ({
				locations: {
					base: '',
					output: '',
				},
				intents,
				token: '',
			}),
		});
		client.setServices({
			cache: {
				adapter,
			},
		});
		return client.cache.testAdapter();
	});

	test('bulkGet preserves falsy decoded values', () => {
		const primitiveAdapter = new LimitedMemoryAdapter({
			encode(data) {
				return data;
			},
			decode(data) {
				return data;
			},
		});

		primitiveAdapter.set('user.0', 0);
		primitiveAdapter.set('user.false', false);
		primitiveAdapter.set('user.empty', '');

		expect(primitiveAdapter.bulkGet(['user.0', 'user.false', 'user.empty'])).toEqual([0, false, '']);
	});
});

describe('base client runtime config cache', () => {
	test('keeps runtime config scoped per client instance', async () => {
		const clientA = new BaseClient({
			getRC: () => ({
				locations: {
					base: 'src-a',
				},
				intents,
				token: 'token-a',
			}),
		});
		const clientB = new BaseClient({
			getRC: () => ({
				locations: {
					base: 'src-b',
				},
				intents: 0,
				token: 'token-b',
			}),
		});

		const [configA, configB] = await Promise.all([clientA.getRC(), clientB.getRC()]);

		expect(configA.token).toBe('token-a');
		expect(configB.token).toBe('token-b');
		expect(configA.locations.base).toBe('src-a');
		expect(configB.locations.base).toBe('src-b');
		expect(configA.intents).toBe(intents);
		expect(configB.intents).toBe(0);
	});
});
