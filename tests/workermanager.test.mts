import { resolve } from 'node:path';
import { MessageChannel, type Worker } from 'node:worker_threads';
import { assert, describe, expect, test, vi } from 'vitest';
import { WorkerAdapter } from '../lib/cache';
import { WorkerClient } from '../lib/client/workerclient';
import { SeyfertError } from '../lib/common';
import { deserializeWorkerError, serializeWorkerError } from '../lib/websocket/discord/worker-errors';
import { WorkerManager } from '../lib/websocket/discord/workermanager';

describe('WorkerManager', () => {
	test('forwards environment variables to custom adapters', () => {
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

		const worker = manager.createWorker({
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
		expect(worker).toEqual({ ready: false });

		expect(spawn).toHaveBeenCalledWith(
			expect.objectContaining({ path: 'worker.js' }),
			expect.objectContaining({
				CUSTOM_WORKER_ENV_TEST: 'configured',
				SEYFERT_SPAWNING: 'true',
			}),
		);
	});

	test('waits for custom adapter spawn before registering its heartbeat', async () => {
		let releaseSpawn!: () => void;
		const spawn = vi.fn(
			() =>
				new Promise<void>(resolve => {
					releaseSpawn = resolve;
				}),
		);
		const manager = new WorkerManager({
			mode: 'custom',
			token: 'token',
			intents: 0,
			info: gatewayInfo(),
			heartbeaterInterval: 0,
			adapter: { postMessage() {}, spawn },
		});
		const register = vi.spyOn(manager.heartbeater, 'register');
		manager.prepareWorkers([[0]]);
		const creation = manager.workerQueue.shift()!();

		await Promise.resolve();
		expect(register).not.toHaveBeenCalled();
		releaseSpawn();
		await expect(creation).resolves.toBeUndefined();
		expect(register).toHaveBeenCalledWith(0, expect.any(Function));
		expect(manager.get(0)).toEqual({ ready: false });
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
			});
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

	test('rejects worker requests when cluster IPC reports a send error', async () => {
		const transportError = new Error('IPC callback failed');
		const manager = new WorkerManager({
			mode: 'clusters',
			path: 'worker.js',
			token: 'token',
			intents: 0,
			info: gatewayInfo(),
		});
		manager.set(0, {
			isConnected: () => true,
			send(_message: unknown, callback: (error: Error | null) => void) {
				callback(transportError);
			},
		} as never);

		await expect(manager.getWorkerInfo(0)).rejects.toBe(transportError);
		expect(manager.promises).toHaveLength(0);
	});

	test('rejects native sends when the worker is unavailable', async () => {
		const manager = new WorkerManager({
			mode: 'clusters',
			path: 'worker.js',
			token: 'token',
			intents: 0,
			info: gatewayInfo(),
		});

		await expect(manager.postMessage(4, { type: 'HEARTBEAT' })).rejects.toMatchObject({
			code: 'WORKER_NOT_FOUND',
			metadata: { workerId: 4 },
		});

		const send = vi.fn();
		manager.set(4, { isConnected: () => false, send } as never);
		await expect(manager.postMessage(4, { type: 'HEARTBEAT' })).rejects.toMatchObject({
			code: 'INTERNAL_ERROR',
			metadata: expect.objectContaining({ workerId: 4, mode: 'clusters' }),
		});
		expect(send).not.toHaveBeenCalled();
	});

	test('accepts synchronous reshard queue callbacks', async () => {
		const callback = vi.fn();
		const manager = new WorkerManager({
			mode: 'custom',
			token: 'token',
			intents: 0,
			info: gatewayInfo(),
			adapter: { postMessage() {}, spawn() {} },
		});
		manager.set(0, {});
		manager.reshardingWorkerQueue.push(callback);

		await expect(
			manager.handleWorkerMessage({ type: 'WORKER_READY_RESHARDING', workerId: 0 }),
		).resolves.toBeUndefined();
		expect(callback).toHaveBeenCalledOnce();
	});

	test('rejects worker-thread clone errors', async () => {
		const { port1, port2 } = new MessageChannel();
		const manager = new WorkerManager({
			mode: 'threads',
			path: 'worker.js',
			token: 'token',
			intents: 0,
			info: gatewayInfo(),
		});
		manager.set(0, port1 as never);

		try {
			await expect(
				manager.postMessage(0, { type: 'EVAL_RESPONSE', nonce: 'clone-error', response: () => undefined }),
			).rejects.toMatchObject({ name: 'DataCloneError' });
		} finally {
			port1.close();
			port2.close();
		}
	});

	test('registers cross-worker responses before the worker transport finishes sending', async () => {
		let client!: WorkerClient;
		let transportReceiver: unknown;
		client = new WorkerClient({
			async postMessage(this: unknown, message) {
				transportReceiver = this;
				if (typeof message !== 'object' || message === null || !('nonce' in message)) return;
				await client.handleManagerMessages({
					type: 'EVAL_RESPONSE',
					nonce: message.nonce as string,
					response: 'done',
				});
			},
		});
		const previousWorkerData = client.workerData;
		client.setWorkerData({ workerId: 0, totalWorkers: 2 } as WorkerClient['workerData']);

		const response = client.tellWorker(1, () => 'done', {});
		try {
			expect(client.promises).toHaveLength(0);
			await expect(response).resolves.toBe('done');
			expect(transportReceiver).toBe(client);
		} finally {
			for (const pending of client.promises.values()) clearTimeout(pending.timeout);
			client.promises.clear();
			client.setWorkerData(previousWorkerData);
		}
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

	test('returns cache adapter failures to the requesting worker', async () => {
		const sharedMetadata = { value: 42 };
		const metadata = JSON.parse('{"__proto__":{"scope":"metadata"}}') as Record<string, unknown>;
		metadata.value = 1n;
		metadata.first = sharedMetadata;
		metadata.second = sharedMetadata;
		metadata.self = metadata;
		const cause = JSON.parse(
			'{"name":"payload","message":"detail","extra":42,"__proto__":{"scope":"cause"}}',
		) as Record<string, unknown>;
		cause.nested = new Error('root cause', { cause: 2n });
		const manager = Object.create(WorkerManager.prototype) as WorkerManager;
		manager.has = () => true;
		manager.cacheAdapter = {
			set() {
				throw new SeyfertError('CUSTOM_CACHE_ERROR', {
					metadata,
					cause,
				});
			},
		} as unknown as WorkerManager['cacheAdapter'];
		let wireMessage: unknown;
		manager.postMessage = ((_workerId: number, message: unknown) => {
			wireMessage = JSON.parse(JSON.stringify(message));
		}) as WorkerManager['postMessage'];

		const adapter = Object.create(WorkerAdapter.prototype) as WorkerAdapter;
		adapter.workerData = { workerId: 0 } as WorkerAdapter['workerData'];
		adapter.promises = new Map();
		let request: unknown;
		adapter.postMessage = message => {
			request = message;
		};
		const pending = adapter.set('user.user-1', { id: 'user-1' }, ['user', 'user-1']);
		const rejected = pending.then(
			() => undefined,
			error => error,
		);

		await manager.handleWorkerMessage(request as never);

		const client = Object.create(WorkerClient.prototype) as WorkerClient;
		Object.defineProperty(client, 'cache', { value: { adapter } });
		await client.handleManagerMessages(wireMessage as never);
		const error = await rejected;
		expect(error).toMatchObject({
			name: 'SeyfertError',
			code: 'CUSTOM_CACHE_ERROR',
			metadata: {
				value: '1',
				first: { value: 42 },
				second: { value: 42 },
				self: '[Circular]',
			},
			cause: {
				name: 'payload',
				message: 'detail',
				extra: 42,
				nested: { message: 'root cause', cause: '2' },
			},
		});
		assert.equal(Object.hasOwn(error.metadata, '__proto__'), true);
		assert.deepEqual(error.metadata.__proto__, { scope: 'metadata' });
		assert.equal(Object.hasOwn(error.cause, '__proto__'), true);
		assert.deepEqual(error.cause.__proto__, { scope: 'cause' });
		assert.equal(adapter.promises.size, 0);
	});

	test('registers cache requests before a synchronous response', async () => {
		vi.useFakeTimers();
		try {
			const adapter = Object.create(WorkerAdapter.prototype) as WorkerAdapter;
			adapter.workerData = { workerId: 0 } as WorkerAdapter['workerData'];
			adapter.promises = new Map();
			const client = Object.create(WorkerClient.prototype) as WorkerClient;
			Object.defineProperty(client, 'cache', { value: { adapter } });
			adapter.postMessage = request => {
				void client.handleManagerMessages({
					type: 'CACHE_RESULT',
					nonce: request.nonce,
					error: { type: 'error', name: 'Error', message: 'synchronous failure' },
				});
			};

			const rejection = expect(adapter.set('user.user-1', { id: 'user-1' }, ['user', 'user-1'])).rejects.toThrow(
				'synchronous failure',
			);
			assert.equal(vi.getTimerCount(), 0);
			await rejection;
			assert.equal(adapter.promises.size, 0);
		} finally {
			vi.useRealTimers();
		}
	});

	test('rejects cache requests when an async custom transport fails', async () => {
		vi.useFakeTimers();
		try {
			const adapter = Object.create(WorkerAdapter.prototype) as WorkerAdapter;
			adapter.workerData = { workerId: 0 } as WorkerAdapter['workerData'];
			adapter.promises = new Map();
			adapter.postMessage = async () => {
				throw new Error('transport failed');
			};

			await expect(adapter.get('user.user-1')).rejects.toThrow('transport failed');
			assert.equal(adapter.promises.size, 0);
			assert.equal(vi.getTimerCount(), 0);
		} finally {
			vi.useRealTimers();
		}
	});

	test('rejects cache requests when a custom transport throws synchronously', async () => {
		vi.useFakeTimers();
		try {
			const adapter = Object.create(WorkerAdapter.prototype) as WorkerAdapter;
			adapter.workerData = { workerId: 0 } as WorkerAdapter['workerData'];
			adapter.promises = new Map();
			adapter.postMessage = () => {
				throw new Error('transport failed');
			};

			await expect(adapter.get('user.user-1')).rejects.toThrow('transport failed');
			assert.equal(adapter.promises.size, 0);
			assert.equal(vi.getTimerCount(), 0);
		} finally {
			vi.useRealTimers();
		}
	});

	test('preserves empty custom error fields', () => {
		const original = new SeyfertError('', { metadata: { detail: 'empty code' } });
		original.stack = '';
		const serialized = JSON.parse(JSON.stringify(serializeWorkerError(original)));
		const error = deserializeWorkerError(serialized);

		expect(error).toBeInstanceOf(SeyfertError);
		expect(error).toMatchObject({ code: '', metadata: { detail: 'empty code' }, stack: '' });
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
