import { describe, expect, test } from 'vitest';
import { WorkerManager } from '../lib/websocket/discord/workermanager';

describe('WorkerManager', () => {
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
