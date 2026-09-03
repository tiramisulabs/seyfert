import { assert, describe, expect, test, vi } from 'vitest';
import { BaseResource } from '../src/cache/resources/default/base';
import { Cache, CacheFrom, Client, LimitedMemoryAdapter, MemoryAdapter, PresenceUpdateStatus } from '../src/index';
import type { APIUser, PresenceUpdateReceiveStatus } from '../src/index';
import { BaseClient } from '../src/client/base';
import { PRESENCE_UPDATE } from '../src/events/hooks/presence';

const intents = 53608447;
const adapterKinds = ['MemoryAdapter', 'LimitedMemoryAdapter'] as const;

interface TestAdapterOptions {
	encode?(data: any): any;
	decode?(data: any): unknown;
}

function createTestAdapter(kind: (typeof adapterKinds)[number], options: TestAdapterOptions = {}) {
	if (kind === 'LimitedMemoryAdapter') return new LimitedMemoryAdapter(options);
	return new MemoryAdapter({
		encode: options.encode ?? (data => data),
		decode: options.decode ?? (data => data),
	});
}

function channelWrite(guildId: string, name = guildId) {
	return [
		'channel.channel-1',
		{ id: 'channel-1', guild_id: guildId, name },
		[`channel.${guildId}`, 'channel-1'],
	] as const;
}

function presenceData(guildId: string, status: PresenceUpdateReceiveStatus) {
	return {
		activities: [],
		client_status: {},
		guild_id: guildId,
		status,
		user: { id: 'user-1' },
	};
}

describe('test memory cache adapter', () => {
	const adapter = new MemoryAdapter();

	test('discord cache', () => {
		const client = new Client({
			getRC: () => ({
				locations: { base: '', output: '' },
				intents,
				token: '',
			}),
		});
		client.setServices({ cache: { adapter } });
		return client.cache.testAdapter();
	});

	test('get and values preserve falsy decoded values', () => {
		const primitiveAdapter = new MemoryAdapter({
			encode: data => data,
			decode: data => data,
		});

		primitiveAdapter.bulkSet([
			['user.0', 0, ['user', '0']],
			['user.false', false, ['user', 'false']],
			['user.empty', '', ['user', 'empty']],
		]);

		expect(primitiveAdapter.get('user.0')).toBe(0);
		expect(primitiveAdapter.get('user.false')).toBe(false);
		expect(primitiveAdapter.get('user.empty')).toBe('');
		expect(primitiveAdapter.bulkGet(['user.0', 'user.false', 'user.empty'])).toEqual([0, false, '']);
		expect(primitiveAdapter.values('user')).toEqual([0, false, '']);
	});

	test.each(['bulkSet', 'bulkPatch'] as const)('%s derives cache entries and relationships', async operation => {
		const adapter = new MemoryAdapter();
		const client: any = {};
		const cache = new Cache(0, adapter, {}, client);
		client.cache = cache;
		const entries: Parameters<Cache['bulkSet']>[0] = [
			[
				CacheFrom.Test,
				'users',
				{ id: 'user-1', username: 'user', discriminator: '0', avatar: null },
				'user-1',
			],
			[
				CacheFrom.Test,
				'members',
				{
					user: { id: 'user-1', username: 'user', discriminator: '0', avatar: null },
					roles: [],
					joined_at: '2024-01-01T00:00:00.000Z',
					deaf: false,
					mute: false,
					flags: 0,
				},
				'user-1',
				'guild-1',
			],
			[
				CacheFrom.Test,
				'messages',
				{
					id: 'message-1',
					channel_id: 'channel-1',
					author: { id: 'user-1', username: 'user', discriminator: '0', avatar: null },
				},
				'message-1',
				'channel-1',
			],
		];

		await cache[operation](entries);

		expect(await cache.users?.raw('user-1')).toMatchObject({ id: 'user-1', username: 'user' });
		expect(await cache.members?.raw('user-1', 'guild-1')).toMatchObject({
			guild_id: 'guild-1',
			user: { id: 'user-1', username: 'user' },
		});
		expect(await cache.messages?.raw('message-1')).toMatchObject({
			id: 'message-1',
			channel_id: 'channel-1',
			user_id: 'user-1',
		});
		expect(await cache.users?.count()).toBe(1);
		expect(await cache.members?.count('guild-1')).toBe(1);
		expect(await cache.messages?.count('channel-1')).toBe(1);
	});
});

