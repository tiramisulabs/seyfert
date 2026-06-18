import { describe, expect, test, vi } from 'vitest';
import { CommandContext } from '../src/commands/applications/chatcontext';

function createCommandContext(interaction: unknown) {
	const ctx = Object.create(CommandContext.prototype);
	ctx.interaction = interaction;
	return ctx as CommandContext;
}

describe('CommandContext.modal', () => {
	test('proxies modal creation to interaction contexts', async () => {
		const body = { customId: 'profile', title: 'Profile', components: [] };
		const submitted = { customId: 'profile' };
		const modal = vi.fn((_body: unknown, options?: unknown) =>
			Promise.resolve(options === undefined ? undefined : submitted),
		);
		const ctx = createCommandContext({ modal });

		await expect(ctx.modal(body as never)).resolves.toBeUndefined();
		await expect(ctx.modal(body as never, { waitFor: 1_000 })).resolves.toBe(submitted);

		expect(modal).toHaveBeenNthCalledWith(1, body);
		expect(modal).toHaveBeenNthCalledWith(2, body, { waitFor: 1_000 });
	});

	test('throws a clear error for prefix command contexts', () => {
		const ctx = createCommandContext(undefined);

		expect(() => ctx.modal({ customId: 'profile', title: 'Profile', components: [] } as never)).toThrow(
			'Cannot use modal without an interaction.',
		);
	});
});
