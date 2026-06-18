import { describe, expect, test, vi } from 'vitest';
import { MessageShorter } from '../lib/common/shorters/messages';

const channelId = '100000000000000001';

const messageData = {
	id: '200000000000000002',
	channel_id: channelId,
	author: {
		id: '300000000000000003',
		username: 'alice',
		discriminator: '0000',
		avatar: null,
		global_name: null,
	},
	content: 'hello',
	embeds: [],
	attachments: [],
	mentions: [],
	mention_roles: [],
	mention_everyone: false,
	pinned: false,
	tts: false,
	timestamp: '2026-01-01T00:00:00.000Z',
	type: 0,
	flags: 0,
	components: [],
} as any;

describe('MessageShorter', () => {
	test('list accepts omitted fetch options and uses the channel messages proxy route', async () => {
		const get = vi.fn().mockResolvedValue([messageData]);
		const fetchMessages = vi.fn();
		const client = {
			proxy: {
				channels(id: string) {
					expect(id).toBe(channelId);
					return { messages: { get } };
				},
			},
			channels: { fetchMessages },
			cache: { adapter: { isAsync: false } },
			components: {},
			rest: { cdn: {} },
			options: {},
		} as any;

		const result = await new MessageShorter(client).list(channelId);

		expect(result).toHaveLength(1);
		expect(get).toHaveBeenCalledWith({ query: undefined });
		expect(fetchMessages).not.toHaveBeenCalled();
	});
});
