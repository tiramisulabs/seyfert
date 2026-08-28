import { resolve } from 'node:path';
import type { Worker } from 'node:worker_threads';
import { describe, expect, test, vi } from 'vitest';
import { WorkerClient } from '../src/client/workerclient';
import { WorkerManagerDefaults } from '../src/websocket/constants';
import { WorkerManager } from '../src/websocket/discord/workermanager';

describe('WorkerManager diagnostics', () => {
	test('uses eight shards per worker by default', () => {
		expect(WorkerManagerDefaults.shardsPerWorker).toBe(8);
	});

	test('forwards environment variables to custom adapters', () => {
		const spawn = vi.fn();
		const info = gatewayInfo();
		const manager = new WorkerManager({
			mode: 'custom',
			path: 'worker.js',
			token: 'token',
			intents: 0,
			info,
			workerEnv: {
				CUSTOM_WORKER_ENV_TEST: 'configured',
				SEYFERT_SPAWNING: 'overridden',
			},
			adapter: {
				postMessage() {},
				spawn,
			},
		});

		manager.createWorker({
			intents: 0,
			token: 'token',
			path: 'worker.js',
			shards: [0],
			totalShards: 1,
			totalWorkers: 1,
			mode: 'custom',
			workerId: 0,
			debug: false,
			workerProxy: false,
			info,
			compress: false,
			resharding: false,
		});

		expect(spawn).toHaveBeenCalledWith(
			expect.objectContaining({ path: 'worker.js' }),
			expect.objectContaining({
				CUSTOM_WORKER_ENV_TEST: 'configured',
				SEYFERT_SPAWNING: 'true',
			}),
		);
	});

	test('thread workers inherit and overlay environment variables', async () => {
		const previousConfiguredValue = process.env.SEYFERT_WORKER_ENV_CONFIGURED_TEST;
		const previousValue = process.env.SEYFERT_WORKER_ENV_TEST;
		let worker: Worker | undefined;

		try {
			process.env.SEYFERT_WORKER_ENV_CONFIGURED_TEST = 'from-parent';
			process.env.SEYFERT_WORKER_ENV_TEST = 'available';
			const path = resolve('tests/fixtures/workermanager-env.mjs');
			const info = gatewayInfo();
			const manager = new WorkerManager({
				mode: 'threads',
				path,
				token: 'token',
				intents: 0,
				info,
				workerEnv: {
					SEYFERT_WORKER_ENV_CONFIGURED_TEST: 'configured',
					SEYFERT_SPAWNING: 'overridden',
				},
			});
			let resolveMessage!: (message: unknown) => void;
			let rejectMessage!: (error: Error) => void;
			const message = new Promise<unknown>((resolve, reject) => {
				resolveMessage = resolve;
				rejectMessage = reject;
			});
			manager.handleWorkerMessage = async workerMessage => {
				resolveMessage(workerMessage);
			};
			worker = manager.createWorker({
				intents: 0,
				token: 'token',
				path,
				shards: [0],
				totalShards: 1,
				totalWorkers: 1,
				mode: 'threads',
				workerId: 0,
				debug: false,
				workerProxy: false,
				info,
				compress: false,
				resharding: false,
			}) as Worker;
			worker.once('error', rejectMessage);
			worker.once('exit', code =>
				rejectMessage(new Error(`Worker exited with code ${code} before reporting its environment.`)),
			);

			await expect(message).resolves.toEqual({
				configured: 'configured',
				inherited: 'available',
				spawning: 'true',
			});
		} finally {
			await worker?.terminate();
			if (previousConfiguredValue === undefined) delete process.env.SEYFERT_WORKER_ENV_CONFIGURED_TEST;
			else process.env.SEYFERT_WORKER_ENV_CONFIGURED_TEST = previousConfiguredValue;
			if (previousValue === undefined) delete process.env.SEYFERT_WORKER_ENV_TEST;
			else process.env.SEYFERT_WORKER_ENV_TEST = previousValue;
		}
	});

	test('calculateWorkerId reports the effective shard range', () => {
		const manager = createWorkerManager({ shardStart: 2, shardEnd: 8, shardsPerWorker: 3, totalWorkers: 3 });

		expect(() => manager.calculateWorkerId(8)).toThrow('Invalid shardId.');
		try {
			manager.calculateWorkerId(8);
		} catch (error) {
			expect(error).toMatchObject({
				metadata: { detail: 'Invalid shardId 8: expected 2..7.' },
			});
		}
	});

	test('getWorkerInfo reports the missing worker id', async () => {
		const manager = Object.create(WorkerManager.prototype) as WorkerManager;
		manager.has = () => false;

		await expect(manager.getWorkerInfo(-1)).rejects.toMatchObject({
			code: 'WORKER_NOT_FOUND',
			message: 'Worker not found.',
			metadata: { workerId: -1, detail: "Worker #-1 doesn't exist" },
		});
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

function gatewayInfo() {
	return {
		shards: 1,
		url: 'wss://gateway.discord.gg',
		session_start_limit: {
			total: 1,
			remaining: 1,
			reset_after: 0,
			max_concurrency: 1,
		},
	};
}

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
