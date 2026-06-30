import { assert, describe, expect, test } from 'vitest';
import { BaseResource } from '../src/cache/resources/default/base';
import { Cache, CacheFrom, Client, LimitedMemoryAdapter, MemoryAdapter } from '../src/index';
import type { APIUser } from '../src/index';
import { BaseClient } from '../src/client/base';

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

describe('base cache resource', () => {
	test('normalizes adapter cache misses to undefined', () => {
		const adapter = new MemoryAdapter();
		const resource = new BaseResource<{ id: string }>({ adapter } as any, {} as any);

		assert.strictEqual(adapter.get('base.missing'), null);
		assert.strictEqual(resource.get('missing'), undefined);

		adapter.set('base.present', { id: 'present' });
		assert.deepEqual(resource.get('present'), { id: 'present' });
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

	test('rebuilds resources when disabledCache is explicitly false', () => {
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

		client.setServices({ cache: { disabledCache: true } });
		assert.equal(client.cache.users, undefined);

		client.setServices({ cache: { disabledCache: false } });
		assert.notEqual(client.cache.users, undefined);
	});
});

describe('test limited memory cache adapter indexing', () => {
	test('resolves get patch and remove across multiple buckets', () => {
		const adapter = new LimitedMemoryAdapter({
			default: {
				limit: Number.POSITIVE_INFINITY,
			},
			member: {
				limit: Number.POSITIVE_INFINITY,
			},
		});

		adapter.bulkAddToRelationShip({
			'member.guild-1': ['user-1'],
			'member.guild-2': ['user-2'],
		});

		adapter.bulkSet([
			['member.guild-1.user-1', { id: 'user-1', guild_id: 'guild-1', nick: 'uno' }],
			['member.guild-2.user-2', { id: 'user-2', guild_id: 'guild-2', nick: 'dos' }],
		]);

		assert.deepEqual(adapter.get('member.guild-2.user-2'), {
			id: 'user-2',
			guild_id: 'guild-2',
			nick: 'dos',
		});
		assert.equal(
			(adapter as LimitedMemoryAdapter<unknown> & { keyToStorage: Map<string, unknown> }).keyToStorage.has(
				'member.guild-2.user-2',
			),
			false,
		);

		adapter.patch('member.guild-2.user-2', { nick: 'dos-updated' });

		assert.deepEqual(adapter.get('member.guild-2.user-2'), {
			id: 'user-2',
			guild_id: 'guild-2',
			nick: 'dos-updated',
		});

		adapter.remove('member.guild-2.user-2');

		assert.equal(adapter.get('member.guild-2.user-2'), null);
	});

	test('removes message relationships using the deleted message channel', () => {
		const adapter = new LimitedMemoryAdapter({
			default: {
				limit: Number.POSITIVE_INFINITY,
			},
			message: {
				limit: Number.POSITIVE_INFINITY,
			},
		});

		adapter.bulkAddToRelationShip({
			'message.channel-1': ['message-1'],
			'message.channel-2': ['message-2'],
		});

		adapter.bulkSet([
			['message.message-1', { id: 'message-1', guild_id: 'guild-1', channel_id: 'channel-1', content: 'one' }],
			['message.message-2', { id: 'message-2', guild_id: 'guild-1', channel_id: 'channel-2', content: 'two' }],
		]);

		adapter.remove('message.message-2');

		assert.deepEqual(adapter.getToRelationship('message.channel-1'), ['message-1']);
		assert.deepEqual(adapter.getToRelationship('message.channel-2'), []);
		assert.equal(
			(adapter as LimitedMemoryAdapter<unknown> & { keyToStorage: Map<string, unknown> }).keyToStorage.has(
				'message.message-2',
			),
			false,
		);
	});
	test('relationship reads do not allocate empty buckets', () => {
		const adapter = new LimitedMemoryAdapter();
		const relationships = (adapter as LimitedMemoryAdapter<unknown> & { relationships: Map<string, unknown> }).relationships;

		assert.equal(adapter.contains('message.channel-1', 'message-1'), false);
		assert.deepEqual(adapter.getToRelationship('message.channel-1'), []);
		assert.deepEqual(adapter.keys('message.channel-1'), []);
		assert.equal(adapter.count('message.channel-1'), 0);
		assert.equal(relationships.size, 0);

		adapter.addToRelationship('message.channel-1', 'message-1');
		assert.equal(adapter.contains('message.channel-1', 'message-1'), true);

		adapter.removeToRelationship('message.channel-1', 'message-1');
		assert.equal(relationships.size, 0);
	});

	test('message cache stores authors so transformed messages can be read back', async () => {
		const client: any = {};
		const cache = new Cache(0, new MemoryAdapter(), {}, client);
		client.cache = cache;
		const message = {
			attachments: [],
			author: { avatar: null, discriminator: '0001', id: 'user-1', username: 'socram' },
			channel_id: 'channel-1',
			components: [],
			content: 'hello',
			edited_timestamp: null,
			embeds: [],
			flags: 0,
			id: 'message-1',
			mention_everyone: false,
			mention_roles: [],
			mentions: [],
			pinned: false,
			timestamp: new Date(0).toISOString(),
			tts: false,
			type: 0,
		};

		await cache.messages?.set(CacheFrom.Rest, message.id, message.channel_id, message);

		const cachedMessage = await cache.messages?.get(message.id);
		const rawMessage = await cache.messages?.raw(message.id);

		assert.equal(cachedMessage?.author.id, message.author.id);
		assert.equal(rawMessage?.user_id, message.author.id);
		assert.equal(await cache.users?.raw(message.author.id), message.author as APIUser);
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
