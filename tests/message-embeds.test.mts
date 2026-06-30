import { describe, expect, test } from 'vitest';
import { BaseInteraction, Embed, InMessageEmbed, MessagesMethods, type RESTPostAPIChannelMessageJSONBody } from '../lib';

describe('message embed body serialization', () => {
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
