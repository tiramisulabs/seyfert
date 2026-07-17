import { Routes, createMockBot, mockWorld } from '@slipher/testing';
import { describe, expect, test } from 'vitest';
import { Command, Declare, Embed, InMessageEmbed, type CommandContext } from '../lib';

const channelEmbedData = { title: 'Forwarded', description: 'from a received message' };
const interactionEmbedData = { title: 'Forwarded', description: 'from an interaction message' };

function forwardedEmbeds(received: InMessageEmbed) {
	return [new Embed({ title: 'Builder' }), { title: 'Raw' }, received];
}

@Declare({ name: 'forward-embeds', description: 'Forward received embeds' })
class ForwardEmbedsCommand extends Command {
	async run(ctx: CommandContext) {
		await ctx.write({ embeds: forwardedEmbeds(new InMessageEmbed(interactionEmbedData)) });
	}
}

describe('message embed body serialization', () => {
	test('serializes received embeds in channel message bodies', async () => {
		const world = mockWorld();
		const guild = world.registerGuild();
		const channel = world.registerChannel(guild.id);
		await using bot = await createMockBot({ world });

		await bot.client.messages.write(channel.id, {
			embeds: forwardedEmbeds(new InMessageEmbed(channelEmbedData)),
		});

		const action = bot.rest.requireAction(Routes.createMessage, { channelId: channel.id });
		expect(action.body?.embeds).toEqual([{ title: 'Builder', fields: [] }, { title: 'Raw' }, channelEmbedData]);
		expect(action.body?.embeds).not.toContainEqual({ data: channelEmbedData });
	});

	test('serializes received embeds in interaction message bodies', async () => {
		await using bot = await createMockBot({ commands: [ForwardEmbedsCommand] });

		const result = await bot.slash({ name: 'forward-embeds' });

		expect(result.embeds).toEqual([{ title: 'Builder', fields: [] }, { title: 'Raw' }, interactionEmbedData]);
		expect(result.embeds).not.toContainEqual({ data: interactionEmbedData });
	});
});
