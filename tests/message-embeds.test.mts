import { describe, expect, test } from 'vitest';
import {
	AttachmentBuilder,
	BaseInteraction,
	Embed,
	InMessageEmbed,
	MessagesMethods,
	type RESTAPIAttachment,
	type RESTPostAPIChannelMessageJSONBody,
} from '../lib';

describe('message embed body serialization', () => {
	test('serializes attachment request metadata for uploaded files', () => {
		const file = new AttachmentBuilder().setName('image.png').setDescription('alt text').setSpoiler(true);
		const expected = [{ id: '0', filename: 'image.png', description: 'alt text', is_spoiler: true }];
		const channelBody = MessagesMethods.transformMessageBody<RESTPostAPIChannelMessageJSONBody>(
			{},
			[file],
			{ options: {} } as never,
		);
		const interactionBody = BaseInteraction.transformBody<RESTPostAPIChannelMessageJSONBody>(
			{},
			[file],
			{ options: {} } as never,
		);
		const publicRequestContract = { id: '0', is_spoiler: true } satisfies RESTAPIAttachment;

		expect(channelBody.attachments).toEqual(expected);
		expect(interactionBody.attachments).toEqual(expected);
		expect(publicRequestContract.is_spoiler).toBe(true);
	});

	test('serializes received embeds in channel message bodies', () => {
		const builderEmbed = new Embed({ title: 'Builder' });
		const rawApiEmbed = { title: 'Raw' };
		const receivedEmbedData = { title: 'Forwarded', description: 'from a received message' };
		const receivedEmbed = new InMessageEmbed(receivedEmbedData);

		const body = MessagesMethods.transformMessageBody<RESTPostAPIChannelMessageJSONBody>(
			{ embeds: [builderEmbed, rawApiEmbed, receivedEmbed] },
			undefined,
			{ options: {} } as never,
		);

		expect(body.embeds).toEqual([{ title: 'Builder', fields: [] }, rawApiEmbed, receivedEmbedData]);
		expect(body.embeds).not.toContainEqual({ data: receivedEmbedData });
	});

	test('serializes received embeds in interaction message bodies', () => {
		const builderEmbed = new Embed({ title: 'Builder' });
		const rawApiEmbed = { title: 'Raw' };
		const receivedEmbedData = { title: 'Forwarded', description: 'from an interaction message' };
		const receivedEmbed = new InMessageEmbed(receivedEmbedData);

		const body = BaseInteraction.transformBody<RESTPostAPIChannelMessageJSONBody>(
			{ embeds: [builderEmbed, rawApiEmbed, receivedEmbed] },
			undefined,
			{ options: {} } as never,
		);

		expect(body.embeds).toEqual([{ title: 'Builder', fields: [] }, rawApiEmbed, receivedEmbedData]);
		expect(body.embeds).not.toContainEqual({ data: receivedEmbedData });
	});
});
