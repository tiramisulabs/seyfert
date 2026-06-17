import { describe, expect, test, vi } from 'vitest';
import { ChannelShorter } from '../src/common/shorters/channels';
import { Message } from '../src/structures/Message';
import { MessageType, type APIMessagePin } from '../src/types';

const channelId = '123456789012345678';

function createRawPin(): APIMessagePin {
	return {
		pinned_at: '2026-06-17T12:34:56.789000+00:00',
		message: {
			id: '223456789012345678',
			channel_id: channelId,
			author: {
				id: '323456789012345678',
				username: 'pin-author',
				discriminator: '0001',
				global_name: null,
				avatar: null,
			},
			content: 'pinned message',
			timestamp: '2026-06-17T12:30:00.000000+00:00',
			edited_timestamp: null,
			tts: false,
			mention_everyone: false,
			mentions: [],
			mention_roles: [],
			attachments: [],
			embeds: [],
			pinned: true,
			type: MessageType.Default,
		},
	};
}

function createClient(rawPin: APIMessagePin) {
	const get = vi.fn().mockResolvedValue({ has_more: false, items: [rawPin] });
	const patch = vi.fn().mockResolvedValue(undefined);

	return {
		cache: {
			messages: { patch },
		},
		proxy: {
			channels(id: string) {
				expect(id).toBe(channelId);
				return {
					messages: {
						pins: { get },
					},
				};
			},
		},
	};
}

describe('ChannelShorter.pins', () => {
	test('returns pinnedAt as unix milliseconds while preserving message transformation', async () => {
		const rawPin = createRawPin();
		const client = createClient(rawPin);
		const channelShorter = new ChannelShorter(client as never);

		const pins = await channelShorter.pins(channelId);

		expect(typeof rawPin.pinned_at).toBe('string');
		expect(pins.items[0]?.pinnedAt).toBe(Date.parse(rawPin.pinned_at));
		expect(pins.items[0]?.message).toBeInstanceOf(Message);
		expect(pins.items[0]?.message.id).toBe(rawPin.message.id);
		expect(pins.items[0]?.message.channelId).toBe(rawPin.message.channel_id);
		expect(pins.items[0]?.message.timestamp).toBe(Date.parse(rawPin.message.timestamp));
	});
});
