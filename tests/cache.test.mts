// biome-ignore assist/source/organizeImports: The root entrypoint must initialize before BaseClient to avoid the client barrel cycle.
import {
	apiMember,
	apiMessage,
	apiUser,
	apiVoiceState,
	chatInputInteraction,
	messageCommandInteraction,
} from '@slipher/testing';
import { assert, describe, expect, test, vi } from 'vitest';
import {
	Cache,
	CacheFrom,
	Client,
	GatewayDispatchEvents,
	InteractionType,
	LimitedMemoryAdapter,
	MemoryAdapter,
	PresenceUpdateStatus,
} from '../src/index';
import type { APIUser, DisabledCache, PresenceUpdateReceiveStatus } from '../src/index';
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
			[CacheFrom.Test, 'users', { id: 'user-1', username: 'user', discriminator: '0', avatar: null }, 'user-1'],
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

describe.each(adapterKinds)('%s guild-scoped presences', kind => {
	test('keeps one independently mutable entry per guild', async () => {
		const client: any = {};
		const cache = new Cache(0, createTestAdapter(kind), {}, client);
		client.cache = cache;

		await cache.bulkSet([
			[CacheFrom.Test, 'presences', presenceData('guild-1', PresenceUpdateStatus.Online), 'user-1', 'guild-1'],
			[CacheFrom.Test, 'presences', presenceData('guild-2', PresenceUpdateStatus.Idle), 'user-1', 'guild-2'],
		]);

		expect(
			await cache.bulkGet([
				['presences', 'user-1', 'guild-1'],
				['presences', 'user-1', 'guild-2'],
			]),
		).toEqual({
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
		await cache.presences?.set(CacheFrom.Test, 'user-1', 'guild-2', presenceData('guild-2', PresenceUpdateStatus.Idle));
		await cache.guilds?.remove('guild-1');

		expect(await cache.presences?.get('user-1', 'guild-1')).toBeNull();
		expect(await cache.presences?.get('user-1', 'guild-2')).toMatchObject({ status: 'idle' });
	});

	test('member removal removes only that guild presence', async () => {
		const client: any = {};
		const cache = new Cache(0, createTestAdapter(kind), {}, client);
		client.cache = cache;
		await cache.presences?.set(
			CacheFrom.Test,
			'user-1',
			'guild-1',
			presenceData('guild-1', PresenceUpdateStatus.Online),
		);
		await cache.presences?.set(CacheFrom.Test, 'user-1', 'guild-2', presenceData('guild-2', PresenceUpdateStatus.Idle));

		await cache.onPacket({
			d: {
				guild_id: 'guild-1',
				user: { avatar: null, discriminator: '0', global_name: null, id: 'user-1', username: 'user' },
			},
			op: 0,
			s: 1,
			t: GatewayDispatchEvents.GuildMemberRemove,
		});

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
		await cache.presences?.set(CacheFrom.Test, 'user-1', 'guild-2', presenceData('guild-2', PresenceUpdateStatus.Idle));

		const [, previous] = await PRESENCE_UPDATE(
			client,
			presenceData('guild-1', PresenceUpdateStatus.DoNotDisturb) as Parameters<typeof PRESENCE_UPDATE>[1],
		);

		expect(previous).toMatchObject({ guild_id: 'guild-1', status: 'online' });
	});
});

describe.each(adapterKinds)('%s custom cache routing', kind => {
	test.each([['guild indexed', 'custom.entry', ['custom.guild-1', 'entry'], true]] as const)(
		'routes a %s entry',
		(_layout, key, relationship, indexed) => {
			const adapter = createTestAdapter(kind);
			adapter.set(key, { id: 'entry' }, relationship);

			assert.deepEqual(adapter.get(key), { id: 'entry' });
			assert.deepEqual(adapter.keys(relationship[0]), [key]);
			assert.equal(adapter.contains(relationship[0], relationship[1]), true);
			assert.equal(adapter.keyToStorage.size, indexed ? 1 : 0);

			adapter.remove(key);
			assert.equal(adapter.get(key), null);
			assert.equal(adapter.contains(relationship[0], relationship[1]), false);
		},
	);
});

describe.each(adapterKinds)('%s relationship removal', kind => {
	test.each([
		['user.', 'user'],
		['channel.', 'channel.guild-1'],
	] as const)('removes only selected entries from %s', (prefix, relationship) => {
		const adapter = createTestAdapter(kind);
		adapter.set(`${prefix}first`, { id: 'first' }, [relationship, 'first']);
		adapter.set(`${prefix}second`, { id: 'second' }, [relationship, 'second']);

		adapter.removeToRelationship(relationship, 'first');
		assert.equal(adapter.get(`${prefix}first`), null);
		assert.equal(adapter.contains(relationship, 'first'), false);
		assert.deepEqual(adapter.keys(relationship), [`${prefix}second`]);
		assert.deepEqual(adapter.get(`${prefix}second`), { id: 'second' });

		adapter.removeToRelationship(relationship, ['missing', 'second']);
		assert.equal(adapter.count(relationship), 0);
		assert.equal(adapter.get(`${prefix}second`), null);
		assert.equal(adapter.storage.size, 0);
		assert.equal(adapter.keyToStorage.size, 0);
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
		['guild related', 'channel.channel-1', { id: 'channel-1', guild_id: 'guild-1' }, 'channel.guild-1', 'channel-1'],
		['message', 'message.message-1', { id: 'message-1', guild_id: 'guild-1' }, 'message.channel-1', 'message-1'],
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

	test('preserves the old value when a replacement cannot encode', () => {
		let reject = false;
		const adapter = createTestAdapter(kind, {
			encode(data) {
				if (reject) throw new Error('encode failed');
				return data;
			},
		});
		adapter.set(...channelWrite('guild-1', 'old'));

		reject = true;
		expect(() => adapter.set(...channelWrite('guild-1', 'new'))).toThrow('encode failed');
		assert.equal((adapter.get('channel.channel-1') as { name: string }).name, 'old');
		assert.equal(adapter.contains('channel.guild-1', 'channel-1'), true);
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

	test('patch decode failures leave the value untouched', () => {
		let rejectDecode = false;
		const adapter = createTestAdapter(kind, {
			decode(data) {
				if (rejectDecode) throw new Error('decode failed');
				return data;
			},
		});
		adapter.set(...channelWrite('guild-1', 'old'));

		rejectDecode = true;
		expect(() => adapter.patch(...channelWrite('guild-1', 'new'))).toThrow('decode failed');
		rejectDecode = false;
		assert.equal((adapter.get('channel.channel-1') as { name: string }).name, 'old');
		assert.equal(adapter.contains('channel.guild-1', 'channel-1'), true);
	});
});

describe('limited memory cache adapter ownership', () => {
	test('relocates message storage without changing its relationship owner', () => {
		const adapter = new LimitedMemoryAdapter();
		adapter.set('message.message-1', { id: 'message-1', channel_id: 'channel-1' }, ['message.channel-1', 'message-1']);
		adapter.patch('message.message-1', { guild_id: 'guild-1' }, ['message.channel-1', 'message-1']);

		assert.equal(adapter.storage.has('message'), false);
		assert.equal(adapter.storage.get('message.guild-1')?.size, 1);
		assert.deepEqual(adapter.get('message.message-1'), {
			id: 'message-1',
			guild_id: 'guild-1',
			channel_id: 'channel-1',
		});
		assert.equal(adapter.contains('message.channel-1', 'message-1'), true);

		adapter.remove('message.message-1');
		assert.equal(adapter.get('message.message-1'), null);
		assert.equal(adapter.contains('message.channel-1', 'message-1'), false);
		assert.equal(adapter.storage.size, 0);
		assert.equal(adapter.keyToStorage.size, 0);
		assert.equal(adapter.relationships.size, 0);
	});

	test('preserves distinct physical and relationship message IDs', () => {
		const adapter = new LimitedMemoryAdapter();
		adapter.set('message.physical-id', { id: 'physical-id', guild_id: 'guild-1', channel_id: 'channel-1' }, [
			'message.channel-1',
			'relationship-id',
		]);

		assert.deepEqual(adapter.keys('message.channel-1'), ['message.physical-id']);
		assert.deepEqual(adapter.getToRelationship('message.channel-1'), ['relationship-id']);

		adapter.removeToRelationship('message.channel-1', 'relationship-id');
		assert.equal(adapter.get('message.physical-id'), null);
		assert.equal(adapter.count('message.channel-1'), 0);
		assert.equal(adapter.keyToStorage.size, 0);

		adapter.set('message.physical-id', { id: 'physical-id', guild_id: 'guild-1', channel_id: 'channel-1' }, [
			'message.channel-1',
			'relationship-id',
		]);
		adapter.removeRelationship('message.channel-1');
		assert.equal(adapter.get('message.physical-id'), null);
		assert.equal(adapter.relationships.size, 0);
	});

	test('cleans message indexes and relationships when their bucket evicts them', () => {
		const adapter = new LimitedMemoryAdapter({ message: { limit: 1 } });
		adapter.set('message.message-1', { id: 'message-1', guild_id: 'guild-1', channel_id: 'channel-1' }, [
			'message.channel-1',
			'message-1',
		]);
		adapter.set('message.message-2', { id: 'message-2', guild_id: 'guild-1', channel_id: 'channel-1' }, [
			'message.channel-1',
			'message-2',
		]);

		assert.equal(adapter.get('message.message-1'), null);
		assert.equal(adapter.contains('message.channel-1', 'message-1'), false);
		assert.equal(adapter.get('message.message-2') !== null, true);
		assert.equal(adapter.contains('message.channel-1', 'message-2'), true);
		assert.equal(adapter.keyToStorage.size, 1);
	});

	test('cleans message indexes and relationships when they expire', () => {
		vi.useFakeTimers();
		try {
			const adapter = new LimitedMemoryAdapter({ message: { expire: 100 } });
			adapter.set('message.message-1', { id: 'message-1', guild_id: 'guild-1', channel_id: 'channel-1' }, [
				'message.channel-1',
				'message-1',
			]);

			vi.advanceTimersByTime(100);

			assert.equal(adapter.get('message.message-1'), null);
			assert.equal(adapter.contains('message.channel-1', 'message-1'), false);
			assert.equal(adapter.storage.size, 0);
			assert.equal(adapter.keyToStorage.size, 0);
			assert.equal(adapter.relationships.size, 0);
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
		adapter.set('message.message-1', { id: 'message-1', guild_id: 'guild-1', channel_id: 'channel-1' }, [
			'message.channel-1',
			'message-1',
		]);

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

describe.each(adapterKinds)('gateway actor hydration with %s', kind => {
	function createCache(disabledCache: DisabledCache = {}) {
		const client = new Client();
		client.setServices({ cache: { adapter: createTestAdapter(kind), disabledCache } });
		return client.cache;
	}

	test.each([
		InteractionType.ApplicationCommand,
		InteractionType.ApplicationCommandAutocomplete,
		InteractionType.MessageComponent,
		InteractionType.ModalSubmit,
	])('merges actor data without persisting channel permissions for interaction type %s', async type => {
		const cache = createCache();
		const user = apiUser({ avatar: 'existing-avatar' });
		await cache.members?.set(CacheFrom.Test, user.id, 'guild-1', {
			...apiMember({ user, nick: 'old-nick' }),
			deaf: true,
			mute: true,
		});
		const packet = {
			t: 'INTERACTION_CREATE',
			d: {
				type,
				guild_id: 'guild-1',
				member: {
					user: { id: user.id, username: 'updated' },
					roles: ['role-1'],
					nick: null,
					permissions: '8',
				},
			},
		};
		const original = structuredClone(packet);

		await cache.onPacket(packet as never);

		expect(await cache.members?.raw(user.id, 'guild-1')).toMatchObject({
			user: { id: user.id, username: 'updated', avatar: 'existing-avatar' },
			roles: ['role-1'],
			nick: null,
			deaf: true,
			mute: true,
		});
		expect(await cache.members?.get(user.id, 'guild-1')).not.toHaveProperty('permissions');
		expect(packet).toEqual(original);
	});

	test('hydrates DM users without creating a guild member and accepts actorless pings', async () => {
		const cache = createCache();
		const interaction = chatInputInteraction({ name: 'probe', guildId: null });

		await cache.onPacket({ t: 'INTERACTION_CREATE', d: interaction } as never);
		await cache.onPacket({ t: 'INTERACTION_CREATE', d: { type: InteractionType.Ping } } as never);

		expect(await cache.users?.raw(interaction.user!.id)).toMatchObject(interaction.user!);
		expect(await cache.members?.count('*')).toBe(0);
		expect(await cache.users?.count()).toBe(1);
	});

	test.each([
		{ disabled: { users: true }, users: 0, members: 1 },
		{ disabled: { members: true }, users: 1, members: 0 },
		{ disabled: { onPacket: true }, users: 0, members: 0 },
	])('respects disabled resources: $disabled', async ({ disabled, users, members }) => {
		const cache = createCache(disabled);
		const interaction = chatInputInteraction({ name: 'probe', guildId: 'guild-1' });

		await cache.onPacket({ t: 'INTERACTION_CREATE', d: interaction } as never);

		expect((await cache.users?.count()) ?? 0).toBe(users);
		expect((await cache.members?.count('guild-1')) ?? 0).toBe(members);
	});

	test('applies each resource filter independently with gateway provenance', async () => {
		const cache = createCache();
		const interaction = chatInputInteraction({ name: 'probe', guildId: 'guild-1' });
		const userId = interaction.member!.user.id;
		const userFilter = vi.fn(() => false);
		const memberFilter = vi.fn((data: { user?: APIUser }) => Boolean(data.user?.id));
		cache.users!.filter = userFilter;
		cache.members!.filter = memberFilter;

		await cache.onPacket({ t: 'INTERACTION_CREATE', d: interaction } as never);

		expect(await cache.users?.count()).toBe(0);
		expect(await cache.members?.count('guild-1')).toBe(1);
		expect(userFilter).toHaveBeenCalledWith(interaction.member!.user, userId, CacheFrom.Gateway);
		expect(memberFilter).toHaveBeenCalledWith(
			expect.not.objectContaining({ permissions: expect.anything() }),
			userId,
			'guild-1',
			CacheFrom.Gateway,
		);
		expect(memberFilter).toHaveBeenCalledWith(
			expect.objectContaining({ user: interaction.member!.user }),
			userId,
			'guild-1',
			CacheFrom.Gateway,
		);
	});

	test.each(['MESSAGE_CREATE', 'MESSAGE_UPDATE'] as const)(
		'%s hydrates the author and member when messages are disabled',
		async t => {
			const cache = createCache({ messages: true });
			const message = apiMessage({ guildId: 'guild-1' });
			const { user: _user, ...member } = apiMember({ user: message.author, nick: 'author-nick' });

			await cache.onPacket({ t, d: { ...message, member } } as never);

			expect(await cache.users?.raw(message.author.id)).toMatchObject(message.author);
			expect(await cache.members?.get(message.author.id, 'guild-1')).toMatchObject({
				user: { id: message.author.id },
				nick: 'author-nick',
			});
			expect(cache.messages).toBeUndefined();
		},
	);

	test('partial message updates preserve the author and member already cached', async () => {
		const cache = createCache();
		const message = apiMessage({ guildId: 'guild-1', content: 'old' });
		const { user: _user, ...member } = apiMember({ user: message.author });
		await cache.onPacket({ t: 'MESSAGE_CREATE', d: { ...message, member } } as never);

		await cache.onPacket({
			t: 'MESSAGE_UPDATE',
			d: { id: message.id, channel_id: message.channel_id, content: 'new' },
		} as never);

		expect(await cache.messages?.get(message.id)).toMatchObject({
			content: 'new',
			author: { id: message.author.id },
		});
		expect(await cache.members?.get(message.author.id, 'guild-1')).toMatchObject({ user: { id: message.author.id } });
	});

	test.each(['MESSAGE_CREATE', 'MESSAGE_UPDATE'] as const)(
		'%s merges mentioned members independently of message caching and author presence',
		async t => {
			const cache = createCache({ messages: true });
			const mentioned = apiUser({ avatar: 'existing-avatar' });
			const userOnly = apiUser();
			await cache.members?.set(CacheFrom.Test, mentioned.id, 'guild-1', {
				...apiMember({ user: mentioned }),
				mute: true,
			});
			const packet = {
				t,
				d: {
					id: 'message-1',
					channel_id: 'channel-1',
					guild_id: 'guild-1',
					mentions: [{ id: mentioned.id, username: 'updated', member: { nick: null, roles: ['role-1'] } }, userOnly],
				},
			};
			const original = structuredClone(packet);

			await cache.onPacket(packet as never);

			expect(await cache.members?.raw(mentioned.id, 'guild-1')).toMatchObject({
				user: { id: mentioned.id, username: 'updated', avatar: 'existing-avatar' },
				mute: true,
				roles: ['role-1'],
				nick: null,
			});
			expect(await cache.users?.raw(mentioned.id)).not.toHaveProperty('member');
			expect(await cache.users?.raw(userOnly.id)).toMatchObject(userOnly);
			expect(await cache.members?.count('guild-1')).toBe(1);
			expect(packet).toEqual(original);
		},
	);

	test.each([
		InteractionType.ApplicationCommand,
		InteractionType.ApplicationCommandAutocomplete,
		InteractionType.MessageComponent,
		InteractionType.ModalSubmit,
	])('merges resolved users and members for interaction type %s without storing permissions', async type => {
		const cache = createCache();
		const actor = apiUser({ username: 'actor' });
		const target = apiUser({ avatar: 'target-avatar' });
		await cache.members?.set(CacheFrom.Test, target.id, 'guild-1', {
			...apiMember({ user: target }),
			deaf: true,
			mute: true,
		});
		const interaction = {
			...chatInputInteraction({ name: 'probe', guildId: 'guild-1', user: actor }),
			type,
			data: {
				resolved: {
					users: {
						[target.id]: { id: target.id, username: 'resolved-target' },
						[actor.id]: { ...actor, username: 'resolved-actor' },
					},
					members: { [target.id]: { nick: null, roles: ['role-1'], permissions: '8' } },
				},
			},
		};
		const original = structuredClone(interaction);

		await cache.onPacket({ t: 'INTERACTION_CREATE', d: interaction } as never);

		expect(await cache.members?.raw(target.id, 'guild-1')).toMatchObject({
			user: { id: target.id, username: 'resolved-target', avatar: 'target-avatar' },
			deaf: true,
			mute: true,
			nick: null,
			roles: ['role-1'],
		});
		expect(await cache.members?.get(target.id, 'guild-1')).not.toHaveProperty('permissions');
		expect(await cache.users?.raw(actor.id)).toMatchObject({ username: 'actor' });
		expect(interaction).toEqual(original);
	});

	test('hydrates authors and mentions from a resolved context-menu message', async () => {
		const cache = createCache({ messages: true });
		const mentioned = apiUser();
		const target = { ...apiMessage({ guildId: 'guild-1' }), mentions: [mentioned] };
		const interaction = messageCommandInteraction({ name: 'probe', guildId: 'guild-1', target });
		const original = structuredClone(interaction);

		await cache.onPacket({ t: 'INTERACTION_CREATE', d: interaction } as never);

		expect(await cache.users?.raw(target.author.id)).toMatchObject(target.author);
		expect(await cache.users?.raw(mentioned.id)).toMatchObject(mentioned);
		expect(interaction).toEqual(original);
	});

	test.each(['MESSAGE_REACTION_ADD', 'TYPING_START', 'VOICE_STATE_UPDATE'] as const)(
		'%s hydrates received members without message or voice-state caching and ignores ID-only actors',
		async t => {
			const cache = createCache({ messages: true, voiceStates: true });
			const member = apiMember({ nick: 'observed' });
			const packet = {
				t,
				d: { user_id: member.user.id, guild_id: 'guild-1', channel_id: 'channel-1', member },
			};
			const original = structuredClone(packet);

			await cache.onPacket(packet as never);
			await cache.onPacket({ t, d: { user_id: 'unknown', guild_id: 'guild-1', channel_id: 'channel-1' } } as never);

			expect(await cache.members?.get(member.user.id, 'guild-1')).toMatchObject({
				nick: 'observed',
				user: { id: member.user.id },
			});
			expect(await cache.users?.raw('unknown')).toBeUndefined();
			expect(await cache.users?.count()).toBe(1);
			expect(packet).toEqual(original);
		},
	);

	test('voice snapshots replace optional fields and disconnects preserve the received member', async () => {
		const cache = createCache();
		const member = apiMember();
		const state = {
			...apiVoiceState({ userId: member.user.id, channelId: 'channel-1' }),
			guild_id: 'guild-1',
		};
		await cache.onPacket({ t: 'VOICE_STATE_UPDATE', d: { ...state, self_stream: true, member } } as never);

		const { self_stream: _stream, ...nextState } = state;
		await cache.onPacket({ t: 'VOICE_STATE_UPDATE', d: nextState } as never);
		expect(await cache.voiceStates?.raw(member.user.id, 'guild-1')).not.toHaveProperty('self_stream');

		await cache.onPacket({
			t: 'VOICE_STATE_UPDATE',
			d: { ...state, channel_id: null, member: { ...member, nick: 'disconnected' } },
		} as never);

		expect(await cache.voiceStates?.raw(member.user.id, 'guild-1')).toBeFalsy();
		expect(await cache.members?.get(member.user.id, 'guild-1')).toMatchObject({
			nick: 'disconnected',
			user: { id: member.user.id },
		});
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
