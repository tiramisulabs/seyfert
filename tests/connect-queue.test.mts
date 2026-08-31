import { afterEach, describe, expect, test, vi } from 'vitest';
import { ShardManager, WorkerManager } from '../src/websocket';
import { ConnectQueue } from '../src/websocket/structures/timeout';

function gatewayInfo(shards = 1, maxConcurrency = 1) {
	return {
		session_start_limit: {
			max_concurrency: maxConcurrency,
			remaining: 1000,
			reset_after: 0,
			total: 1000,
		},
		shards,
		url: 'wss://gateway.discord.gg',
	};
}

function createShardManager(getInfo: () => Promise<ReturnType<typeof gatewayInfo>>) {
	return new ShardManager({
		token: 'token',
		intents: 0,
		info: gatewayInfo(),
		handlePayload() {},
		resharding: { interval: 100, percentage: 0, getInfo },
	});
}

function createWorkerManager(getInfo: () => Promise<ReturnType<typeof gatewayInfo>>) {
	const manager = new WorkerManager({
		mode: 'custom',
		token: 'token',
		intents: 0,
		info: gatewayInfo(),
		shardStart: 0,
		shardEnd: 1,
		totalShards: 1,
		workers: 1,
		shardsPerWorker: 1,
		resharding: { interval: 100, percentage: 0, getInfo },
		adapter: {
			postMessage() {},
			spawn() {},
		},
	});
	manager.connectQueue = new ConnectQueue(100, 1);
	return manager;
}

describe('ConnectQueue', () => {
	afterEach(() => {
		vi.restoreAllMocks();
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

		queue.concurrency = 2;
		await expect(first).resolves.toBe('first');
		await expect(second).resolves.toBe('second');

		queue.concurrency = 1;
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

	test('ShardManager resharding updates its queue concurrency', async () => {
		vi.useFakeTimers();
		const manager = createShardManager(async () => gatewayInfo(2, 2));
		vi.spyOn(ShardManager.prototype, 'spawnShards').mockResolvedValue();

		await manager.startResharder();
		await vi.advanceTimersByTimeAsync(100);

		expect(manager.connectQueue.concurrency).toBe(2);
	});

	test('WorkerManager resharding updates its queue concurrency', async () => {
		vi.useFakeTimers();
		const manager = createWorkerManager(async () => gatewayInfo(2, 2));
		const startWorkers = vi.fn();
		vi.spyOn(manager, 'prepareWorkers').mockImplementation(() => {
			manager.reshardingWorkerQueue.push(startWorkers);
		});

		await manager.startResharding();
		await vi.advanceTimersByTimeAsync(100);

		expect(manager.connectQueue.concurrency).toBe(2);
		expect(startWorkers).toHaveBeenCalledOnce();
	});
});
