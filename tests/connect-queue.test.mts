import { afterEach, describe, expect, test, vi } from 'vitest';
import { ConnectQueue } from '../src/websocket/structures/timeout';

describe('ConnectQueue', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	test('always returns a promise for immediate and delayed callbacks', async () => {
		vi.useFakeTimers();
		const queue = new ConnectQueue(100, 1);
		const immediate = queue.push(() => 'immediate');
		const delayed = queue.push(() => 'delayed');

		expect(immediate).toBeInstanceOf(Promise);
		expect(delayed).toBeInstanceOf(Promise);
		await expect(immediate).resolves.toBe('immediate');
		await vi.advanceTimersByTimeAsync(100);
		await expect(delayed).resolves.toBe('delayed');
	});

	test('rejects with callback errors in immediate and delayed slots', async () => {
		vi.useFakeTimers();
		const queue = new ConnectQueue(100, 1);
		const immediateFailure = new Error('immediate');
		const delayedFailure = new Error('delayed');
		const immediate = queue.push(() => {
			throw immediateFailure;
		});
		const delayed = queue.push(async () => {
			throw delayedFailure;
		});

		await expect(immediate).rejects.toBe(immediateFailure);
		const delayedRejection = expect(delayed).rejects.toBe(delayedFailure);
		await vi.advanceTimersByTimeAsync(100);
		await delayedRejection;
	});

	test('applies concurrency changes without forgetting consumed slots', async () => {
		vi.useFakeTimers();
		const queue = new ConnectQueue(100, 1);
		const first = queue.push(() => 'first');
		const second = queue.push(() => 'second');

		queue.setConcurrency(2);
		await expect(first).resolves.toBe('first');
		await expect(second).resolves.toBe('second');

		queue.setConcurrency(1);
		const third = queue.push(() => 'third');
		let settled = false;
		void third.then(() => {
			settled = true;
		});
		await Promise.resolve();
		expect(settled).toBe(false);

		await vi.advanceTimersByTimeAsync(100);
		await expect(third).resolves.toBe('third');
	});
});
