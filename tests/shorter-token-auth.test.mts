import { describe, expect, test, vi } from 'vitest';
import { BaseClient } from '../lib/client/base';
import { InteractionResponseType } from '../lib/types/payloads/_interactions/responses';

const responseMessage = {
	id: 'message-id',
	embeds: [],
	mentions: [],
};

function createClient() {
	const client = new BaseClient();
	client.applicationId = 'application-id';
	const request = vi.spyOn(client.rest, 'request').mockResolvedValue(responseMessage as never);

	return { client, request };
}

const tokenAuthCases = [
	{
		name: 'webhook message write',
		method: 'POST',
		path: '/webhooks/webhook-id/webhook-token',
		invoke: (client: BaseClient) =>
			client.webhooks.writeMessage('webhook-id', 'webhook-token', {
				body: { content: 'hello' },
				query: { wait: true },
			}),
	},
	{
		name: 'interaction callback reply',
		method: 'POST',
		path: '/interactions/interaction-id/interaction-token/callback',
		invoke: (client: BaseClient) =>
			client.interactions.reply(
				'interaction-id',
				'interaction-token',
				{ type: InteractionResponseType.ChannelMessageWithSource, data: { content: 'hello' } },
			),
	},
	{
		name: 'interaction message edit',
		method: 'PATCH',
		path: '/webhooks/application-id/interaction-token/messages/message-id',
		invoke: (client: BaseClient) =>
			client.interactions.editMessage('interaction-token', 'message-id', { content: 'edited' }),
	},
	{
		name: 'interaction message delete',
		method: 'DELETE',
		path: '/webhooks/application-id/interaction-token/messages/message-id',
		invoke: (client: BaseClient) => client.interactions.deleteResponse('interaction-token', 'message-id'),
	},
	{
		name: 'interaction followup',
		method: 'POST',
		path: '/webhooks/application-id/interaction-token',
		invoke: (client: BaseClient) => client.interactions.followup('interaction-token', { content: 'followup' }),
	},
] as const;

describe('token-authenticated shorters', () => {
	test.each(tokenAuthCases)('$name does not send the bot authorization header', async ({ method, path, invoke }) => {
		const { client, request } = createClient();

		await invoke(client);

		expect(request).toHaveBeenCalledOnce();
		expect(request).toHaveBeenCalledWith(method, path, expect.objectContaining({ auth: false }));
	});

	test('webhook ID routes retain bot authentication', async () => {
		const { client, request } = createClient();

		await client.webhooks.delete('webhook-id', {});

		expect(request).toHaveBeenCalledOnce();
		expect(request).toHaveBeenCalledWith('DELETE', '/webhooks/webhook-id', { reason: undefined });
	});
});
