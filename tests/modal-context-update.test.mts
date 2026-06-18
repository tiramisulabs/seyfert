import { describe, expect, test, vi } from 'vitest';
import { ModalContext } from '../src/components/modalcontext';

function createModalContext(interaction: unknown) {
	const ctx = Object.create(ModalContext.prototype);
	ctx.interaction = interaction;
	return ctx as ModalContext;
}

describe('ModalContext update proxies', () => {
	test('proxies update to the modal submit interaction', async () => {
		const body = { content: 'updated' };
		const updated = { id: '100000000000000001' };
		const update = vi.fn(() => Promise.resolve(updated));
		const ctx = createModalContext({ update });

		await expect(ctx.update(body as never, true)).resolves.toBe(updated);

		expect(update).toHaveBeenCalledWith(body, true);
	});

	test('proxies deferUpdate without arguments', async () => {
		const deferUpdate = vi.fn(() => Promise.resolve(undefined));
		const ctx = createModalContext({ deferUpdate });

		await expect(ctx.deferUpdate()).resolves.toBeUndefined();

		expect(deferUpdate).toHaveBeenCalledWith();
	});
});
