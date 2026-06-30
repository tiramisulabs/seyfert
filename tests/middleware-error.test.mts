import { describe, expect, test, vi } from 'vitest';
import { BaseCommand, createMiddleware } from '../src';

function makeContext(middlewares: Record<string, unknown>) {
	const logger = { error: vi.fn(), warn: vi.fn() };
	const context = {
		client: { middlewares, logger },
		command: { name: 'secure' },
		globalMetadata: {},
		metadata: {},
	} as never;
	return { context, logger };
}

describe('__runMiddlewares error flow', () => {
	// An exception (sync throw OR async rejection) is an internal error, not a denial:
	// both reject the runner so they land on onInternalError, identically.
	test('rejects the runner when a middleware throws synchronously', async () => {
		const error = new Error('sync failed');
		const syncThrow = createMiddleware<void>(() => {
			throw error;
		});
		const { context } = makeContext({ syncThrow });

		await expect(BaseCommand.__runMiddlewares(context, ['syncThrow' as never], false)).rejects.toBe(error);
	});

	test('rejects the runner when a middleware rejects asynchronously', async () => {
		const error = new Error('async failed');
		const asyncReject = createMiddleware<void>(() => Promise.reject(error));
		const { context } = makeContext({ asyncReject });

		await expect(BaseCommand.__runMiddlewares(context, ['asyncReject' as never], false)).rejects.toBe(error);
	});

	test('rejects with the async error even after next has advanced', async () => {
		const error = new Error('late failure');
		let rejectFirst!: (error: Error) => void;
		const first = createMiddleware<void>(({ next }) => {
			next();
			return new Promise((_resolve, reject) => {
				rejectFirst = reject;
			});
		});
		const second = createMiddleware<void>(() => undefined);
		const { context } = makeContext({ first, second });

		const result = BaseCommand.__runMiddlewares(context, ['first' as never, 'second' as never], false);
		rejectFirst(error);

		await expect(result).rejects.toBe(error);
	});

	// Intentional control flow still resolves (never rejects):
	test('stop(reason) resolves as a denial', async () => {
		const denyMw = createMiddleware<void>(({ stop }) => stop('denied'));
		const { context } = makeContext({ denyMw });

		await expect(BaseCommand.__runMiddlewares(context, ['denyMw' as never], false)).resolves.toEqual({ error: 'denied' });
	});

	test('pass() resolves as a skip', async () => {
		const passMw = createMiddleware<void>(({ pass }) => pass());
		const { context } = makeContext({ passMw });

		await expect(BaseCommand.__runMiddlewares(context, ['passMw' as never], false)).resolves.toEqual({ pass: true });
	});

	test('next() advances through every middleware and resolves empty', async () => {
		const order: string[] = [];
		const first = createMiddleware<void>(({ next }) => {
			order.push('first');
			next();
		});
		const second = createMiddleware<void>(({ next }) => {
			order.push('second');
			next();
		});
		const { context } = makeContext({ first, second });

		await expect(BaseCommand.__runMiddlewares(context, ['first' as never, 'second' as never], false)).resolves.toEqual(
			{},
		);
		expect(order).toEqual(['first', 'second']);
	});
});
