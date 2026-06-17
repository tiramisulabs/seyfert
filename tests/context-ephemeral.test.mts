import { describe, expect, test, vi } from 'vitest';
import { CommandContext } from '../src/commands/applications/chatcontext';
import { EntryPointContext } from '../src/commands/applications/entrycontext';
import { MenuCommandContext } from '../src/commands/applications/menucontext';
import { ComponentContext } from '../src/components/componentcontext';
import { ModalContext } from '../src/components/modalcontext';
import { MessageFlags } from '../src/types';

const interactionCases = [
	['CommandContext', CommandContext.prototype],
	['ComponentContext', ComponentContext.prototype],
	['ModalContext', ModalContext.prototype],
	['MenuCommandContext', MenuCommandContext.prototype],
	['EntryPointContext', EntryPointContext.prototype],
] as const;

function createInteractionContext(prototype: object) {
	const write = vi.fn((body: unknown, withResponse?: boolean) => Promise.resolve({ body, withResponse }));
	const ctx = Object.create(prototype);
	ctx.interaction = { write };

	return { ctx, write };
}

describe('context ephemeral responses', () => {
	test.each(interactionCases)('%s sets the ephemeral flag on response bodies', async (_name, prototype) => {
		const { ctx, write } = createInteractionContext(prototype);

		await ctx.ephemeral({ content: 'private' }, true);

		expect(write).toHaveBeenCalledWith({ content: 'private', flags: MessageFlags.Ephemeral }, true);
	});

	test.each(interactionCases)('%s OR-preserves flags without mutating the original body', async (_name, prototype) => {
		const { ctx, write } = createInteractionContext(prototype);
		const body = { content: 'private', flags: MessageFlags.SuppressEmbeds };

		await ctx.ephemeral(body, false);

		expect(write).toHaveBeenCalledWith(
			{ content: 'private', flags: MessageFlags.SuppressEmbeds | MessageFlags.Ephemeral },
			false,
		);
		expect(body).toEqual({ content: 'private', flags: MessageFlags.SuppressEmbeds });
		expect(write.mock.calls[0]?.[0]).not.toBe(body);
	});

	test('prefix CommandContext writes normally without adding the ephemeral flag', async () => {
		const write = vi.fn((body: unknown) => Promise.resolve({ body }));
		const body = { content: 'prefix private' };
		const ctx = Object.create(CommandContext.prototype);
		ctx.interaction = undefined;
		ctx.message = { write };
		ctx.messageResponse = undefined;
		ctx.client = { options: { commands: { reply: () => false } } };

		await ctx.ephemeral(body, true);

		expect(write).toHaveBeenCalledWith(body);
		expect(write.mock.calls[0]?.[0]).toBe(body);
	});
});