describe('memory cache adapter bucket ownership', () => {
	test('derives root and guild-keyed relationships from their cache keys', () => {
		const adapter = new MemoryAdapter();
		adapter.bulkSet([
			['user.user-1', { id: 'user-1' }, ['user', 'user-1']],
			['member.guild-1.user-1', { id: 'user-1', guild_id: 'guild-1' }, ['member.guild-1', 'user-1']],
		]);

		assert.equal(adapter.keyToStorage.size, 0);
		assert.equal(adapter.storage.size, 2);
		assert.equal(adapter.storage.get('user')?.size, 1);
		assert.equal(adapter.storage.get('member.guild-1')?.size, 1);
		assert.deepEqual(adapter.keys('user'), ['user.user-1']);
		assert.deepEqual(adapter.keys('member.guild-1'), ['member.guild-1.user-1']);

		adapter.removeRelationship(['user', 'member.guild-1']);
		assert.equal(adapter.storage.size, 0);
		assert.equal(adapter.keyToStorage.size, 0);
	});

	test('indexes only globally keyed relationships and cleans up owner moves', () => {
		const adapter = new MemoryAdapter();
		adapter.set('channel.channel-1', { id: 'channel-1', guild_id: 'guild-1' }, ['channel.guild-1', 'channel-1']);
		adapter.set('channel.channel-1', { id: 'channel-1', guild_id: 'guild-2' }, ['channel.guild-2', 'channel-1']);

		assert.equal(adapter.keyToStorage.size, 1);
		assert.equal(adapter.storage.size, 1);
		assert.equal(adapter.contains('channel.guild-1', 'channel-1'), false);
		assert.deepEqual(adapter.keys('channel.guild-2'), ['channel.channel-1']);

		adapter.removeToRelationship('channel.guild-2', 'channel-1');
		assert.equal(adapter.storage.size, 0);
		assert.equal(adapter.keyToStorage.size, 0);
	});

	test('scans entries across relationship buckets', () => {
		const adapter = new MemoryAdapter();
		adapter.bulkSet([
			['member.guild-1.user-1', { id: 'user-1' }, ['member.guild-1', 'user-1']],
			['member.guild-2.user-2', { id: 'user-2' }, ['member.guild-2', 'user-2']],
		]);

		expect(adapter.scan('member.*.*', true)).toEqual(['member.guild-1.user-1', 'member.guild-2.user-2']);
	});
});

describe('base cache resource', () => {
	test('normalizes adapter cache misses to undefined', () => {
		const adapter = new MemoryAdapter();
		const resource = new BaseResource<{ id: string }>({ adapter } as any, {} as any);

		assert.strictEqual(adapter.get('base.missing'), null);
		assert.strictEqual(resource.get('missing'), undefined);

		adapter.set('base.present', { id: 'present' }, ['base', 'present']);
		assert.deepEqual(resource.get('present'), { id: 'present' });
	});
});

