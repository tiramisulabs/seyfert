import { createMockBot, mockWorld, Routes } from '@slipher/testing';
import { describe, expect, test } from 'vitest';
import {
	AttachmentBuilder,
	BaseInteraction,
	Command,
	type CommandContext,
	Declare,
	Embed,
	InMessageEmbed,
	MessagesMethods,
	type RESTAPIAttachment,
	type RESTPostAPIChannelMessageJSONBody,
} from '../lib';

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
	test('serializes attachment request metadata for uploaded files', () => {
		const file = new AttachmentBuilder().setName('image.png').setDescription('alt text').setSpoiler(true);
		const expected = [{ id: '0', filename: 'image.png', description: 'alt text', is_spoiler: true }];
		const channelBody = MessagesMethods.transformMessageBody<RESTPostAPIChannelMessageJSONBody>({}, [file], {
			options: {},
		} as never);
		const interactionBody = BaseInteraction.transformBody<RESTPostAPIChannelMessageJSONBody>({}, [file], {
			options: {},
		} as never);
		const publicRequestContract = { id: '0', is_spoiler: true } satisfies RESTAPIAttachment;

		expect(channelBody.attachments).toEqual(expected);
		expect(interactionBody.attachments).toEqual(expected);
		expect(publicRequestContract.is_spoiler).toBe(true);
	});

	test('serializes received embeds in channel message bodies', async () => {
		const world = mockWorld();
		const guild = world.registerGuild();
		const channel = world.registerChannel(guild.id);
		await using bot = await createMockBot({ world });

		await bot.client.messages.write(channel.id, {
			embeds: forwardedEmbeds(new InMessageEmbed(channelEmbedData)),
		});

		const [action] = bot.restCalls(Routes.createMessage);
		expect(action).toMatchObject({ params: { channelId: channel.id } });
		expect(action?.body?.embeds).toEqual([{ title: 'Builder', fields: [] }, { title: 'Raw' }, channelEmbedData]);
		expect(action?.body?.embeds).not.toContainEqual({ data: channelEmbedData });
	});

	test('serializes received embeds in interaction message bodies', async () => {
		await using bot = await createMockBot({ commands: [ForwardEmbedsCommand] });

		const result = await bot.slash({ name: 'forward-embeds' });

		expect(result.embeds).toEqual([{ title: 'Builder', fields: [] }, { title: 'Raw' }, interactionEmbedData]);
		expect(result.embeds).not.toContainEqual({ data: interactionEmbedData });
	});
});
