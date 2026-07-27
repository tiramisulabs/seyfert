import { describe, expect, test } from 'vitest';
import { WorkerManager } from '../lib/websocket/discord/workermanager';

describe('WorkerManager', () => {
	test('calculateWorkerId reports the effective shard range', () => {
		const manager = createWorkerManager({
			shardStart: 2,
			shardEnd: 8,
			shardsPerWorker: 3,
			totalWorkers: 3,
		});

		expect(() => manager.calculateWorkerId(8)).toThrow('Invalid shardId 8: expected 2..7.');
	});

	test('getWorkerInfo reports the missing worker id', async () => {
		const manager = Object.create(WorkerManager.prototype) as WorkerManager;
		manager.has = () => false;

		await expect(manager.getWorkerInfo(-1)).rejects.toMatchObject({
			code: 'WORKER_NOT_FOUND',
			message: "Worker #-1 doesn't exist",
			metadata: { workerId: -1 },
		});
	});

	test('syncLatency returns 0 when a worker has no shards', async () => {
		const manager = Object.create(WorkerManager.prototype) as WorkerManager & {
			has(id: number): boolean;
			calculateWorkerId(shardId: number): number;
			getWorkerInfo(workerId: number): Promise<{ shards: { latency: number }[] }>;
		};

		manager.has = () => true;
		manager.calculateWorkerId = () => 0;
		manager.getWorkerInfo = async () => ({ shards: [] });

		await expect(WorkerManager.prototype.syncLatency.call(manager, { workerId: 0 })).resolves.toBe(0);
	});
});

function createWorkerManager(options: {
	shardStart: number;
	shardEnd: number;
	shardsPerWorker: number;
	totalWorkers: number;
}) {
	const manager = Object.create(WorkerManager.prototype) as WorkerManager;
	manager.options = {
		shardStart: options.shardStart,
		shardEnd: options.shardEnd,
		shardsPerWorker: options.shardsPerWorker,
		workers: options.totalWorkers,
	} as WorkerManager['options'];
	return manager;
}
