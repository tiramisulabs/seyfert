import { assert, describe, test } from 'vitest';
import { Client, LimitedMemoryAdapter, MemoryAdapter } from '../lib/index';

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
});
