import { Routes, createMockBot } from '@slipher/testing';
import { describe, expect, test, vi } from 'vitest';
import {
	ApplicationCommandType,
	BaseInteraction,
	ChannelType,
	Command,
	Declare,
	type __InternalReplyFunction,
	type CommandContext,
	type Interaction,
	InteractionType,
} from '../lib';

@Declare({ name: 'ordered-reply', description: 'Reply and then edit' })
class OrderedReplyCommand extends Command {
	async run(ctx: CommandContext) {
		const initial = ctx.write({ content: 'initial' });
		const edit = ctx.editOrReply({ content: 'edited' }, true);
		await initial;
		await edit;
	}
}

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
		await using bot = await createMockBot({ commands: [OrderedReplyCommand] });
		const callback = bot.rest.gateNext(Routes.interactionCallback);
		const dispatch = bot.slash({ name: 'ordered-reply' });
		// Dispatch is lazy; attaching then starts it before this test waits for the REST gate.
		const completed = dispatch.then(result => result);

		await callback.hit;
		expect(bot.rest.findActions(Routes.editOriginalResponse)).toHaveLength(0);

		callback.release();
		const result = await completed;

		expect(result.content).toBe('edited');
		expect(bot.rest.findActions(Routes.interactionCallback)).toHaveLength(1);
		expect(bot.rest.findActions(Routes.editOriginalResponse)).toHaveLength(1);
	});
});
