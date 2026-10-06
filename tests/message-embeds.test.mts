import { createMockBot, mockWorld, Routes } from '@slipher/testing';
import { describe, expect, test } from 'vitest';
import {
	type APIEmbed,
	AttachmentBuilder,
	BaseInteraction,
	Command,
	type CommandContext,
	ComponentType,
	Declare,
	Embed,
	EmbedType,
	InMessageEmbed,
	MessagesMethods,
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
	test('exposes nested link preview components without changing their wire payload', async () => {
		const preview = {
			type: EmbedType.Components,
			url: 'https://example.com/article',
			components: [
				{
					type: ComponentType.Container,
					accent_color: 5793266,
					components: [
						{
							type: ComponentType.Section,
							components: [{ type: ComponentType.TextDisplay, content: '# Article' }],
							accessory: {
								type: ComponentType.Thumbnail,
								media: { url: 'https://example.com/image.png', proxy_url: 'https://proxy.example.com/image.png' },
							},
						},
					],
				},
			],
		} satisfies APIEmbed;
		const world = mockWorld();
		const guild = world.registerGuild();
		const channel = world.registerChannel(guild.id);
		const message = world.registerMessage(channel.id, { embeds: [preview, channelEmbedData] });
		await using bot = await createMockBot({ world });
		const structure = await bot.client.messages.fetch(message.id, channel.id);
		const embed = structure.embeds[0];
		const container = embed.components![0];
		const section = container.components[0];
		if (!('accessory' in section)) throw new Error('Expected a section');

		expect(section.components[0].content).toBe('# Article');
		expect(section.accessory.toJSON()).toEqual({
			type: ComponentType.Thumbnail,
			media: { url: 'https://example.com/image.png', proxy_url: 'https://proxy.example.com/image.png' },
		});
		expect(container.toBuilder().toJSON()).toEqual(preview.components[0]);
		expect(embed.toJSON()).toEqual(preview);
		expect(structure.embeds[1].components).toBeUndefined();
	});

	test('serializes attachment request metadata for uploaded files', () => {
		const file = new AttachmentBuilder().setName('image.png').setDescription('alt text').setSpoiler(true);
		const expected = [{ id: '0', filename: 'image.png', description: 'alt text', is_spoiler: true }];
		const channelBody = MessagesMethods.transformMessageBody<RESTPostAPIChannelMessageJSONBody>({}, [file], {
			options: {},
		} as never);
		const interactionBody = BaseInteraction.transformBody<RESTPostAPIChannelMessageJSONBody>({}, [file], {
			options: {},
		} as never);

		expect(channelBody.attachments).toEqual(expected);
		expect(interactionBody.attachments).toEqual(expected);
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
