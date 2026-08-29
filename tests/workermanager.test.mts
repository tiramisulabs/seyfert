import { resolve } from 'node:path';
import type { Worker } from 'node:worker_threads';
import { describe, expect, test, vi } from 'vitest';
import { WorkerClient } from '../lib/client/workerclient';
import { Logger } from '../lib/common';
import { WorkerManager } from '../lib/websocket/discord/workermanager';
import { ConnectQueue } from '../lib/websocket/structures/timeout';

class TestWorkerClient extends WorkerClient {
	dispatch(packet: unknown, shardId: number) {
		return this.onPacket(packet as never, shardId);
	}
}

describe('WorkerManager', () => {
	test('reports rejected emitted worker messages without leaking the rejection', async () => {
		const path = resolve('tests/fixtures/workermanager-env.mjs');
		const failure = new Error('message failed');
		const manager = new WorkerManager({
			mode: 'threads',
			path,
			token: 'token',
			intents: 0,
			info: gatewayInfo(),
		});
		manager.debugger = { error: vi.fn() } as never;
		manager.handleWorkerMessage = vi.fn().mockRejectedValue(failure);
		const worker = (await manager.createWorker({
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
			info: gatewayInfo(),
			compress: false,
			resharding: false,
		})) as Worker;

		try {
			await vi.waitFor(() =>
				expect(manager.debugger?.error).toHaveBeenCalledWith('[Worker #0] message handling failed', failure),
			);
		} finally {
			await worker.terminate();
		}
	});

	test('runs local ready events when the manager notification fails', async () => {
		const failure = new Error('manager disconnected');
		const client = new TestWorkerClient({
			postMessage() {
				throw failure;
			},
		});
		client.setWorkerData({ workerId: 0 } as WorkerClient['workerData']);
		client.shards.set(0, { isReady: true } as never);
		const runEvent = vi.spyOn(client.events, 'runEvent');
		const error = vi.spyOn(client.logger, 'error').mockImplementation(() => {});

		await expect(client.dispatch({ op: 0, t: 'GUILDS_READY', s: 1 }, 0)).resolves.toMatchObject({
			t: 'GUILDS_READY',
		});
		expect(runEvent).toHaveBeenCalledWith('WORKER_READY', client, client.me, -1);
		expect(error).toHaveBeenCalledWith('Failed to notify the worker manager that all shards are ready', failure);
	});

	test('forwards environment variables to custom adapters', async () => {
		const spawn = vi.fn();
		const info = gatewayInfo();
		const manager = new WorkerManager({
			mode: 'custom',
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

		await manager.createWorker({
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

	test('waits for custom adapters before exposing a created worker', async () => {
		let releaseSpawn!: () => void;
		const spawn = vi.fn(
			() =>
				new Promise<void>(resolve => {
					releaseSpawn = resolve;
				}),
		);
		const info = gatewayInfo();
		const manager = new WorkerManager({
			mode: 'custom',
			token: 'token',
			intents: 0,
			info,
			adapter: { postMessage() {}, spawn },
		});
		const creation = manager.createWorker({
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
		const pendingCreation = Promise.resolve(creation);
		let settled = false;
		void pendingCreation.then(() => {
			settled = true;
		});

		await Promise.resolve();
		expect(settled).toBe(false);
		releaseSpawn();
		await expect(pendingCreation).resolves.toEqual({ ready: false });
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
			worker = (await manager.createWorker({
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
			})) as Worker;
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

	test('registers worker responses before a custom adapter finishes sending', async () => {
		const info = gatewayInfo();
		let manager!: WorkerManager;
		manager = new WorkerManager({
			mode: 'custom',
			token: 'token',
			intents: 0,
			info,
			adapter: {
				spawn() {},
				async postMessage(workerId, message) {
					if (
						typeof message !== 'object' ||
						message === null ||
						!('type' in message) ||
						message.type !== 'WORKER_INFO' ||
						!('nonce' in message)
					)
						return;
					await manager.handleWorkerMessage({
						type: 'WORKER_INFO',
						workerId,
						nonce: message.nonce as string,
						shards: [],
					});
				},
			},
		});
		manager.set(0, { ready: true });

		await expect(manager.getWorkerInfo(0)).resolves.toEqual({ workerId: 0, shards: [] });
	});

	test('cleans registered worker responses when a custom adapter rejects the send', async () => {
		const transportError = new Error('transport failed');
		const manager = new WorkerManager({
			mode: 'custom',
			token: 'token',
			intents: 0,
			info: gatewayInfo(),
			adapter: {
				spawn() {},
				async postMessage() {
					throw transportError;
				},
			},
		});
		manager.set(0, { ready: true });

		await expect(manager.getWorkerInfo(0)).rejects.toBe(transportError);
		expect(manager.promises).toHaveLength(0);
	});

	test('registers cross-worker responses before the worker transport finishes sending', async () => {
		let client!: WorkerClient;
		client = new WorkerClient({
			async postMessage(message) {
				if (typeof message !== 'object' || message === null || !('nonce' in message)) return;
				await client.handleManagerMessages({
					type: 'EVAL_RESPONSE',
					nonce: message.nonce as string,
					response: 'done',
				});
			},
		});
		client.setWorkerData({ workerId: 0 } as WorkerClient['workerData']);

		await expect(client.tellWorker(1, () => 'done', {})).resolves.toBe('done');
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

	test('stops resharding after a worker transport failure', async () => {
		vi.useFakeTimers();
		const getInfo = vi.fn(async () => gatewayInfo(2));
		const transportError = new Error('transport failed');
		const { errors, manager } = createReshardingManager({
			getInfo,
			postMessage(_workerId, message) {
				if (message.type === 'SPAWN_SHARDS_RESHARDING') throw transportError;
			},
		});

		await manager.startResharding();
		await vi.advanceTimersByTimeAsync(100);
		await manager.handleWorkerMessage({ type: 'WORKER_START_RESHARDING', workerId: 0 });
		await vi.advanceTimersByTimeAsync(200);

		expect(getInfo).toHaveBeenCalledTimes(1);
		expect(manager.totalShards).toBe(1);
		expect(manager.concurrency).toBe(1);
		expect(errors).toHaveBeenCalledWith(
			'Worker resharding failed; restart the workers and manager before retrying.',
			transportError,
		);
		vi.useRealTimers();
	});

	test('allows reentrant custom adapters during resharding', async () => {
		vi.useFakeTimers();
		const messages: string[] = [];
		let manager!: WorkerManager;
		({ manager } = createReshardingManager({
			getInfo: async () => gatewayInfo(2, 2),
			async postMessage(workerId, message) {
				messages.push(message.type);
				if (message.type === 'SPAWN_SHARDS_RESHARDING') {
					await manager.handleWorkerMessage({ type: 'CONNECT_QUEUE_RESHARDING', workerId, shardId: 1 });
				}
			},
		}));

		await manager.startResharding();
		await vi.advanceTimersByTimeAsync(100);
		await manager.handleWorkerMessage({ type: 'WORKER_START_RESHARDING', workerId: 0 });

		expect(messages).toContain('ALLOW_CONNECT_RESHARDING');
		manager.stopResharding();
		vi.useRealTimers();
	});

	test('registers a new custom worker before its reentrant reshard handshake', async () => {
		vi.useFakeTimers();
		const messages: { type: string; workerId: number }[] = [];
		let manager!: WorkerManager;
		const result = createReshardingManager({
			getInfo: async () => gatewayInfo(2),
			shardsPerWorker: 1,
			async spawn(workerData) {
				if (!workerData.resharding || workerData.workerId === 0) return;
				await manager.handleWorkerMessage({ type: 'WORKER_START_RESHARDING', workerId: workerData.workerId });
			},
			postMessage(workerId, message) {
				messages.push({ type: message.type, workerId });
			},
		});
		manager = result.manager;

		await manager.startResharding();
		await vi.advanceTimersByTimeAsync(100);
		await manager.handleWorkerMessage({ type: 'WORKER_READY_RESHARDING', workerId: 0 });

		expect(manager.has(1)).toBe(true);
		expect(messages).toContainEqual({ type: 'SPAWN_SHARDS_RESHARDING', workerId: 1 });
		expect(result.errors).not.toHaveBeenCalled();
		manager.stopResharding();
		vi.useRealTimers();
	});

	test('removes a new custom worker whose spawn finishes after reshard failure', async () => {
		vi.useFakeTimers();
		let releaseSpawn!: () => void;
		const { manager } = createReshardingManager({
			getInfo: async () => gatewayInfo(2),
			heartbeaterInterval: 10,
			shardsPerWorker: 1,
			spawn(workerData) {
				if (workerData.workerId === 0) return;
				return new Promise<void>(resolve => {
					releaseSpawn = resolve;
				});
			},
		});

		await manager.startResharding();
		await vi.advanceTimersByTimeAsync(100);
		const spawning = manager.handleWorkerMessage({ type: 'WORKER_READY_RESHARDING', workerId: 0 });
		await Promise.resolve();
		expect(manager.has(1)).toBe(true);
		await vi.advanceTimersByTimeAsync(20);
		releaseSpawn();
		await spawning;

		expect(manager.has(0)).toBe(false);
		expect(manager.has(1)).toBe(false);
		vi.useRealTimers();
	});

	test('does not commit topology when the final resharding send fails', async () => {
		vi.useFakeTimers();
		const transportError = new Error('connect failed');
		let rejectConnect!: (error: Error) => void;
		const { errors, manager } = createReshardingManager({
			getInfo: async () => gatewayInfo(2),
			postMessage(_workerId, message) {
				if (message.type !== 'CONNECT_ALL_SHARDS_RESHARDING') return;
				return new Promise<void>((_resolve, reject) => {
					rejectConnect = reject;
				});
			},
		});

		await manager.startResharding();
		await vi.advanceTimersByTimeAsync(100);
		await manager.handleWorkerMessage({ type: 'WORKER_READY_RESHARDING', workerId: 0 });
		const committing = manager.handleWorkerMessage({ type: 'DISCONNECTED_ALL_SHARDS_RESHARDING', workerId: 0 });
		await Promise.resolve();
		rejectConnect(transportError);
		await committing;

		expect(manager.totalShards).toBe(1);
		expect(errors).toHaveBeenCalledWith(
			'Worker resharding failed; restart the workers and manager before retrying.',
			transportError,
		);
		vi.useRealTimers();
	});

	test('discards queued reshard sends after the attempt fails', async () => {
		vi.useFakeTimers();
		const messages: string[] = [];
		const { manager } = createReshardingManager({
			getInfo: async () => gatewayInfo(2),
			postMessage(_workerId, message) {
				messages.push(message.type);
				if (message.type === 'SPAWN_SHARDS_RESHARDING') throw new Error('spawn failed');
			},
		});

		await manager.startResharding();
		await vi.advanceTimersByTimeAsync(100);
		await manager.connectQueue.push(() => undefined);
		const queued = manager.handleWorkerMessage({ type: 'CONNECT_QUEUE_RESHARDING', workerId: 0, shardId: 1 });
		await Promise.resolve();
		await manager.handleWorkerMessage({ type: 'WORKER_START_RESHARDING', workerId: 0 });
		await vi.advanceTimersByTimeAsync(100);
		await queued;

		expect(messages).not.toContain('ALLOW_CONNECT_RESHARDING');
		vi.useRealTimers();
	});

	test('fails an active reshard when a worker heartbeat is lost', async () => {
		vi.useFakeTimers();
		const getInfo = vi.fn(async () => gatewayInfo(2));
		const { errors, manager } = createReshardingManager({ getInfo, heartbeaterInterval: 10 });

		await manager.startResharding();
		await vi.advanceTimersByTimeAsync(100);
		await vi.advanceTimersByTimeAsync(20);

		expect(manager.has(0)).toBe(false);
		expect(errors).toHaveBeenCalledWith(
			'Worker resharding failed; restart the workers and manager before retrying.',
			expect.objectContaining({ code: 'INTERNAL_ERROR' }),
		);
		expect(getInfo).toHaveBeenCalledTimes(1);
		vi.useRealTimers();
	});

	test('rejects cluster sends when IPC is unavailable or reports an error', async () => {
		const manager = new WorkerManager({
			mode: 'clusters',
			path: 'worker.js',
			token: 'token',
			intents: 0,
			info: gatewayInfo(),
		});
		manager.set(0, { isConnected: () => false } as never);

		await expect(manager.postMessage(0, { type: 'HEARTBEAT' })).rejects.toMatchObject({
			code: 'INTERNAL_ERROR',
		});

		const transportError = new Error('IPC callback failed');
		manager.set(0, {
			isConnected: () => true,
			send(_message: unknown, callback: (error: Error | null) => void) {
				callback(transportError);
			},
		} as never);
		await expect(manager.postMessage(0, { type: 'HEARTBEAT' })).rejects.toBe(transportError);
	});

	test('closes the manager after a reachable partial reshard failure', async () => {
		vi.useFakeTimers();
		const errorLog = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
		const disconnectedWorkers = new Set<number>();
		const messages: { type: string; workerId: number }[] = [];
		let manager!: WorkerManager;
		const result = createReshardingManager({
			getInfo: async () => gatewayInfo(2),
			heartbeaterInterval: 10,
			shardsPerWorker: 1,
			withDebugger: false,
			async postMessage(workerId, message) {
				messages.push({ type: message.type, workerId });
				if (message.type !== 'DISCONNECT_ALL_SHARDS_RESHARDING') return;
				if (workerId === 1) throw new Error('worker 1 transport failed');
				disconnectedWorkers.add(workerId);
				await manager.handleWorkerMessage({ type: 'DISCONNECTED_ALL_SHARDS_RESHARDING', workerId });
			},
		});
		manager = result.manager;

		await manager.startResharding();
		await vi.advanceTimersByTimeAsync(100);
		const pendingInfo = expect(manager.getWorkerInfo(0)).rejects.toMatchObject({
			code: 'INTERNAL_ERROR',
			message: 'Worker manager cannot continue after a failed reshard; restart required.',
		});
		await manager.handleWorkerMessage({ type: 'WORKER_READY_RESHARDING', workerId: 0 });
		await manager.handleWorkerMessage({ type: 'WORKER_READY_RESHARDING', workerId: 1 });
		await pendingInfo;

		expect(disconnectedWorkers).toEqual(new Set([0]));
		expect(manager.promises.size).toBe(0);
		expect(manager.heartbeater.store.size).toBe(0);
		expect(errorLog).toHaveBeenCalledWith(
			'Worker resharding failed; restart the workers and manager before retrying.',
			expect.any(Error),
		);

		const sentMessages = messages.length;
		await expect(manager.postMessage(0, { type: 'HEARTBEAT' })).rejects.toMatchObject({
			code: 'INTERNAL_ERROR',
			message: 'Worker manager cannot continue after a failed reshard; restart required.',
		});
		await expect(manager.startResharding()).rejects.toMatchObject({ code: 'INTERNAL_ERROR' });
		expect(messages).toHaveLength(sentMessages);

		const handlePayload = vi.fn();
		manager.options.handlePayload = handlePayload;
		await manager.handleWorkerMessage({
			type: 'RECEIVE_PAYLOAD',
			workerId: 0,
			shardId: 0,
			payload: { op: 0, t: 'READY', s: 1, d: {} },
		} as never);
		expect(handlePayload).not.toHaveBeenCalled();

		errorLog.mockRestore();
		vi.useRealTimers();
	});
});

function gatewayInfo(shards = 1, maxConcurrency = 1) {
	return {
		shards,
		url: 'wss://gateway.discord.gg',
		session_start_limit: {
			total: 1,
			remaining: 1,
			reset_after: 0,
			max_concurrency: maxConcurrency,
		},
	};
}

function createReshardingManager({
	getInfo,
	heartbeaterInterval = 0,
	postMessage = () => undefined,
	shardsPerWorker = 8,
	spawn = () => undefined,
	withDebugger = true,
}: {
	getInfo: () => Promise<ReturnType<typeof gatewayInfo>>;
	heartbeaterInterval?: number;
	postMessage?: (workerId: number, message: { type: string }) => unknown;
	shardsPerWorker?: number;
	spawn?: (workerData: Parameters<NonNullable<WorkerManager['options']['adapter']>['spawn']>[0]) => unknown;
	withDebugger?: boolean;
}) {
	const manager = new WorkerManager({
		mode: 'custom',
		token: 'token',
		intents: 0,
		info: gatewayInfo(),
		totalShards: 1,
		shardStart: 0,
		shardEnd: 1,
		shardsPerWorker,
		workers: 1,
		heartbeaterInterval,
		resharding: { getInfo, interval: 100, percentage: 0 },
		adapter: {
			spawn: spawn as never,
			postMessage: postMessage as never,
		},
	});
	manager.connectQueue = new ConnectQueue(100, 1);
	manager.set(0, { ready: true });
	const errors = vi.fn();
	if (withDebugger) manager.debugger = { debug: vi.fn(), error: errors, info: vi.fn() } as never;
	return { errors, manager };
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
