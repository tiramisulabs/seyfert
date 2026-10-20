import { chatInputInteraction, createMockBot, mockWorld, Routes } from '@slipher/testing';
import { describe, expect, test, vi } from 'vitest';
import {
	type __InternalReplyFunction,
	BaseInteraction,
	Client,
	Command,
	type CommandContext,
	Declare,
	type Interaction,
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
		chatInputInteraction({ name: 'ping', guildId: null }) as never,
		__reply,
	) as Interaction;

	return interaction;
}

describe('interaction reply state', () => {
	test.each([
		'reply',
		'defer',
	] as const)('preserves allowed mention defaults and per-message overrides after %s', async initialResponse => {
		const world = mockWorld();
		const user = world.registerUser();

		@Declare({ name: 'mention-policy', description: 'Edit an interaction response' })
		class MentionPolicyCommand extends Command {
			async run(ctx: CommandContext) {
				if (initialResponse === 'defer') await ctx.deferReply();
				else await ctx.write({ content: 'initial' });

				const content = `<@${ctx.author.id}>`;
				await ctx.editOrReply({ content });
				await ctx.editOrReply({ content, allowed_mentions: { users: [ctx.author.id] } });
				await ctx.editOrReply({ content });
			}
		}

		await using bot = await createMockBot({
			commands: [MentionPolicyCommand],
			client: new Client({ allowedMentions: { parse: [] } }),
			world,
		});

		await bot.slash({ name: 'mention-policy', user });

		expect(bot.restCalls(Routes.editOriginalResponse).map(call => call.body?.allowed_mentions)).toEqual([
			{ parse: [] },
			{ users: [user.id] },
			{ parse: [] },
		]);
	});

	test('preserves explicit null in nullable message edit bodies', () => {
		const body = BaseInteraction.transformBody<{ allowed_mentions: null }>({ allowed_mentions: null }, undefined, {
			options: { allowedMentions: { parse: [] } },
		} as never);

		expect(body.allowed_mentions).toBeNull();
	});

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
			interaction.token,
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