describe.each(adapterKinds)('%s guild-scoped presences', kind => {
	test('keeps one independently mutable entry per guild', async () => {
		const client: any = {};
		const cache = new Cache(0, createTestAdapter(kind), {}, client);
		client.cache = cache;

		await cache.bulkSet([
			[CacheFrom.Test, 'presences', presenceData('guild-1', PresenceUpdateStatus.Online), 'user-1', 'guild-1'],
			[CacheFrom.Test, 'presences', presenceData('guild-2', PresenceUpdateStatus.Idle), 'user-1', 'guild-2'],
		]);

		expect(await cache.bulkGet([
			['presences', 'user-1', 'guild-1'],
			['presences', 'user-1', 'guild-2'],
		])).toEqual({
			presences: [
				expect.objectContaining({ guild_id: 'guild-1', status: 'online' }),
				expect.objectContaining({ guild_id: 'guild-2', status: 'idle' }),
			],
		});
		expect(await cache.presences?.keys('guild-1')).toEqual(['presence.guild-1.user-1']);
		expect(await cache.presences?.values('guild-2')).toEqual([
			expect.objectContaining({ guild_id: 'guild-2', status: 'idle' }),
		]);
		expect(await cache.presences?.count('guild-1')).toBe(1);
		expect(await cache.presences?.contains('user-1', 'guild-2')).toBe(true);

		await cache.presences?.set(
			CacheFrom.Test,
			'user-1',
			'guild-1',
			presenceData('guild-1', PresenceUpdateStatus.DoNotDisturb),
		);
		expect(await cache.presences?.get('user-1', 'guild-1')).toMatchObject({ status: 'dnd' });
		expect(await cache.presences?.get('user-1', 'guild-2')).toMatchObject({ status: 'idle' });

		await cache.presences?.remove('user-1', 'guild-1');
		expect(await cache.presences?.get('user-1', 'guild-1')).toBeNull();
		expect(await cache.presences?.get('user-1', 'guild-2')).toMatchObject({ status: 'idle' });
	});

	test('guild cleanup removes only that guild presence', async () => {
		const client: any = {};
		const cache = new Cache(0, createTestAdapter(kind), {}, client);
		client.cache = cache;

		await cache.presences?.set(
			CacheFrom.Test,
			'user-1',
			'guild-1',
			presenceData('guild-1', PresenceUpdateStatus.Online),
		);
		await cache.presences?.set(
			CacheFrom.Test,
			'user-1',
			'guild-2',
			presenceData('guild-2', PresenceUpdateStatus.Idle),
		);
		await cache.guilds?.remove('guild-1');

		expect(await cache.presences?.get('user-1', 'guild-1')).toBeNull();
		expect(await cache.presences?.get('user-1', 'guild-2')).toMatchObject({ status: 'idle' });
	});

	test('presence hook reads the previous value from the event guild', async () => {
		const client: any = {};
		const cache = new Cache(0, createTestAdapter(kind), {}, client);
		client.cache = cache;
		await cache.presences?.set(
			CacheFrom.Test,
			'user-1',
			'guild-1',
			presenceData('guild-1', PresenceUpdateStatus.Online),
		);
		await cache.presences?.set(
			CacheFrom.Test,
			'user-1',
			'guild-2',
			presenceData('guild-2', PresenceUpdateStatus.Idle),
		);

		const [, previous] = await PRESENCE_UPDATE(
			client,
			presenceData('guild-1', PresenceUpdateStatus.DoNotDisturb) as Parameters<typeof PRESENCE_UPDATE>[1],
		);

		expect(previous).toMatchObject({ guild_id: 'guild-1', status: 'online' });
	});
});

describe.each(adapterKinds)('%s custom cache routing', kind => {
	test.each([
		['root', 'custom.entry', ['custom', 'entry'], false],
		['guild indexed', 'custom.entry', ['custom.guild-1', 'entry'], true],
		['guild keyed', 'custom.guild-1.entry', ['custom.guild-1', 'entry'], false],
	] as const)('routes a %s entry', (_layout, key, relationship, indexed) => {
		const adapter = createTestAdapter(kind);
		adapter.set(key, { id: 'entry' }, relationship);

		assert.deepEqual(adapter.get(key), { id: 'entry' });
		assert.deepEqual(adapter.keys(relationship[0]), [key]);
		assert.equal(adapter.contains(relationship[0], relationship[1]), true);
		assert.equal(adapter.keyToStorage.size, indexed ? 1 : 0);

		adapter.remove(key);
		assert.equal(adapter.get(key), null);
		assert.equal(adapter.contains(relationship[0], relationship[1]), false);
	});
});

