import { assert, describe, test } from 'vitest';
import { Cache, CacheFrom, Client, LimitedMemoryAdapter, MemoryAdapter } from '../src/index';

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
		assert.equal(await cache.users?.raw(message.author.id), message.author);
	});

});
