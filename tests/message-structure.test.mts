import { describe, expect, test } from 'vitest';
import { Message } from '../src/structures/Message';
import { ChannelType } from '../src/types';

describe('Message structure', () => {
	test('exposes the message create channel type', () => {
		const message = new Message(
			{} as never,
			{
				id: '1486777868649005056',
				channel_id: '1486777868649005057',
				channel_type: ChannelType.GuildText,
				author: { id: '1486777868649005058' },
				components: [],
				embeds: [],
				mention_roles: [],
				mentions: [],
			} as never,
		);

		expect(message.channelType).toBe(ChannelType.GuildText);
	});
});
