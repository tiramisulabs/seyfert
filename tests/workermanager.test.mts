import { describe, expect, test } from 'vitest';
import { WorkerClient } from '../lib/client/workerclient';
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

	test('preserves binary REST responses through JSON worker IPC', async () => {
		const bytes = new Uint8Array([137, 80, 78, 71, 0, 255]);
		const manager = Object.create(WorkerManager.prototype) as WorkerManager;
		manager.options = { mode: 'clusters' } as WorkerManager['options'];
		manager.rest = { request: async () => bytes.buffer } as unknown as WorkerManager['rest'];
		let wireMessage: unknown;
		manager.postMessage = ((_workerId: number, message: unknown) => {
			wireMessage = JSON.parse(JSON.stringify(message));
		}) as WorkerManager['postMessage'];

		await manager.handleWorkerMessage({
			type: 'WORKER_API_REQUEST',
			workerId: 0,
			nonce: 'binary-response',
			method: 'GET',
			url: '/guilds/1/widget.png',
			requestOptions: {},
		});

		const client = Object.create(WorkerClient.prototype) as WorkerClient;
		const response = new Promise<ArrayBuffer>((resolve, reject) => {
			client.rest = {
				workerPromises: new Map([['binary-response', { resolve, reject }]]),
			} as WorkerClient['rest'];
		});
		await client.handleManagerMessages(wireMessage as never);

		expect([...new Uint8Array(await response)]).toEqual([...bytes]);
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
