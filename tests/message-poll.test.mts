import { describe, expect, test, vi } from 'vitest';
import { Message } from '../lib';

const channelId = '100000000000000001';
const messageId = '200000000000000002';
const userId = '300000000000000003';

const userData = {
	id: userId,
	username: 'alice',
	discriminator: '0000',
	avatar: null,
	global_name: null,
};

const messageData = {
	id: messageId,
	channel_id: channelId,
	author: userData,
	content: 'poll',
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
	poll: {
		question: { text: 'Pick one' },
		answers: [
			{ answer_id: 1, poll_media: { text: 'One' } },
			{ answer_id: 2, poll_media: { text: 'Two' } },
		],
		expiry: '2026-01-02T00:00:00.000Z',
		allow_multiselect: false,
		layout_type: 1,
		results: { is_finalized: false, answer_counts: [] },
	},
} as any;

const createClient = () => ({
	messages: {
		endPoll: vi.fn().mockResolvedValue({ id: messageId }),
		getAnswerVoters: vi.fn().mockResolvedValue([userData]),
	},
	cache: { adapter: { isAsync: false } },
	components: {},
	rest: { cdn: {} },
	options: {},
});

describe('Message poll helpers', () => {
	test('endPoll delegates to the message shorter with the message channel and id', async () => {
		const client = createClient();
		const message = new Message(client as any, messageData);

		await expect(message.endPoll()).resolves.toEqual({ id: messageId });
		expect(client.messages.endPoll).toHaveBeenCalledWith(channelId, messageId);
	});

	test('getAnswerVoters validates known poll answers when requested', async () => {
		const client = createClient();
		const message = new Message(client as any, messageData);

		await expect(message.getAnswerVoters(1, true)).resolves.toEqual([expect.objectContaining({ id: userId })]);
		expect(client.messages.getAnswerVoters).toHaveBeenCalledWith(channelId, messageId, 1);

		await expect(message.getAnswerVoters(3, true)).rejects.toMatchObject({ code: 'INVALID_ANSWER_ID' });
		expect(client.messages.getAnswerVoters).toHaveBeenCalledTimes(1);
	});

	test('getAnswerVoters delegates when local answer validation is not possible', async () => {
		const client = createClient();
		const { poll: _poll, ...withoutPoll } = messageData;
		const message = new Message(client as any, withoutPoll);

		await expect(message.getAnswerVoters(3, true)).resolves.toEqual([expect.objectContaining({ id: userId })]);
		expect(client.messages.getAnswerVoters).toHaveBeenCalledWith(channelId, messageId, 3);
	});
});
