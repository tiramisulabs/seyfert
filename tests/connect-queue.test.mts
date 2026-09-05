import { afterEach, describe, expect, test, vi } from 'vitest';
import { ConnectQueue } from '../src/websocket/structures/timeout';

describe('ConnectQueue', () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	test('applies concurrency changes without forgetting consumed capacity', async () => {
		vi.useFakeTimers();
		const queue = new ConnectQueue(100, 1);
		const callbacks: string[] = [];
		queue.push(() => callbacks.push('first'));
		queue.push(() => callbacks.push('second'));

		queue.concurrency = 2;
		expect(callbacks).toEqual(['first', 'second']);

		queue.concurrency = 1;
		queue.push(() => callbacks.push('third'));
		expect(callbacks).toEqual(['first', 'second']);

		queue.concurrency = 2;
		expect(callbacks).toEqual(['first', 'second']);

		await vi.advanceTimersByTimeAsync(50);
		expect(callbacks).toEqual(['first', 'second', 'third']);
	});

	test('keeps the active schedule when concurrency does not change', async () => {
		vi.useFakeTimers();
		const queue = new ConnectQueue(100, 1);
		const callbacks: string[] = [];
		queue.push(() => callbacks.push('first'));
		queue.push(() => callbacks.push('second'));

		await vi.advanceTimersByTimeAsync(40);
		queue.concurrency = 1;
		await vi.advanceTimersByTimeAsync(40);
		queue.concurrency = 1;
		await vi.advanceTimersByTimeAsync(20);

		expect(callbacks).toEqual(['first', 'second']);
	});

	test('keeps timer progress across alternating concurrency changes', async () => {
		vi.useFakeTimers();
		const queue = new ConnectQueue(100, 1);
		const callbacks: string[] = [];
		queue.push(() => callbacks.push('first'));
		queue.push(() => callbacks.push('second'));
		queue.push(() => callbacks.push('third'));

		await vi.advanceTimersByTimeAsync(20);
		queue.concurrency = 2;
		await vi.advanceTimersByTimeAsync(20);
		queue.concurrency = 1;
		await vi.advanceTimersByTimeAsync(20);
		queue.concurrency = 2;
		await vi.advanceTimersByTimeAsync(20);
		queue.concurrency = 1;
		await vi.advanceTimersByTimeAsync(20);

		expect(callbacks).toEqual(['first', 'second', 'third']);
	});
});
