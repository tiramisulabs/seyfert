import { Routes, createMockBot, mockWorld } from '@slipher/testing';
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
		const action = bot.rest.requireAction(Routes.fetchMessages, { channelId: channel.id });
		expect(action.query).toBeUndefined();
	});
});
