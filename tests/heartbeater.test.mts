import { afterEach, describe, expect, test, vi } from 'vitest';
import { Heartbeater } from '../src/websocket/discord/heartbeater';

describe('Heartbeater', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	test('reports synchronous send and recreate failures', async () => {
		vi.useFakeTimers();
		const sendError = new Error('send failed');
		const recreateError = new Error('recreate failed');
		const onError = vi.fn();
		const heartbeater = new Heartbeater(
			() => {
				throw sendError;
			},
			100,
			onError,
		);
		heartbeater.register(1, () => {
			throw recreateError;
		});

		await vi.advanceTimersByTimeAsync(100);
		expect(onError).toHaveBeenCalledWith(sendError);

		await vi.advanceTimersByTimeAsync(100);
		expect(onError).toHaveBeenCalledWith(recreateError);
		heartbeater.unregister(1);
	});
});