describe('test limited memory cache adapter', () => {
	const adapter = new LimitedMemoryAdapter();

	test('discord cache', () => {
		const client = new Client({
			getRC: () => ({
				locations: { base: '', output: '' },
				intents,
				token: '',
			}),
		});
		client.setServices({ cache: { adapter } });
		return client.cache.testAdapter();
	});

	test('bulkGet preserves falsy decoded values', () => {
		const primitiveAdapter = new LimitedMemoryAdapter({
			encode: data => data,
			decode: data => data,
		});

		primitiveAdapter.bulkSet([
			['user.0', 0, ['user', '0']],
			['user.false', false, ['user', 'false']],
			['user.empty', '', ['user', 'empty']],
		]);

		expect(primitiveAdapter.bulkGet(['user.0', 'user.false', 'user.empty'])).toEqual([0, false, '']);
	});

	test('bulkRemove clears message relationships', () => {
		const primitiveAdapter = new LimitedMemoryAdapter();
		primitiveAdapter.set(
			'message.message-1',
			{ id: 'message-1', guild_id: 'guild-1', channel_id: 'channel-1' },
			['message.channel-1', 'message-1'],
		);

		primitiveAdapter.bulkRemove(['message.message-1']);

		expect(primitiveAdapter.getToRelationship('message.channel-1')).toEqual([]);
	});

	test('guild removal clears message and overwrite cache indexes', async () => {
		const client = new Client({
			getRC: () => ({
				locations: { base: '', output: '' },
				intents,
				token: '',
			}),
		});
		client.setServices({ cache: { adapter: new LimitedMemoryAdapter() } });

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
			author: { id: 'user-1', username: 'user', discriminator: '0', avatar: null },
		} as any);
		await client.cache.overwrites?.set(CacheFrom.Test, channelId, guildId, [
			{ id: 'role-1', allow: '0', deny: '0', type: 0 },
		] as any);

		expect(await client.cache.messages?.count(channelId)).toBe(1);
		expect(await client.cache.overwrites?.count(guildId)).toBe(1);
		await client.cache.guilds?.remove(guildId);
		expect(await client.cache.messages?.count(channelId)).toBe(0);
		expect(await client.cache.overwrites?.count(guildId)).toBe(0);
		expect(await client.cache.overwrites?.raw(channelId)).toBeNull();
	});

	test('rebuilds resources when disabledCache is explicitly false', () => {
		const client = new Client({
			getRC: () => ({
				locations: { base: '', output: '' },
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

describe.each(adapterKinds)('%s atomic write failures', kind => {
	test.each([
		['root', 'user.user-1', { id: 'user-1' }, 'user', 'user-1'],
		['guild related', 'channel.channel-1', { id: 'channel-1', guild_id: 'guild-1' }, 'channel.guild-1', 'channel-1'],
		['message', 'message.message-1', { id: 'message-1', guild_id: 'guild-1' }, 'message.channel-1', 'message-1'],
		['custom', 'custom.entry-1', { id: 'entry-1', guild_id: 'guild-1' }, 'custom.guild-1', 'entry-1'],
	] as const)('does not create a %s relationship when encoding fails', (_label, key, value, to, id) => {
		const adapter = createTestAdapter(kind, {
			encode() {
				throw new Error('encode failed');
			},
		});

		expect(() => adapter.set(key, value, [to, id])).toThrow('encode failed');
		assert.equal(adapter.contains(to, id), false);
		assert.equal(adapter.storage.size, 0);
	});

	test('does not create custom routing state when encoding fails', () => {
		let reject = true;
		const adapter = createTestAdapter(kind, {
			encode(data) {
				if (reject) throw new Error('encode failed');
				return data;
			},
		});

		expect(() => adapter.set('custom.entry', { id: 'entry' }, ['custom', 'entry'])).toThrow('encode failed');
		assert.equal(adapter.storage.size, 0);
		assert.equal(adapter.keyToStorage.size, 0);
		reject = false;
		adapter.set('custom.entry', { id: 'entry' }, ['custom.guild-1', 'entry']);

		assert.deepEqual(adapter.keys('custom.guild-1'), ['custom.entry']);
	});

	test('preserves the old value and relationship when a replacement cannot encode', () => {
		let reject = false;
		const adapter = createTestAdapter(kind, {
			encode(data) {
				if (reject) throw new Error('encode failed');
				return data;
			},
		});
		adapter.set(...channelWrite('guild-1', 'old'));

		reject = true;
		expect(() => adapter.set(...channelWrite('guild-2', 'new'))).toThrow('encode failed');
		assert.equal((adapter.get('channel.channel-1') as { name: string }).name, 'old');
		assert.equal(adapter.contains('channel.guild-1', 'channel-1'), true);
		assert.equal(adapter.contains('channel.guild-2', 'channel-1'), false);
	});

	test('propagates bulk failures without leaving an orphaned entry', () => {
		const adapter = createTestAdapter(kind, {
			encode(data) {
				if (data.id === 'user-2') throw new Error('encode failed');
				return data;
			},
		});

		expect(() =>
			adapter.bulkSet([
				['user.user-1', { id: 'user-1' }, ['user', 'user-1']],
				['user.user-2', { id: 'user-2' }, ['user', 'user-2']],
				['user.user-3', { id: 'user-3' }, ['user', 'user-3']],
			]),
		).toThrow('encode failed');
		assert.equal(adapter.get('user.user-2'), null);
		assert.equal(adapter.contains('user', 'user-2'), false);
		for (const id of ['user-1', 'user-3']) {
			assert.equal(adapter.contains('user', id), adapter.get(`user.${id}`) !== null);
		}
	});

	test('patch decode failures leave both value and relationship untouched', () => {
		let rejectDecode = false;
		const adapter = createTestAdapter(kind, {
			decode(data) {
				if (rejectDecode) throw new Error('decode failed');
				return data;
			},
		});
		adapter.set(...channelWrite('guild-1', 'old'));

		rejectDecode = true;
		expect(() => adapter.patch(...channelWrite('guild-2', 'new'))).toThrow('decode failed');
		rejectDecode = false;
		assert.equal((adapter.get('channel.channel-1') as { name: string }).name, 'old');
		assert.equal(adapter.contains('channel.guild-1', 'channel-1'), true);
		assert.equal(adapter.contains('channel.guild-2', 'channel-1'), false);
	});
});

describe('limited memory cache adapter ownership', () => {
	test('resolves patch and removal across guild-keyed buckets', () => {
		const adapter = new LimitedMemoryAdapter();
		adapter.bulkSet([
			['member.guild-1.user-1', { id: 'user-1', guild_id: 'guild-1', nick: 'uno' }, ['member.guild-1', 'user-1']],
			['member.guild-2.user-2', { id: 'user-2', guild_id: 'guild-2', nick: 'dos' }, ['member.guild-2', 'user-2']],
		]);

		adapter.patch('member.guild-2.user-2', { nick: 'updated' }, ['member.guild-2', 'user-2']);
		assert.equal((adapter.get('member.guild-2.user-2') as { nick: string }).nick, 'updated');
		assert.equal(adapter.keyToStorage.size, 0);

		adapter.remove('member.guild-2.user-2');
		assert.equal(adapter.get('member.guild-2.user-2'), null);
		assert.equal(adapter.contains('member.guild-2', 'user-2'), false);
	});

	test('moves a globally keyed resource between bucket-owned relationships', () => {
		const adapter = new LimitedMemoryAdapter();
		adapter.set(...channelWrite('guild-1'));
		adapter.set(...channelWrite('guild-2'));

		assert.equal(adapter.contains('channel.guild-1', 'channel-1'), false);
		assert.equal(adapter.contains('channel.guild-2', 'channel-1'), true);
		assert.deepEqual(adapter.keys('channel.guild-2'), ['channel.channel-1']);
		assert.equal(adapter.storage.size, 1);
		assert.equal(adapter.relationships.size, 0);
	});

	test('keeps an explicit secondary index when message ownership differs from storage', () => {
		const adapter = new LimitedMemoryAdapter();
		adapter.set(
			'message.message-1',
			{ id: 'message-1', guild_id: 'guild-1', channel_id: 'channel-1' },
			['message.channel-1', 'message-1'],
		);
		adapter.set(
			'message.message-1',
			{ id: 'message-1', guild_id: 'guild-1', channel_id: 'channel-2' },
			['message.channel-2', 'message-1'],
		);

		assert.equal(adapter.contains('message.channel-1', 'message-1'), false);
		assert.equal(adapter.contains('message.channel-2', 'message-1'), true);
		assert.deepEqual(adapter.keys('message.channel-2'), ['message.message-1']);
		assert.equal(adapter.relationships.size, 1);
	});

	test('removes an unscoped message after moving it into guild storage', () => {
		const adapter = new LimitedMemoryAdapter();
		adapter.set(
			'message.message-1',
			{ id: 'message-1', channel_id: 'channel-1' },
			['message.channel-1', 'message-1'],
		);
		adapter.set(
			'message.message-1',
			{ id: 'message-1', guild_id: 'guild-1', channel_id: 'channel-1' },
			['message.channel-1', 'message-1'],
		);

		assert.equal(adapter.storage.has('message'), false);
		assert.equal(adapter.storage.get('message.guild-1')?.size, 1);

		adapter.remove('message.message-1');

		assert.equal(adapter.get('message.message-1'), null);
		assert.equal(adapter.contains('message.channel-1', 'message-1'), false);
		assert.equal(adapter.storage.size, 0);
		assert.equal(adapter.keyToStorage.size, 0);
	});

	test('does not allocate relationship sets for bucket-owned resources', () => {
		const adapter = new LimitedMemoryAdapter();
		adapter.set(...channelWrite('guild-1'));

		assert.equal(adapter.count('channel.guild-1'), 1);
		assert.deepEqual(adapter.getToRelationship('channel.guild-1'), ['channel-1']);
		assert.equal(adapter.relationships.size, 0);
	});

	test('removes expired buckets and their global indexes', () => {
		vi.useFakeTimers();
		try {
			const adapter = new LimitedMemoryAdapter({ default: { expire: 100 } });
			adapter.set(...channelWrite('guild-1'));
			vi.advanceTimersByTime(100);
			assert.equal(adapter.get('channel.channel-1'), null);
			assert.equal(adapter.storage.size, 0);
			assert.equal(adapter.keyToStorage.size, 0);
			assert.equal(adapter.count('channel.guild-1'), 0);
		} finally {
			vi.useRealTimers();
		}
	});

	test('flush disposes all limited collection timers', () => {
		vi.useFakeTimers();
		try {
			const adapter = new LimitedMemoryAdapter({ default: { expire: 100 } });
			adapter.set(...channelWrite('guild-1'));
			assert.equal(vi.getTimerCount(), 1);
			adapter.flush();
			assert.equal(vi.getTimerCount(), 0);
		} finally {
			vi.useRealTimers();
		}
	});

	test.each(['decode', 'encode'] as const)('a failed patch does not refresh expiration when %s throws', failure => {
		vi.useFakeTimers();
		try {
			let reject = false;
			const adapter = new LimitedMemoryAdapter({
				default: { expire: 100 },
				encode(data) {
					if (reject && failure === 'encode') throw new Error('encode failed');
					return data;
				},
				decode(data) {
					if (reject && failure === 'decode') throw new Error('decode failed');
					return data;
				},
			});
			adapter.set(...channelWrite('guild-1', 'old'));
			vi.advanceTimersByTime(80);

			reject = true;
			expect(() => adapter.patch(...channelWrite('guild-1', 'new'))).toThrow(`${failure} failed`);
			vi.advanceTimersByTime(21);

			assert.equal(adapter.storage.size, 0);
			assert.equal(adapter.contains('channel.guild-1', 'channel-1'), false);
		} finally {
			vi.useRealTimers();
		}
	});

	test('does not retain a value or relationship when its limit rejects it', () => {
		const adapter = new LimitedMemoryAdapter({ default: { limit: 0 } });
		adapter.set(...channelWrite('guild-1'));
		assert.equal(adapter.storage.size, 0);
		assert.equal(adapter.keyToStorage.size, 0);
		assert.equal(adapter.contains('channel.guild-1', 'channel-1'), false);
	});

	test.each([
		['root', 'custom', { id: 'entry-1', guild_id: 'ignored' }],
		['guild related', 'custom.guild-1', { id: 'entry-1', guild_id: 'guild-1' }],
	] as const)('evicts custom %s relationships from their owning bucket', (_label, to, first) => {
		const adapter = new LimitedMemoryAdapter({ default: { limit: 1 } });
		adapter.set('custom.entry-1', first, [to, 'entry-1']);
		adapter.set('custom.entry-2', { ...first, id: 'entry-2' }, [to, 'entry-2']);

		assert.equal(adapter.get('custom.entry-1'), null);
		assert.equal(adapter.contains(to, 'entry-1'), false);
		assert.equal(adapter.contains(to, 'entry-2'), true);
	});

	test('moves a custom relationship between owners', () => {
		const adapter = new LimitedMemoryAdapter();
		adapter.set('custom.entry', { id: 'entry' }, ['custom.guild-1', 'entry']);
		adapter.set('custom.entry', { id: 'entry', owner: 'guild-2' }, ['custom.guild-2', 'entry']);

		assert.equal(adapter.contains('custom.guild-1', 'entry'), false);
		assert.deepEqual(adapter.getToRelationship('custom.guild-2'), ['entry']);
		assert.deepEqual(adapter.get('custom.entry'), { id: 'entry', owner: 'guild-2' });
	});

	test('stores empty array resources in the relationship-owned bucket', () => {
		const adapter = new LimitedMemoryAdapter();
		adapter.set('overwrite.channel-1', [], ['overwrite.guild-1', 'channel-1']);
		assert.deepEqual(adapter.get('overwrite.channel-1'), []);
		assert.equal(adapter.contains('overwrite.guild-1', 'channel-1'), true);
	});

	test('message removal does not decode its stored value', () => {
		let rejectDecode = false;
		const adapter = new LimitedMemoryAdapter({
			encode: data => data,
			decode(data) {
				if (rejectDecode) throw new Error('decode failed');
				return data;
			},
		});
		adapter.set(
			'message.message-1',
			{ id: 'message-1', guild_id: 'guild-1', channel_id: 'channel-1' },
			['message.channel-1', 'message-1'],
		);

		rejectDecode = true;
		adapter.remove('message.message-1');
		assert.equal(adapter.contains('message.channel-1', 'message-1'), false);
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
			getRC: () => ({ locations: { base: 'src-a' }, intents, token: 'token-a' }),
		});
		const clientB = new BaseClient({
			getRC: () => ({ locations: { base: 'src-b' }, intents: 0, token: 'token-b' }),
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
