import { describe, expect, test, vi } from 'vitest';
import { BaseClient } from '../lib/client/base';
import { InteractionResponseType, InteractionType } from '../lib/types/payloads/_interactions/responses';

function createClient(interaction = vi.fn()) {
	const client = new BaseClient();
	client.handleCommand = { interaction } as never;

	return { client, interaction };
}

describe('BaseClient.onInteractionRequest', () => {
	test('returns Pong for Discord Ping interactions without dispatching', async () => {
		const delegatedResponse = {
			type: InteractionResponseType.ChannelMessageWithSource,
			data: { content: 'delegated' },
		};
		const { client, interaction } = createClient(
			vi.fn(async (_body, _shardId, reply) => {
				await reply({ body: delegatedResponse });
			}),
		);

		const result = await client.onInteractionRequest({
			id: '100000000000000001',
			application_id: '100000000000000002',
			type: InteractionType.Ping,
			token: 'interaction-token',
			version: 1,
		} as never);

		expect(result).toEqual({
			headers: { 'Content-Type': 'application/json' },
			response: { type: InteractionResponseType.Pong },
		});
		expect(interaction).not.toHaveBeenCalled();
	});

	test('delegates non-Ping interactions and resolves through __reply', async () => {
		const rawBody = {
			id: '100000000000000003',
			application_id: '100000000000000004',
			type: InteractionType.ApplicationCommand,
			token: 'interaction-token',
			version: 1,
		};
		const response = {
			type: InteractionResponseType.ChannelMessageWithSource,
			data: { content: 'handled' },
		};
		const { client, interaction } = createClient(
			vi.fn(async (_body, _shardId, reply) => {
				await reply({ body: response });
			}),
		);

		await expect(client.onInteractionRequest(rawBody as never)).resolves.toEqual({
			headers: { 'Content-Type': 'application/json' },
			response,
		});
		expect(interaction).toHaveBeenCalledTimes(1);
		expect(interaction).toHaveBeenCalledWith(rawBody, -1, expect.any(Function));
	});
});
