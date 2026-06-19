import { describe, expect, test, vi } from 'vitest';
import {
	ApplicationCommandType,
	BaseInteraction,
	ChannelType,
	type __InternalReplyFunction,
	type Interaction,
	InteractionType,
} from '../lib';

function createDeferred<T>() {
	let resolve!: (value: T | PromiseLike<T>) => void;
	const promise = new Promise<T>(res => {
		resolve = res;
	});

	return { promise, resolve };
}

function createInteraction(client: unknown, __reply?: __InternalReplyFunction) {
	const interaction = BaseInteraction.from(
		client as never,
		{
			id: '100000000000000001',
			application_id: '100000000000000002',
			type: InteractionType.ApplicationCommand,
			data: {
				id: '100000000000000003',
				type: ApplicationCommandType.ChatInput,
				name: 'ping',
			},
			channel: {
				id: '100000000000000004',
				type: ChannelType.DM,
			},
			user: {
				id: '100000000000000005',
				username: 'tester',
				discriminator: '0001',
				avatar: null,
			},
			token: 'interaction-token',
			version: 1,
			app_permissions: '0',
			locale: 'en-US',
			entitlements: [],
			authorizing_integration_owners: {},
		} as never,
		__reply,
	) as Interaction;

	return interaction;
}

describe('interaction reply state', () => {
	test('keeps REST replies private while editOrReply waits to edit the original response', async () => {
		const pendingReply = createDeferred<undefined>();
		const editedMessage = { id: '100000000000000006' };
		const reply = vi.fn(() => pendingReply.promise);
		const editMessage = vi.fn(() => Promise.resolve(editedMessage));
		const interaction = createInteraction({
			options: {},
			interactions: {
				reply,
				editMessage,
			},
		});

		const initialReply = interaction.write({ content: 'initial' });

		expect(reply).toHaveBeenCalledTimes(1);
		expect(interaction.replied).toBeUndefined();

		const edit = interaction.editOrReply({ content: 'edited' }, true);

		await Promise.resolve();

		expect(editMessage).not.toHaveBeenCalled();
		expect(reply).toHaveBeenCalledTimes(1);

		pendingReply.resolve(undefined);

		await expect(initialReply).resolves.toBeUndefined();
		await expect(edit).resolves.toBe(editedMessage);
		expect(interaction.replied).toBe(true);
		expect(reply).toHaveBeenCalledTimes(1);
		expect(editMessage).toHaveBeenCalledTimes(1);
		expect(editMessage).toHaveBeenCalledWith(
			'interaction-token',
			'@original',
			expect.objectContaining({ content: 'edited' }),
		);
	});

	test('keeps constructor replies private while editOrReply waits to edit the original response', async () => {
		const pendingReply = createDeferred<void>();
		const editedMessage = { id: '100000000000000007' };
		const restReply = vi.fn();
		const editMessage = vi.fn(() => Promise.resolve(editedMessage));
		const __reply = vi.fn(() => pendingReply.promise);
		const interaction = createInteraction(
			{
				options: {},
				interactions: {
					reply: restReply,
					editMessage,
				},
			},
			__reply,
		);

		const initialReply = interaction.write({ content: 'initial' });

		expect(__reply).toHaveBeenCalledTimes(1);
		expect(restReply).not.toHaveBeenCalled();
		expect(interaction.replied).toBeUndefined();

		const edit = interaction.editOrReply({ content: 'edited' }, true);

		await Promise.resolve();

		expect(editMessage).not.toHaveBeenCalled();

		pendingReply.resolve();

		await expect(initialReply).resolves.toBeUndefined();
		await expect(edit).resolves.toBe(editedMessage);
		expect(interaction.replied).toBe(true);
		expect(restReply).not.toHaveBeenCalled();
		expect(editMessage).toHaveBeenCalledTimes(1);
	});
});
