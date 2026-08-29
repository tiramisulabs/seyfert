import { createMockBot, mockWorld, Routes } from '@slipher/testing';
import { describe, expect, test } from 'vitest';

describe('MessageShorter', () => {
	test('list accepts omitted fetch options and uses the channel messages route', async () => {
		const world = mockWorld();
		const guild = world.registerGuild();
		const channel = world.registerChannel(guild.id);
		const message = world.registerMessage(channel.id, { content: 'hello' });
		await using bot = await createMockBot({ world });

		const result = await bot.client.messages.list(channel.id);

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({ id: message.id, channelId: channel.id, content: 'hello' });
		expect(await bot.client.cache.messages?.raw(message.id)).toMatchObject({
			id: message.id,
			channel_id: channel.id,
			content: 'hello',
		});
		expect(bot.restCalls(Routes.fetchMessages)).toContainEqual(
			expect.objectContaining({ params: { channelId: channel.id }, query: undefined }),
		);
	});

	test('channel message listing delegates to the canonical cached message API', async () => {
		const world = mockWorld();
		const guild = world.registerGuild();
		const channel = world.registerChannel(guild.id);
		const message = world.registerMessage(channel.id, { content: 'delegated' });
		await using bot = await createMockBot({ world });

		const result = await bot.client.channels.fetchMessages(channel.id);

		expect(result[0]).toMatchObject({ id: message.id, channelId: channel.id, content: 'delegated' });
		expect(await bot.client.cache.messages?.raw(message.id)).toMatchObject({
			id: message.id,
			channel_id: channel.id,
			content: 'delegated',
		});
		expect(bot.restCalls(Routes.fetchMessages)).toHaveLength(1);
	});
});
