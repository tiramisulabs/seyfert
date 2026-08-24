import { Routes, createMockBot, mockWorld } from '@slipher/testing';
import { describe, expect, test } from 'vitest';
import { Message } from '../lib';

describe('ChannelShorter.pins', () => {
	test('returns pinnedAt as unix milliseconds while preserving message transformation', async () => {
		const world = mockWorld();
		const guild = world.registerGuild({ everyonePermissions: ['ManageMessages'] });
		const channel = world.registerChannel(guild.id);
		const message = world.registerMessage(channel.id, { content: 'pinned message' });
		const pinnedAt = '2026-06-17T12:34:56.789000+00:00';
		await using bot = await createMockBot({ world });

		await bot.client.channels.setPin(message.id, channel.id, 'keep this');
		bot.rest.intercept(Routes.fetchPins, () => ({
			has_more: false,
			items: [{ message, pinned_at: pinnedAt }],
		}));
		const pins = await bot.client.channels.pins(channel.id);

		expect(pins.items).toHaveLength(1);
		expect(pins.items[0]?.pinnedAt).toBe(Date.parse(pinnedAt));
		expect(pins.items[0]?.message).toBeInstanceOf(Message);
		expect(pins.items[0]?.message).toMatchObject({
			id: message.id,
			channelId: message.channel_id,
			timestamp: Date.parse(message.timestamp),
		});
		expect(bot.world.get.pin({ channelId: channel.id, messageId: message.id }).content).toBe('pinned message');
		expect(bot.restCalls(Routes.pinMessage)).toContainEqual(
			expect.objectContaining({
				params: { channelId: channel.id, messageId: message.id },
				reason: 'keep this',
			}),
		);
		expect(bot.restCalls(Routes.fetchPins)).toContainEqual(
			expect.objectContaining({ params: { channelId: channel.id } }),
		);
	});
});
