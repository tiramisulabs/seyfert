import { describe, expect, test } from 'vitest';
import { CacheFrom, Client, LimitedMemoryAdapter, MemoryAdapter } from '../lib/index';
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

	test('get and values preserve falsy decoded values', () => {
		const primitiveAdapter = new MemoryAdapter({
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
		primitiveAdapter.addToRelationship('user', ['0', 'false', 'empty']);

		expect(primitiveAdapter.get('user.0')).toBe(0);
		expect(primitiveAdapter.get('user.false')).toBe(false);
		expect(primitiveAdapter.get('user.empty')).toBe('');
		expect(primitiveAdapter.values('user')).toEqual([0, false, '']);
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

	test('bulkRemove clears message relationship buckets', () => {
		const primitiveAdapter = new LimitedMemoryAdapter({
			encode(data) {
				return data;
			},
			decode(data) {
				return data;
			},
		});

		primitiveAdapter.addToRelationship('message.channel-1', 'message-1');
		primitiveAdapter.set('message.message-1', { id: 'message-1', channel_id: 'channel-1' });

		primitiveAdapter.bulkRemove(['message.message-1']);

		expect(primitiveAdapter.getToRelationship('message.channel-1')).toEqual([]);
	});

	test('guild removal clears message and overwrite cache indexes', async () => {
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
				adapter: new LimitedMemoryAdapter(),
			},
		});

		const guildId = 'guild-1';
		const channelId = 'channel-1';

		await client.cache.channels?.set(CacheFrom.Test, channelId, guildId, {
			id: channelId,
			guild_id: guildId,
			type: 0,
			name: 'general',
		} as any);
		await client.cache.messages?.set(CacheFrom.Test, 'message-1', channelId, {
			id: 'message-1',
			channel_id: channelId,
			content: 'hello',
			author: {
				id: 'user-1',
				username: 'user',
				discriminator: '0',
				avatar: null,
			},
		} as any);
		await client.cache.overwrites?.set(CacheFrom.Test, channelId, guildId, [
			{ id: 'role-1', allow: '0', deny: '0', type: 0 },
		] as any);

		expect(await client.cache.messages?.count(channelId)).toBe(1);
		expect(await client.cache.overwrites?.count(guildId)).toBe(1);

		await client.cache.guilds?.remove(guildId);

		expect(await client.cache.messages?.count(channelId)).toBe(0);
		expect(await client.cache.messages?.keys(channelId)).toEqual([]);
		expect(await client.cache.overwrites?.count(guildId)).toBe(0);
		expect(await client.cache.overwrites?.keys(guildId)).toEqual([]);
		expect(await client.cache.overwrites?.raw(channelId)).toBeNull();
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
