import { describe, expect, test, vi } from 'vitest';
import { Message } from '../src/structures/Message';
import { MessageType } from '../src/types';

const channelId = '123456789012345678';
const guildId = '223456789012345678';
const messageId = '323456789012345678';

function createMessage() {
	const write = vi.fn().mockResolvedValue({ id: '423456789012345678' });
	const message = new Message(
		{
			messages: { write },
		} as never,
		{
			id: messageId,
			channel_id: channelId,
			guild_id: guildId,
			author: {
				id: '523456789012345678',
				username: 'reply-author',
				discriminator: '0001',
				global_name: null,
				avatar: null,
			},
			content: 'source message',
			timestamp: '2026-06-17T12:30:00.000000+00:00',
			edited_timestamp: null,
			tts: false,
			mention_everyone: false,
			mentions: [],
			mention_roles: [],
			attachments: [],
			embeds: [],
			pinned: false,
			type: MessageType.Default,
		} as never,
	);

	return { message, write };
}

describe('Message.reply', () => {
	test('uses fail_if_not_exists from the body without forwarding it as a top-level field', async () => {
		const { message, write } = createMessage();

		await message.reply({ content: 'body option', fail_if_not_exists: false });

		const body = write.mock.calls[0]?.[1];
		expect(write).toHaveBeenCalledWith(channelId, {
			content: 'body option',
			message_reference: {
				message_id: messageId,
				channel_id: channelId,
				guild_id: guildId,
				fail_if_not_exists: false,
			},
		});
		expect(body).not.toHaveProperty('fail_if_not_exists');
	});

	test('keeps the positional fail argument for compatibility', async () => {
		const { message, write } = createMessage();

		await message.reply({ content: 'positional option' }, false);

		expect(write).toHaveBeenCalledWith(channelId, {
			content: 'positional option',
			message_reference: {
				message_id: messageId,
				channel_id: channelId,
				guild_id: guildId,
				fail_if_not_exists: false,
			},
		});
	});

	test('prefers the body fail_if_not_exists value over the positional argument', async () => {
		const { message, write } = createMessage();

		await message.reply({ content: 'body wins', fail_if_not_exists: false }, true);

		const body = write.mock.calls[0]?.[1];
		expect(write).toHaveBeenCalledWith(channelId, {
			content: 'body wins',
			message_reference: {
				message_id: messageId,
				channel_id: channelId,
				guild_id: guildId,
				fail_if_not_exists: false,
			},
		});
		expect(body).not.toHaveProperty('fail_if_not_exists');
	});
});
