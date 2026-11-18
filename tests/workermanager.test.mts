import { resolve } from 'node:path';
import { MessageChannel, type Worker } from 'node:worker_threads';
import { assert, describe, expect, test, vi } from 'vitest';
import { createPlugin } from '../lib';
import { type Adapter, MemoryAdapter, WorkerAdapter } from '../lib/cache';
import { BaseClient } from '../lib/client/base';
import { WorkerClient, type WorkerClientOptions } from '../lib/client/workerclient';
import { Logger, SeyfertError } from '../lib/common';
import { serializeWorkerError } from '../lib/websocket/discord/worker-errors';
import { WorkerManager } from '../lib/websocket/discord/workermanager';
import { ConnectQueue } from '../lib/websocket/structures/timeout';

function cacheBridge(backend: Adapter) {
	const manager = new WorkerManager({
		mode: 'custom',
		token: 'token',
		intents: 0,
		info: gatewayInfo(),
		heartbeaterInterval: 0,
		adapter: {
			spawn() {},
			postMessage: (_workerId, message) => client.handleManagerMessages(JSON.parse(JSON.stringify(message))),
		},
	});
	manager.set(0, {});
	manager.setCache(backend);
	const adapter = new WorkerAdapter({ workerId: 0 } as WorkerAdapter['workerData']);
	const client = new WorkerClient();
	client.setServices({ cache: { adapter, trackMemberCount: true } });
	const requests: string[] = [];
	adapter.postMessage = message => {
		requests.push(message.method);
		return manager.handleWorkerMessage(JSON.parse(JSON.stringify(message)));
	};

	return { adapter, client, requests };
}

describe('WorkerManager', () => {
	test('an in-flight increment retains guild order past the normal cache RPC timeout', async () => {
		vi.useFakeTimers();
		const memory = new MemoryAdapter();
		memory.set('guild.guild-1', { member_count: 10 }, ['guild', 'guild-1']);
		let release!: () => void;
		let entered!: () => void;
		const gate = new Promise<void>(resolve => {
			release = resolve;
		});
		const started = new Promise<void>(resolve => {
			entered = resolve;
		});
		const delayed = new Proxy(memory, {
			get(target, key) {
				if (key === 'increment')
					return async (...args: Parameters<MemoryAdapter<unknown>['increment']>) => {
						entered();
						await gate;
						return target.increment(...args);
					};
				const value = Reflect.get(target, key);
				return typeof value === 'function' ? value.bind(target) : value;
			},
		});
		const { adapter, client } = cacheBridge(delayed);
		let removal: Promise<unknown> | undefined;
		let snapshot: Promise<unknown> | undefined;
		let failure: unknown;
		try {
			await adapter.start();
			removal = client.cache
				.onPacket({ t: 'GUILD_MEMBER_REMOVE', d: { guild_id: 'guild-1', user: { id: 'user-1' } } } as never)
				.catch(error => {
					failure = error;
				});
			await started;
			snapshot = client.cache.onPacket({ t: 'GUILD_CREATE', d: { id: 'guild-1', member_count: 20 } } as never);
			await vi.advanceTimersByTimeAsync(60_001);
			expect(failure).toBeUndefined();
			expect(memory.get('guild.guild-1')).toEqual({ member_count: 10 });
			expect(adapter.promises.size).toBe(1);
			release();
			await Promise.all([removal, snapshot]);
			expect(memory.get('guild.guild-1')).toMatchObject({ member_count: 20 });
			expect(adapter.promises.size).toBe(0);
			expect(vi.getTimerCount()).toBe(0);
		} finally {
			release();
			await Promise.allSettled([removal, snapshot]);
			for (const pending of adapter.promises.values()) clearTimeout(pending.timeout);
			adapter.promises.clear();
			vi.useRealTimers();
		}
	});

	test.each(['sync', 'async'] as const)(
		'cleans up an undelivered increment when the %s transport fails',
		async mode => {
			vi.useFakeTimers();
			const backend = new MemoryAdapter();
			backend.set('guild.guild-1', { member_count: 10 }, ['guild', 'guild-1']);
			const { adapter } = cacheBridge(backend);
			try {
				await adapter.start();
				const fail = () => {
					throw new Error('not delivered');
				};
				adapter.postMessage = mode === 'sync' ? fail : async () => fail();
				await expect(adapter.increment!('guild.guild-1', 'member_count', 1)).rejects.toThrow('not delivered');
				expect(backend.get('guild.guild-1')).toEqual({ member_count: 10 });
				expect(adapter.promises.size).toBe(0);
				expect(vi.getTimerCount()).toBe(0);
			} finally {
				for (const pending of adapter.promises.values()) clearTimeout(pending.timeout);
				adapter.promises.clear();
				vi.useRealTimers();
			}
		},
	);

	test('negotiates atomic increments once and forwards results and errors through JSON IPC', async () => {
		vi.useFakeTimers();
		const backend = new MemoryAdapter();
		backend.set('guild.guild-1', { member_count: 10, name: 'preserved' }, ['guild', 'guild-1']);
		const { adapter, requests } = cacheBridge(backend);
		try {
			expect(adapter.increment).toBeUndefined();
			await adapter.start();
			expect(adapter.increment).toBeTypeOf('function');
			await expect(adapter.increment!('guild.guild-1', 'member_count', -1, { min: 0 })).resolves.toBe(9);
			await expect(adapter.increment!('guild.missing', 'member_count', 1)).resolves.toBeUndefined();
			await Promise.all(Array.from({ length: 4 }, () => adapter.increment!('guild.guild-1', 'member_count', 1)));
			expect(backend.get('guild.guild-1')).toEqual({ member_count: 13, name: 'preserved' });
			const failing = vi.spyOn(backend, 'increment').mockImplementationOnce(() => {
				throw new Error('backend unavailable');
			});
			try {
				await expect(adapter.increment!('guild.guild-1', 'member_count', 1)).rejects.toThrow('backend unavailable');
				expect(failing).toHaveBeenCalledOnce();
			} finally {
				failing.mockRestore();
			}
			expect(requests.filter(method => method === 'capabilities')).toHaveLength(1);
			expect(requests.every(method => method === 'capabilities' || method === 'increment')).toBe(true);
			expect(adapter.promises.size).toBe(0);
			expect(vi.getTimerCount()).toBe(0);
		} finally {
			for (const pending of adapter.promises.values()) clearTimeout(pending.timeout);
			adapter.promises.clear();
			vi.useRealTimers();
		}
	});

	test.each([true, false])(
		'worker counters use the negotiated capability or queued fallback (atomic: %s)',
		async atomic => {
			const memory = new MemoryAdapter();
			const legacy = new Proxy(memory, {
				get(target, key) {
					if (key === 'increment' && !atomic) return undefined;
					const value = Reflect.get(target, key);
					return typeof value === 'function' ? value.bind(target) : value;
				},
			});
			memory.set('guild.guild-1', { member_count: 10 }, ['guild', 'guild-1']);
			const { adapter, client, requests } = cacheBridge(legacy);
			try {
				await adapter.start();
				expect(typeof adapter.increment).toBe(atomic ? 'function' : 'undefined');
				await Promise.all(
					Array.from({ length: 3 }, () =>
						client.cache.onPacket({
							t: 'GUILD_MEMBER_REMOVE',
							d: { guild_id: 'guild-1', user: { id: 'user-1' } },
						} as never),
					),
				);
				expect(memory.get('guild.guild-1')).toEqual({ member_count: 7 });
				if (atomic) {
					expect(requests.filter(method => method === 'increment')).toHaveLength(3);
					expect(requests).not.toContain('get');
					expect(requests).not.toContain('bulkPatch');
				} else {
					expect(requests).not.toContain('increment');
					expect(requests).toContain('get');
					expect(requests).toContain('bulkPatch');
				}
				expect(adapter.promises.size).toBe(0);
			} finally {
				for (const pending of adapter.promises.values()) clearTimeout(pending.timeout);
				adapter.promises.clear();
			}
		},
	);

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

	test('preserves binary REST responses through JSON worker IPC', async () => {
		const bytes = new Uint8Array([137, 80, 78, 71, 0, 255]);
		const manager = new WorkerManager({ mode: 'clusters', path: '', heartbeaterInterval: 0 });
		manager.rest = { request: async () => bytes.buffer } as unknown as WorkerManager['rest'];
		let wireMessage: unknown;
		manager.set(0, {
			isConnected: () => true,
			send(message: unknown, callback: (error: Error | null) => void) {
				wireMessage = JSON.parse(JSON.stringify(message));
				callback(null);
			},
		} as never);

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
		let wireMessage: unknown;
		const manager = new WorkerManager({
			mode: 'custom',
			heartbeaterInterval: 0,
			adapter: {
				spawn() {},
				postMessage(_workerId, message) {
					wireMessage = JSON.parse(JSON.stringify(message));
				},
			},
		});
		manager.set(0, {});
		manager.cacheAdapter = {
			set() {
				throw new SeyfertError('CUSTOM_CACHE_ERROR', {
					metadata,
					cause,
				});
			},
		} as unknown as WorkerManager['cacheAdapter'];

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

	test('a failed resharding check is logged instead of crashing the process', async () => {
		vi.useFakeTimers();
		const failure = new Error('gateway bot unavailable');
		const getInfo = vi.fn().mockRejectedValue(failure);
		const logError = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
		const unhandled = vi.fn();
		process.on('unhandledRejection', unhandled);
		try {
			const manager = new WorkerManager({
				mode: 'custom',
				token: 'token',
				intents: 0,
				info: gatewayInfo(),
				heartbeaterInterval: 0,
				adapter: { postMessage() {}, spawn() {} },
				resharding: { getInfo, interval: 1_000, percentage: 80 },
			});

			await manager.startResharding();
			await vi.advanceTimersByTimeAsync(1_000);
			await new Promise(resolve => process.nextTick(resolve));

			expect(getInfo).toHaveBeenCalledOnce();
			expect(logError).toHaveBeenCalledWith('Resharding check failed', failure);
			expect(unhandled).not.toHaveBeenCalled();
			// A failure must not switch on the debug logger the user left disabled.
			expect(manager.debugger).toBeUndefined();
		} finally {
			process.off('unhandledRejection', unhandled);
			logError.mockRestore();
			vi.clearAllTimers();
			vi.useRealTimers();
		}
	});
});

type FakeMessage = { type: string; [key: string]: any };
type FakeBehavior = {
	neverReady?: boolean;
	crash?: boolean;
	failSpawn?: boolean;
	unreachable?: boolean;
	exitOnActivation?: boolean;
	cannotStop?: boolean;
};

/** In-process workers that follow the worker side of the manager protocol over a custom adapter. */
function hotReloadHarness(
	options: {
		workers?: number;
		behavior?: (workerId: number, generation: number) => FakeBehavior;
		/** Draining workers acknowledge only once this settles. */
		holdDrain?: Promise<void>;
	} = {},
) {
	const workers = options.workers ?? 2;
	const log: string[] = [];
	const instances = new Map<string, { shards: number[]; connected: Set<number> }>();
	const replies = new Map<string, FakeMessage[]>();
	let manager!: WorkerManager;

	const send = (workerId: number, generation: number, message: FakeMessage) => {
		setImmediate(() => {
			void manager.handleWorkerMessage(JSON.parse(JSON.stringify({ ...message, workerId })), generation);
		});
	};
	const receive = (workerId: number, generation: number, body: FakeMessage) => {
		const key = `${workerId}:${generation}`;
		const instance = instances.get(key);
		if (!instance) return;
		(replies.get(key) ?? replies.set(key, []).get(key)!).push(body);
		switch (body.type) {
			case 'SPAWN_SHARDS':
				for (const shardId of instance.shards) send(workerId, generation, { type: 'CONNECT_QUEUE', shardId });
				break;
			case 'ALLOW_CONNECT':
				instance.connected.add(body.shardId);
				if (instance.connected.size !== instance.shards.length) break;
				send(workerId, generation, { type: 'WORKER_SHARDS_CONNECTED' });
				if (options.behavior?.(workerId, generation).crash) {
					setImmediate(() => manager.handleWorkerExit(workerId, generation, new Error('replacement crashed')));
				} else if (!options.behavior?.(workerId, generation).neverReady) {
					send(workerId, generation, { type: 'WORKER_READY' });
				}
				break;
			case 'BOT_READY':
				log.push('bot ready');
				break;
			case 'HOT_RELOAD_ACTIVATE':
			case 'HOT_RELOAD_STOP':
			case 'HOT_RELOAD_DRAIN':
				log.push(`${body.type.slice('HOT_RELOAD_'.length).toLowerCase()} ${key}`);
				if (body.type === 'HOT_RELOAD_ACTIVATE' && options.behavior?.(workerId, generation).exitOnActivation) {
					setImmediate(() =>
						manager.handleWorkerExit(workerId, generation, new Error('replacement exited during activation')),
					);
					break;
				}
				void Promise.resolve(body.type === 'HOT_RELOAD_DRAIN' ? options.holdDrain : undefined).then(() =>
					send(workerId, generation, {
						type: 'HOT_RELOAD_ACK',
						nonce: body.nonce,
					}),
				);
				break;
			case 'HOT_RELOAD_RESULT':
				log.push(`result ${key}`);
				break;
			case 'EXECUTE_EVAL':
				send(workerId, generation, { type: 'EVAL_RESPONSE', nonce: body.nonce, response: key });
				break;
		}
	};

	manager = new WorkerManager({
		mode: 'custom',
		token: 'token',
		intents: 0,
		info: { ...gatewayInfo(), shards: workers },
		totalShards: workers,
		shardsPerWorker: 1,
		workers,
		heartbeaterInterval: 0,
		adapter: {
			spawn(workerData) {
				const generation = workerData.generation ?? 0;
				if (options.behavior?.(workerData.workerId, generation).failSpawn) {
					return Promise.reject(new Error('replacement failed to load'));
				}
				instances.set(`${workerData.workerId}:${generation}`, { shards: workerData.shards, connected: new Set() });
				send(workerData.workerId, generation, { type: 'WORKER_START' });
				return undefined;
			},
			postMessage(workerId, body, generation = 0) {
				if (
					(body as FakeMessage).type === 'HOT_RELOAD_ACTIVATE' &&
					options.behavior?.(workerId, generation).unreachable
				) {
					throw new Error('replacement unreachable');
				}
				if ((body as FakeMessage).type === 'HOT_RELOAD_STOP' && options.behavior?.(workerId, generation).cannotStop) {
					throw new Error('old worker unreachable');
				}
				setImmediate(() => receive(workerId, generation, body as FakeMessage));
			},
			terminate(workerId, generation) {
				log.push(`terminate ${workerId}:${generation}`);
				instances.delete(`${workerId}:${generation}`);
			},
		},
	});
	manager.connectQueue = new ConnectQueue(0, 16);

	return {
		manager,
		log,
		replies,
		send,
		request(workerId: number, nonce: string, requestOptions: object = {}) {
			send(workerId, 0, { type: 'HOT_RELOAD_REQUEST', nonce, options: requestOptions });
		},
		async start() {
			manager.prepareWorkers(WorkerManager.prepareSpaces({ shardStart: 0, shardEnd: workers, shardsPerWorker: 1 }));
			await manager.workerQueue.shift()!();
			await vi.waitFor(() => expect(log).toContain('bot ready'));
		},
	};
}

describe('WorkerManager hot reload', () => {
	test('stops old dispatch before activating replacements and reroutes worker requests', async () => {
		const harness = hotReloadHarness();
		await harness.start();
		const progress: string[] = [];

		const result = await harness.manager.hotReload({
			drainTimeout: 10,
			onProgress: event => progress.push(`${event.workerId} ${event.stage}`),
		});

		expect(result.workers.map(({ workerId, ok }) => ({ workerId, ok }))).toEqual([
			{ workerId: 0, ok: true },
			{ workerId: 1, ok: true },
		]);
		const stages = ['spawning', 'connecting', 'ready', 'switching', 'draining', 'done'];
		expect(progress).toEqual([...stages.map(stage => `0 ${stage}`), ...stages.map(stage => `1 ${stage}`)]);
		// Stop admitting old dispatches before activating the replacement.
		expect(harness.log.filter(line => !line.startsWith('bot'))).toEqual([
			'stop 0:0',
			'activate 0:1',
			'drain 0:0',
			'terminate 0:0',
			'stop 1:0',
			'activate 1:2',
			'drain 1:0',
			'terminate 1:0',
		]);
		expect(harness.replies.get('0:1')?.find(body => body.type === 'HOT_RELOAD_ACTIVATE')).toMatchObject({
			botReady: true,
		});
		expect(harness.replies.get('1:2')?.find(body => body.type === 'HOT_RELOAD_ACTIVATE')).toMatchObject({
			botReady: false,
		});
		// Requests now reach the replacements, which got their shards through the connect queue.
		await expect(harness.manager.tellWorkers(() => null, {})).resolves.toEqual(['0:1', '1:2']);
		expect(harness.replies.get('0:1')?.find(body => body.type === 'ALLOW_CONNECT')).toMatchObject({ shardId: 0 });
	});

	test.each([
		['crashes', { crash: true }, /replacement crashed/],
		['fails to load', { failSpawn: true }, /replacement failed to load/],
		['is not ready in time', { neverReady: true }, /not ready within 50ms/],
	] as const)('keeps the old worker when its replacement %s', async (_label, behavior, error) => {
		const harness = hotReloadHarness({
			behavior: (workerId, generation) => (workerId === 0 && generation > 0 ? behavior : {}),
		});
		await harness.start();
		const progress: string[] = [];

		const result = await harness.manager.hotReload({
			readyTimeout: 50,
			onProgress: event => progress.push(event.stage),
		});

		expect(result.workers).toEqual([
			{ workerId: 0, ok: false, error: expect.stringMatching(error), ms: expect.any(Number) },
		]);
		expect(progress.at(-1)).toBe('failed');
		// Nothing was switched, stopped or drained, and worker 1 was not attempted.
		expect(harness.log.filter(line => !line.startsWith('bot') && !line.startsWith('terminate'))).toEqual([]);
		await expect(harness.manager.tellWorker(0, () => null, {})).resolves.toBe('0:0');
	});

	test('rolls back when the replacement exits during activation', async () => {
		const harness = hotReloadHarness({
			behavior: (workerId, generation) => ({ exitOnActivation: workerId === 0 && generation > 0 }),
		});
		await harness.start();

		const result = await harness.manager.hotReload();

		expect(result.workers).toEqual([
			{ workerId: 0, ok: false, error: 'replacement exited during activation', ms: expect.any(Number) },
		]);
		expect(harness.log.filter(line => !line.startsWith('bot'))).toEqual([
			'stop 0:0',
			'activate 0:1',
			'activate 0:0',
			'terminate 0:1',
		]);
		expect(harness.manager.promises.size).toBe(0);
		await expect(harness.manager.tellWorker(0, () => null, {})).resolves.toBe('0:0');
	});

	test('hands dispatch back to the old worker when its replacement cannot take over', async () => {
		const harness = hotReloadHarness({
			behavior: (workerId, generation) => (workerId === 0 && generation > 0 ? { unreachable: true } : {}),
		});
		await harness.start();

		const result = await harness.manager.hotReload();

		expect(result.workers).toEqual([
			{ workerId: 0, ok: false, error: 'replacement unreachable', ms: expect.any(Number) },
		]);
		expect(harness.log.filter(line => !line.startsWith('bot'))).toEqual(['stop 0:0', 'activate 0:0', 'terminate 0:1']);
		await expect(harness.manager.tellWorker(0, () => null, {})).resolves.toBe('0:0');
	});

	test('does not start the replacement when the old worker does not confirm it stopped', async () => {
		const harness = hotReloadHarness({
			behavior: (workerId, generation) => (workerId === 0 && generation === 0 ? { cannotStop: true } : {}),
		});
		await harness.start();

		const result = await harness.manager.hotReload();

		expect(result.workers).toEqual([
			{ workerId: 0, ok: false, error: 'old worker unreachable', ms: expect.any(Number) },
		]);
		// The old worker is told to keep dispatching, and the replacement never starts.
		expect(harness.log.filter(line => !line.startsWith('bot'))).toEqual(['activate 0:0', 'terminate 0:1']);
		await expect(harness.manager.tellWorker(0, () => null, {})).resolves.toBe('0:0');
	});

	test('waits until every worker is ready before reloading', async () => {
		const harness = hotReloadHarness({
			behavior: (workerId, generation) => (workerId === 1 && generation === 0 ? { neverReady: true } : {}),
		});
		harness.manager.prepareWorkers(WorkerManager.prepareSpaces({ shardStart: 0, shardEnd: 2, shardsPerWorker: 1 }));
		await harness.manager.workerQueue.shift()!();
		// Both workers are spawned, but worker 1 never reports ready, so BOT_READY was not sent yet.
		await vi.waitFor(() => expect(harness.manager.size).toBe(2));

		await expect(harness.manager.hotReload()).rejects.toSatisfy(error =>
			SeyfertError.is(error, 'HOT_RELOAD_UNSUPPORTED'),
		);
	});

	test('keeps going after a failure with continueOnError', async () => {
		const harness = hotReloadHarness({
			behavior: (workerId, generation) => (workerId === 0 && generation > 0 ? { crash: true } : {}),
		});
		await harness.start();

		const result = await harness.manager.hotReload({ continueOnError: true, drainTimeout: 10 });

		expect(result.workers.map(({ workerId, ok }) => ({ workerId, ok }))).toEqual([
			{ workerId: 0, ok: false },
			{ workerId: 1, ok: true },
		]);
		await expect(harness.manager.tellWorkers(() => null, {})).resolves.toEqual(['0:0', '1:2']);
	});

	test('rejects a second reload while one is running', async () => {
		const harness = hotReloadHarness();
		await harness.start();

		const running = harness.manager.hotReload({ drainTimeout: 10 });
		const second = harness.manager.hotReload();

		await expect(second).rejects.toSatisfy(error => SeyfertError.is(error, 'HOT_RELOAD_IN_PROGRESS'));
		await expect(running).resolves.toMatchObject({ workers: [{ ok: true }, { ok: true }] });
	});

	test.each([0, undefined])('answers the original instance after a swap with generation %s', async generation => {
		let releaseDrain!: () => void;
		const harness = hotReloadHarness({
			holdDrain: new Promise<void>(resolve => {
				releaseDrain = resolve;
			}),
		});
		await harness.start();
		let releaseCache!: () => void;
		const cacheHeld = new Promise<void>(resolve => {
			releaseCache = resolve;
		});
		harness.manager.cacheAdapter = {
			async get() {
				await cacheHeld;
				return 'cached';
			},
		} as never;

		// The active worker asks the cache, and the reload swaps it out before the answer is ready.
		const request = harness.manager.handleWorkerMessage(
			{ type: 'CACHE_REQUEST', workerId: 0, nonce: 'cache-request', method: 'get', args: ['key'] },
			generation,
		);
		const reload = harness.manager.hotReload({ workerIds: [0] });
		await vi.waitFor(() => expect(harness.log).toContain('drain 0:0'));
		releaseCache();
		await request;

		await vi.waitFor(() =>
			expect(harness.replies.get('0:0')?.find(body => body.type === 'CACHE_RESULT')).toMatchObject({
				nonce: 'cache-request',
				result: 'cached',
			}),
		);
		expect(harness.replies.get('0:1')?.some(body => body.type === 'CACHE_RESULT')).toBe(false);
		releaseDrain();
		await expect(reload).resolves.toMatchObject({ workers: [{ ok: true }] });
	});

	test('custom IPC delivery finishes activation while readiness handlers are still running', async () => {
		const harness = hotReloadHarness({ workers: 1 });
		await harness.start();
		let release!: () => void;
		const readiness = new Promise<void>(resolve => {
			release = resolve;
		});
		const client = new WorkerClient({
			postMessage: body => harness.manager.handleWorkerMessage(body as never, 1),
		});
		const runEvent = vi
			.spyOn(client.events, 'runEvent')
			.mockImplementation(name => (name === 'WORKER_SHARDS_CONNECTED' ? readiness : Promise.resolve()));
		let reload: ReturnType<WorkerManager['hotReload']> | undefined;
		try {
			client.setWorkerData({ ...gatewayWorkerData(), hotReload: true, generation: 1 });
			await (client as unknown as { onPacket(packet: object, shardId: number): Promise<unknown> }).onPacket(
				{
					t: 'READY',
					d: { user: { id: '1', username: 'bot' }, application: { id: '2', flags: 0 } },
				},
				0,
			);
			if (harness.manager.options.mode !== 'custom') throw new Error('Expected custom mode');
			const adapter = harness.manager.options.adapter;
			const postMessage = adapter.postMessage.bind(adapter);
			adapter.postMessage = (id, body, generation) =>
				(body as FakeMessage).type === 'HOT_RELOAD_ACTIVATE' && generation === 1
					? client.handleManagerMessages(body as never)
					: postMessage(id, body, generation);
			reload = harness.manager.hotReload({ drainTimeout: 10 });
			await vi.waitFor(() => expect(harness.log).toContain('terminate 0:0'));
			await expect(reload).resolves.toMatchObject({ workers: [{ ok: true }] });
		} finally {
			release();
			await reload;
			await new Promise(resolve => setImmediate(resolve));
			runEvent.mockRestore();
			client.setWorkerData(gatewayWorkerData());
		}
	});

	test('answers a requesting worker before it is told to drain', async () => {
		const harness = hotReloadHarness();
		await harness.start();

		harness.request(0, 'request-0', { drainTimeout: 10 });
		await vi.waitFor(() => expect(harness.log).toContain('terminate 1:0'));

		const log = harness.log.filter(line => !line.startsWith('bot'));
		expect(log.indexOf('result 0:0')).toBeGreaterThan(log.indexOf('activate 0:1'));
		expect(log.indexOf('result 0:0')).toBeLessThan(log.indexOf('drain 0:0'));
		const answer = harness.replies.get('0:0')?.find(body => body.type === 'HOT_RELOAD_RESULT');
		expect(answer?.result.workers).toEqual([{ workerId: 0, ok: true, ms: expect.any(Number) }]);
		expect(harness.replies.get('0:0')?.filter(body => body.type === 'HOT_RELOAD_RESULT')).toHaveLength(1);
		expect(harness.replies.get('0:0')?.some(body => body.type === 'HOT_RELOAD_PROGRESS')).toBe(true);
	});

	test('rejects unknown workers and custom adapters that cannot terminate', async () => {
		const harness = hotReloadHarness();
		await harness.start();
		await expect(harness.manager.hotReload({ workerIds: [5] })).rejects.toSatisfy(error =>
			SeyfertError.is(error, 'WORKER_NOT_FOUND'),
		);

		const adapter = harness.manager.options.mode === 'custom' ? harness.manager.options.adapter : undefined;
		delete adapter!.terminate;
		await expect(harness.manager.hotReload()).rejects.toSatisfy(error =>
			SeyfertError.is(error, 'HOT_RELOAD_UNSUPPORTED'),
		);
	});
});

describe('WorkerClient hot reload', () => {
	function workerClient(options: WorkerClientOptions = {}) {
		const posted: FakeMessage[] = [];
		const client = new WorkerClient({
			...options,
			postMessage: body => {
				posted.push(body as FakeMessage);
			},
		});
		const onPacket = (packet: object) =>
			(client as unknown as { onPacket(packet: object, shardId: number): Promise<unknown> }).onPacket(packet, 0);
		return { client, posted, onPacket };
	}
	const workerData = (hotReload: boolean) => ({
		...gatewayWorkerData(),
		hotReload,
	});

	test('a hook that never settles does not block the hooks after it', async () => {
		vi.useFakeTimers();
		const activated = vi.fn();
		const stopStarted = vi.fn();
		const { client } = workerClient({
			hotReload: {
				onStop: () => {
					stopStarted();
					return new Promise(() => {});
				},
				onActivate: activated,
			},
		});
		const logWarn = vi.spyOn(client.logger, 'warn').mockImplementation(() => {});
		try {
			client.setWorkerData(workerData(false));
			void client.handleManagerMessages({ type: 'HOT_RELOAD_STOP', nonce: 'stop' });
			await vi.waitFor(() => expect(stopStarted).toHaveBeenCalled());
			const resuming = client.handleManagerMessages({
				type: 'HOT_RELOAD_ACTIVATE',
				nonce: 'rollback',
				botReady: false,
			});
			await vi.advanceTimersByTimeAsync(9_999);
			expect(activated).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(1);
			await resuming;
			expect(activated).toHaveBeenCalledWith({ resumed: true });
			expect(logWarn).toHaveBeenCalledWith(
				'Hot reload onActivate hook is running while an earlier hook is still unfinished after 10000ms',
			);
		} finally {
			logWarn.mockRestore();
			vi.useRealTimers();
			client.setWorkerData(workerData(false));
		}
	});

	test('hooks run one at a time, and an activation that changes nothing reports nothing', async () => {
		const calls: string[] = [];
		let releaseStop!: () => void;
		const { client } = workerClient({
			hotReload: {
				onStop: async () => {
					calls.push('stop started');
					await new Promise<void>(resolve => {
						releaseStop = resolve;
					});
					calls.push('stop finished');
				},
				onActivate: ({ resumed }) => calls.push(`activate resumed=${resumed}`),
			},
		});
		try {
			client.setWorkerData(workerData(false));
			// A rollback after a cancelled session handoff finds this worker still active.
			await client.handleManagerMessages({ type: 'HOT_RELOAD_ACTIVATE', nonce: 'noop', botReady: false });
			expect(calls).toEqual([]);

			// The manager doesn't wait for hooks, so a rollback can arrive while onStop still runs.
			const stopping = client.handleManagerMessages({ type: 'HOT_RELOAD_STOP', nonce: 'stop' });
			await vi.waitFor(() => expect(calls).toEqual(['stop started']));
			const resuming = client.handleManagerMessages({
				type: 'HOT_RELOAD_ACTIVATE',
				nonce: 'rollback',
				botReady: false,
			});
			await new Promise(resolve => setImmediate(resolve));
			expect(calls).toEqual(['stop started']);

			releaseStop();
			await Promise.all([stopping, resuming]);
			expect(calls).toEqual(['stop started', 'stop finished', 'activate resumed=true']);
		} finally {
			releaseStop?.();
			client.setWorkerData(workerData(false));
		}
	});

	test('app hooks follow the hot reload lifecycle, and re-activation after a stop is reported as resumed', async () => {
		const calls: string[] = [];
		const end = vi.fn(() => calls.push('shard end'));
		const { client } = workerClient({
			hotReload: {
				onActivate: ({ resumed }) => calls.push(`activate resumed=${resumed} state=${client.hotReloadState}`),
				onStop: () => calls.push(`stop state=${client.hotReloadState}`),
				onDrain: ({ timeout }) => calls.push(`drain timeout=${timeout} state=${client.hotReloadState}`),
			},
		});
		const close = vi.spyOn(client, 'close').mockImplementation(async () => {
			calls.push('plugin teardown');
		});
		try {
			// A replacement starts on standby and says so.
			client.setWorkerData(workerData(true));
			expect(client.hotReloadState).toBe('standby');
			expect(client.isHotReloadReplacement).toBe(true);
			await client.handleManagerMessages({ type: 'HOT_RELOAD_ACTIVATE', nonce: 'activate', botReady: false });
			expect(client.hotReloadState).toBe('active');

			// Its turn to be replaced: stopped, then taken back because the next replacement failed, then retired.
			await client.handleManagerMessages({ type: 'HOT_RELOAD_STOP', nonce: 'stop' });
			await client.handleManagerMessages({ type: 'HOT_RELOAD_ACTIVATE', nonce: 'rollback', botReady: false });
			await client.handleManagerMessages({ type: 'HOT_RELOAD_STOP', nonce: 'stop-again' });
			client.shards.set(0, { end } as never);
			await client.handleManagerMessages({ type: 'HOT_RELOAD_DRAIN', nonce: 'drain', drainTimeout: 1_000 });

			expect(calls).toEqual([
				'activate resumed=false state=active',
				'stop state=stopped',
				'activate resumed=true state=active',
				'stop state=stopped',
				// The app saves its state before plugins are torn down and the shards end.
				'drain timeout=1000 state=stopped',
				'plugin teardown',
				'shard end',
			]);
		} finally {
			close.mockRestore();
			client.shards.clear();
			client.setWorkerData(workerData(false));
		}
	});

	test('keeps onDrain behind a pending stop ACK and skips it once the drain deadline expires', async () => {
		vi.useFakeTimers();
		let releaseStop!: () => void;
		let releaseAck!: () => void;
		const stopped = new Promise<void>(resolve => (releaseStop = resolve));
		const acknowledged = new Promise<void>(resolve => (releaseAck = resolve));
		const stop = vi.fn(() => stopped);
		const drain = vi.fn();
		const { client } = workerClient({ hotReload: { onStop: stop, onDrain: drain } });
		const close = vi.spyOn(client, 'close').mockResolvedValue(undefined);
		const send = vi.spyOn(client, 'postMessage').mockImplementation(async message => {
			if (message.type === 'HOT_RELOAD_ACK' && message.nonce === 'stop') {
				await acknowledged;
			}
		});
		const logWarn = vi.spyOn(client.logger, 'warn').mockImplementation(() => {});
		let stopping: Promise<void> | undefined;
		try {
			client.setWorkerData(workerData(false));
			stopping = client.handleManagerMessages({ type: 'HOT_RELOAD_STOP', nonce: 'stop' });
			await vi.advanceTimersByTimeAsync(0);
			expect(stop).not.toHaveBeenCalled();

			const draining = client.handleManagerMessages({ type: 'HOT_RELOAD_DRAIN', nonce: 'drain', drainTimeout: 30 });
			await vi.advanceTimersByTimeAsync(30);
			await draining;
			expect(close).toHaveBeenCalledOnce();
			expect(drain).not.toHaveBeenCalled();

			releaseAck();
			releaseStop();
			await stopping;
			expect(stop).toHaveBeenCalledOnce();
			await vi.advanceTimersByTimeAsync(10_000);
			expect(drain).not.toHaveBeenCalled();
		} finally {
			releaseAck();
			releaseStop();
			await stopping;
			send.mockRestore();
			close.mockRestore();
			logWarn.mockRestore();
			vi.useRealTimers();
			client.setWorkerData(workerData(false));
		}
	});

	test('onDrain is bounded by drainTimeout, and a failing hook does not break the reload', async () => {
		const end = vi.fn();
		const { client, posted } = workerClient({
			hotReload: {
				onStop: () => {
					throw new Error('app stop failed');
				},
				onDrain: () => new Promise(() => {}),
			},
		});
		const logError = vi.spyOn(client.logger, 'error').mockImplementation(() => {});
		const logWarn = vi.spyOn(client.logger, 'warn').mockImplementation(() => {});
		const close = vi.spyOn(client, 'close').mockResolvedValue(undefined);
		try {
			client.setWorkerData(workerData(false));
			client.shards.set(0, { end } as never);
			await client.handleManagerMessages({ type: 'HOT_RELOAD_STOP', nonce: 'stop' });
			expect(posted).toContainEqual({ type: 'HOT_RELOAD_ACK', nonce: 'stop', workerId: 0 });
			expect(logError).toHaveBeenCalledWith('Hot reload onStop hook failed', expect.any(Error));

			// The hook never settles, yet the drain finishes once its time is up.
			await client.handleManagerMessages({ type: 'HOT_RELOAD_DRAIN', nonce: 'drain', drainTimeout: 30 });
			expect(logWarn).toHaveBeenCalledWith('Hot reload onDrain hook did not finish within 30ms; continuing');
			expect(end).toHaveBeenCalledOnce();
			expect(posted.at(-1)).toEqual({ type: 'HOT_RELOAD_ACK', nonce: 'drain', workerId: 0 });
		} finally {
			logError.mockRestore();
			logWarn.mockRestore();
			close.mockRestore();
			client.shards.clear();
			client.setWorkerData(workerData(false));
		}
	});

	test('a replacement warms its cache with packets as dispatch interceptors left them', async () => {
		const plugin = createPlugin({
			name: 'rename-and-veto',
			register(api) {
				api.gateway.onDispatch(packet => {
					const d = packet.d as { id?: string; name?: string };
					if (d.id === 'vetoed') return null;
					return { ...packet, d: { ...d, name: `${d.name}:intercepted` } } as typeof packet;
				});
			},
		});
		const { client, onPacket } = workerClient({ plugins: [plugin] });
		try {
			client.setWorkerData(workerData(true));
			await onPacket({ t: 'GUILD_CREATE', d: { id: 'kept', name: 'kept', joined_at: '2026-01-01T00:00:00.000Z' } });
			await onPacket({ t: 'GUILD_CREATE', d: { id: 'vetoed', name: 'vetoed', joined_at: '2026-01-01T00:00:00.000Z' } });

			// The active path would have cached the rewritten guild and skipped the vetoed one.
			expect(await client.cache.guilds?.raw('kept')).toMatchObject({ name: 'kept:intercepted' });
			expect(await client.cache.guilds?.raw('vetoed')).toBeUndefined();
		} finally {
			client.setWorkerData(workerData(false));
		}
	});

	test('a replacement only builds its cache until it is activated, and a replaced worker ignores the gateway', async () => {
		const { client, posted, onPacket } = workerClient();
		// Handlers in the order they ran, as packet types and event names; every packet also fires RAW.
		const sequence: string[] = [];
		const execute = vi.spyOn(client.events, 'execute').mockImplementation(async packet => {
			sequence.push(packet.t);
		});
		const runEvent = vi.spyOn(client.events, 'runEvent').mockImplementation(async (name, _client, packet) => {
			sequence.push(name === 'RAW' ? `RAW ${(packet as { t: string }).t}` : name);
		});
		try {
			client.setWorkerData(workerData(true));
			await onPacket({ t: 'READY', d: { user: { id: '1', username: 'bot' }, application: { id: '2', flags: 0 } } });
			await onPacket({
				t: 'GUILD_CREATE',
				d: { id: 'guild-1', name: 'standby', joined_at: '2026-01-01T00:00:00.000Z' },
			});
			await onPacket({ t: 'GUILDS_READY', d: { guilds: ['guild-1'] } });
			expect(sequence).toEqual([]);
			expect(await client.cache.guilds?.raw('guild-1')).toMatchObject({ name: 'standby' });

			await client.handleManagerMessages({
				type: 'HOT_RELOAD_ACTIVATE',
				nonce: 'activate',
				botReady: true,
			});
			expect(posted).toContainEqual({ type: 'HOT_RELOAD_ACK', nonce: 'activate', workerId: 0 });
			// The readiness handlers it skipped on standby run once it takes over, in startup order.
			// They run alongside the gateway rather than holding it back, so wait for them to finish.
			await vi.waitFor(() =>
				// RAW listeners see each replayed packet first, as they would at startup.
				expect(sequence).toEqual([
					'WORKER_SHARDS_CONNECTED',
					'RAW READY',
					'READY',
					'WORKER_READY',
					'RAW GUILDS_READY',
					'GUILDS_READY',
					'BOT_READY',
				]),
			);
			await onPacket({ t: 'GUILD_UPDATE', d: { id: 'guild-1', name: 'active' } });
			expect(sequence.at(-1)).toBe('GUILD_UPDATE');

			await client.handleManagerMessages({ type: 'HOT_RELOAD_STOP', nonce: 'stop' });
			expect(posted).toContainEqual({ type: 'HOT_RELOAD_ACK', nonce: 'stop', workerId: 0 });
			const handled = sequence.length;
			await onPacket({ t: 'GUILD_UPDATE', d: { id: 'guild-1', name: 'stopped' } });
			expect(sequence).toHaveLength(handled);
			// Its own cache stays current in case it has to take events back.
			expect(await client.cache.guilds?.raw('guild-1')).toMatchObject({ name: 'stopped' });

			// Resuming after a failed switch hands events back without replaying ready handlers.
			await client.handleManagerMessages({
				type: 'HOT_RELOAD_ACTIVATE',
				nonce: 'resume',
				botReady: false,
			});
			await onPacket({ t: 'GUILD_UPDATE', d: { id: 'guild-1', name: 'resumed' } });
			expect(sequence.slice(handled)).toEqual(['RAW GUILD_UPDATE', 'GUILD_UPDATE']);
		} finally {
			execute.mockRestore();
			runEvent.mockRestore();
			client.setWorkerData(workerData(false));
		}
	});

	test('a cancelled session handoff cannot stop the original worker after rollback', async () => {
		const { client, posted, onPacket } = workerClient({
			handleManagerMessages(message) {
				if (message.type === 'HOT_RELOAD_ACTIVATE') throw new Error('Hook rejected rollback');
			},
		});
		const logError = vi.spyOn(client.logger, 'error').mockImplementation(() => {});
		let release!: () => void;
		const gate = new Promise<void>(resolve => {
			release = resolve;
		});
		const execute = vi.spyOn(client.events, 'execute').mockImplementationOnce(() => gate);
		execute.mockResolvedValue(undefined);
		const shard = {
			isReady: true,
			isOpen: true,
			data: { session_id: 'session-a', resume_seq: 42, resume_gateway_url: 'wss://resume.discord.gg' },
			close: vi.fn(),
			connectTransferredSession: vi.fn().mockResolvedValue(undefined),
		};
		try {
			client.setWorkerData(workerData(false));
			client.setServices({ cache: { adapter: new WorkerAdapter(client.workerData) } });
			client.shards.set(0, shard as never);
			const packet = { t: 'GUILD_UPDATE', d: { id: 'guild-1' } };
			const inFlight = onPacket(packet);
			await vi.waitFor(() => expect(execute).toHaveBeenCalledOnce());
			const stop = {
				type: 'HOT_RELOAD_STOP',
				nonce: 'stop',
				sessionHandoff: { generation: 1, drainTimeout: 1000 },
			} as const;
			const stopping = client.handleManagerMessages(stop);
			await vi.waitFor(() => expect(shard.close).toHaveBeenCalledOnce());
			await client.handleManagerMessages({
				type: 'HOT_RELOAD_ACTIVATE',
				nonce: 'rollback',
				botReady: false,
				cancelSessionHandoff: 1,
			});
			release();
			await Promise.all([inFlight, stopping]);
			await client.handleManagerMessages({ ...stop, nonce: 'late-stop' });
			await onPacket(packet);

			expect(logError).toHaveBeenCalledWith('Worker manager rollback observer failed', expect.any(Error));
			expect(shard.connectTransferredSession).toHaveBeenCalledOnce();
			expect(shard.close).toHaveBeenCalledOnce();
			expect(execute).toHaveBeenCalledTimes(2);
			expect(posted).toContainEqual(expect.objectContaining({ nonce: 'stop', error: expect.any(Object) }));
			expect(posted).toContainEqual(expect.objectContaining({ nonce: 'late-stop', error: expect.any(Object) }));
		} finally {
			release();
			logError.mockRestore();
			execute.mockRestore();
			client.shards.clear();
			client.setWorkerData(workerData(false));
		}
	});

	test.each(['ready', 'overflow'])('a resumed session waits for readiness before takeover (%s)', async outcome => {
		const { client, posted, onPacket } = workerClient();
		const sequence: string[] = [];
		let releaseReady!: () => void;
		const readyHeld = new Promise<void>(resolve => {
			releaseReady = resolve;
		});
		const runEvent = vi.spyOn(client.events, 'runEvent').mockImplementation(async name => {
			if (name === 'RAW') return;
			sequence.push(name);
			// A slow ready handler, like one that loads state the other handlers need.
			if (name === 'READY') await readyHeld;
		});
		let activating: Promise<void> | undefined;
		let failHandoff: ((error: Error) => void) | undefined;
		const shard = {
			isReady: true,
			isOpen: true,
			data: { session_id: 'standby', resume_seq: 1, resume_gateway_url: 'wss://resume.discord.gg' },
			options: {
				handlePayload: vi.fn((_shardId: number, packet: { t: string }) => {
					expect(posted).toContainEqual({ type: 'HOT_RELOAD_ACK', nonce: 'activate', workerId: 0 });
					sequence.push(`replayed ${packet.t}`);
				}),
			},
			end: vi.fn(),
			close: vi.fn((_code: number, reason: string) => failHandoff?.(new Error(reason))),
			commitTransferredSession: vi.fn(),
			// The transferred session replays a message, then confirms the resume.
			async connectTransferredSession(onFailure: (error: Error) => void) {
				failHandoff = onFailure;
				shard.options.handlePayload(0, { t: 'MESSAGE_CREATE' });
				shard.options.handlePayload(0, { t: 'RESUMED' });
			},
		};
		try {
			client.setWorkerData(workerData(true));
			client.setServices({ cache: { adapter: new WorkerAdapter(client.workerData) } });
			client.shards.set(0, shard as never);
			await onPacket({ t: 'READY', d: { user: { id: '1', username: 'bot' }, application: { id: '2', flags: 0 } } });
			await client.handleManagerMessages({
				type: 'HOT_RELOAD_RESUME',
				nonce: 'resume',
				session: { session_id: 'original', resume_seq: 7, resume_gateway_url: 'wss://resume.discord.gg' },
			});

			activating = client.handleManagerMessages({ type: 'HOT_RELOAD_ACTIVATE', nonce: 'activate', botReady: false });
			await vi.waitFor(() => expect(sequence).toContain('READY'));
			expect(posted).not.toContainEqual(expect.objectContaining({ nonce: 'activate' }));
			expect(shard.commitTransferredSession).not.toHaveBeenCalled();
			expect(sequence).toEqual(['WORKER_SHARDS_CONNECTED', 'READY']);

			if (outcome === 'overflow') {
				const packet = { t: 'MESSAGE_CREATE' };
				for (let received = 0; received < 100_000; received++) shard.options.handlePayload(0, packet);
				await activating;
				expect(posted.at(-1)).toMatchObject({
					type: 'HOT_RELOAD_ACK',
					nonce: 'activate',
					error: { message: 'Session handoff could not replay' },
				});
				expect(shard.commitTransferredSession).not.toHaveBeenCalled();
				expect(sequence).toEqual(['WORKER_SHARDS_CONNECTED', 'READY']);
			} else {
				releaseReady();
				await activating;
				expect(shard.commitTransferredSession).toHaveBeenCalledOnce();
				expect(posted.at(-1)).toEqual({ type: 'HOT_RELOAD_ACK', nonce: 'activate', workerId: 0 });
				expect(sequence).toEqual(['WORKER_SHARDS_CONNECTED', 'READY', 'replayed MESSAGE_CREATE', 'replayed RESUMED']);
			}
		} finally {
			releaseReady();
			await activating;
			runEvent.mockRestore();
			client.shards.clear();
			client.setServices({ cache: { adapter: new MemoryAdapter() } });
			client.setWorkerData(workerData(false));
		}
	});

	test('standby cache updates honor gateway interceptor rewrites and vetoes', async () => {
		const handled = vi.fn();
		const userHook = vi.fn();
		const { client } = workerClient({
			handlePayload: userHook,
			plugins: [
				{
					name: 'cache-transform',
					register(api) {
						api.gateway.onDispatch(packet => {
							if (packet.t !== 'GUILD_UPDATE') return packet;
							if (packet.d.name === 'veto') return null;
							return { ...packet, d: { ...packet.d, name: 'transformed' } };
						});
						api.events.onAny(handled);
					},
				},
			],
		});
		try {
			client.setWorkerData(workerData(true));
			const shard = client.createShard(0, { info: gatewayInfo(), compress: false });
			await shard.options.handlePayload(0, { t: 'GUILD_UPDATE', d: { id: 'guild-1', name: 'raw' } } as never);
			await shard.options.handlePayload(0, { t: 'GUILD_UPDATE', d: { id: 'guild-2', name: 'veto' } } as never);
			expect(await client.cache.guilds?.raw('guild-1')).toMatchObject({ name: 'transformed' });
			expect(await client.cache.guilds?.raw('guild-2')).toBeUndefined();
			expect(userHook).not.toHaveBeenCalled();
			expect(handled).not.toHaveBeenCalled();
		} finally {
			client.setWorkerData(workerData(false));
		}
	});

	test('a draining worker also waits for work that starts after the drain began', async () => {
		const { client } = workerClient();
		const track = (work: Promise<unknown>) =>
			(client as unknown as { trackInFlight(work: Promise<unknown>): void }).trackInFlight(work);
		let releaseFirst!: () => void;
		let releaseLate!: () => void;
		const end = vi.fn();
		try {
			client.setWorkerData(workerData(false));
			client.shards.set(0, { end } as never);
			track(
				new Promise<void>(resolve => {
					releaseFirst = resolve;
				}),
			);
			const draining = client.handleManagerMessages({ type: 'HOT_RELOAD_DRAIN', nonce: 'drain', drainTimeout: 60_000 });
			// Like RAW work registered once an async interceptor resolves.
			track(
				new Promise<void>(resolve => {
					releaseLate = resolve;
				}),
			);
			releaseFirst();
			await new Promise(resolve => setImmediate(resolve));
			expect(end).not.toHaveBeenCalled();

			releaseLate();
			await draining;
			expect(end).toHaveBeenCalledOnce();
		} finally {
			releaseFirst?.();
			releaseLate?.();
			client.shards.clear();
			client.setWorkerData(workerData(false));
		}
	});

	test('a replaced worker waits for RAW listeners still running before ending its sessions', async () => {
		const { client, onPacket } = workerClient();
		let release!: () => void;
		const execute = vi.spyOn(client.events, 'execute').mockResolvedValue(undefined);
		const runEvent = vi.spyOn(client.events, 'runEvent').mockImplementation(name =>
			name === 'RAW'
				? new Promise<void>(resolve => {
						release = resolve;
					})
				: Promise.resolve(),
		);
		const end = vi.fn();
		try {
			client.setWorkerData(workerData(false));
			client.shards.set(0, { end } as never);
			// The packet itself is done; only its RAW listener is still running.
			await onPacket({ t: 'GUILD_UPDATE', d: { id: 'guild-1', name: 'busy' } });

			await client.handleManagerMessages({ type: 'HOT_RELOAD_STOP', nonce: 'stop' });
			const draining = client.handleManagerMessages({ type: 'HOT_RELOAD_DRAIN', nonce: 'drain', drainTimeout: 60_000 });
			await new Promise(resolve => setImmediate(resolve));
			expect(end).not.toHaveBeenCalled();

			release();
			await draining;
			expect(end).toHaveBeenCalledOnce();
		} finally {
			release?.();
			execute.mockRestore();
			runEvent.mockRestore();
			client.shards.clear();
			client.setWorkerData(workerData(false));
		}
	});

	test('a replaced worker finishes in-flight work before ending its sessions', async () => {
		const { client, posted, onPacket } = workerClient();
		let release!: () => void;
		const execute = vi.spyOn(client.events, 'execute').mockReturnValue(
			new Promise<void>(resolve => {
				release = resolve;
			}),
		);
		const end = vi.fn();
		try {
			client.setWorkerData(workerData(false));
			client.shards.set(0, { end } as never);
			const inFlight = onPacket({ t: 'GUILD_UPDATE', d: { id: 'guild-1', name: 'busy' } });
			await vi.waitFor(() => expect(execute).toHaveBeenCalledOnce());

			await client.handleManagerMessages({ type: 'HOT_RELOAD_STOP', nonce: 'stop' });
			const draining = client.handleManagerMessages({ type: 'HOT_RELOAD_DRAIN', nonce: 'drain', drainTimeout: 60_000 });
			await new Promise(resolve => setImmediate(resolve));
			expect(end).not.toHaveBeenCalled();

			release();
			await Promise.all([inFlight, draining]);
			expect(end).toHaveBeenCalledOnce();
			expect(posted.at(-1)).toEqual({ type: 'HOT_RELOAD_ACK', nonce: 'drain', workerId: 0 });
		} finally {
			release();
			execute.mockRestore();
			client.shards.clear();
			client.setWorkerData(workerData(false));
		}
	});

	test.each([false, true])('drains the user hook before plugin teardown, teardown failure: %s', async failTeardown => {
		let release!: () => void;
		const order: string[] = [];
		const { client } = workerClient({
			getRC: async () => ({ token: 'header.payload.signature', locations: { base: '' } }),
			plugins: [
				{
					name: 'retirement',
					teardown() {
						order.push('teardown');
						if (failTeardown) throw new Error('teardown failed');
					},
				},
			],
			async handlePayload() {
				await new Promise<void>(resolve => {
					release = resolve;
				});
				order.push('handled');
			},
		});
		const execute = vi.spyOn(client.events, 'execute').mockResolvedValue(undefined);
		const end = vi.fn(() => {
			order.push('end');
		});
		const logged = vi.spyOn(client.logger, 'error').mockImplementation(() => undefined);
		try {
			client.setWorkerData(workerData(false));
			await BaseClient.prototype.start.call(client);
			const shard = client.createShard(0, { info: gatewayInfo(), compress: false, properties: {} as never });
			client.shards.set(0, { end } as never);
			const delivery = shard.options.handlePayload(0, { t: 'GUILD_UPDATE', d: { id: 'guild-1', name: 'x' } } as never);

			await client.handleManagerMessages({ type: 'HOT_RELOAD_STOP', nonce: 'stop' });
			const draining = client.handleManagerMessages({ type: 'HOT_RELOAD_DRAIN', nonce: 'drain', drainTimeout: 60_000 });
			await new Promise(resolve => setImmediate(resolve));
			expect(end).not.toHaveBeenCalled();

			release();
			await Promise.all([delivery, draining]);
			expect(end).toHaveBeenCalledOnce();
			expect(order).toEqual(['handled', 'teardown', 'end']);
			expect(logged).toHaveBeenCalledTimes(failTeardown ? 1 : 0);
		} finally {
			release?.();
			execute.mockRestore();
			logged.mockRestore();
			client.shards.clear();
			client.setWorkerData(workerData(false));
		}
	});

	test('requestHotReload reports progress and settles with the manager answer', async () => {
		const { client, posted } = workerClient();
		try {
			client.setWorkerData(workerData(false));
			const progress: string[] = [];
			const reload = client.requestHotReload({ workerIds: [0], onProgress: event => progress.push(event.stage) });
			const request = posted.find(body => body.type === 'HOT_RELOAD_REQUEST')!;
			expect(request).toMatchObject({ workerId: 0, options: { workerIds: [0] } });

			await client.handleManagerMessages({
				type: 'HOT_RELOAD_PROGRESS',
				nonce: request.nonce,
				progress: { workerId: 0, stage: 'spawning' },
			});
			const result = { workers: [{ workerId: 0, ok: true, ms: 5 }] };
			await client.handleManagerMessages({ type: 'HOT_RELOAD_RESULT', nonce: request.nonce, result });
			await expect(reload).resolves.toEqual(result);
			expect(progress).toEqual(['spawning']);

			const rejected = client.requestHotReload();
			const second = posted.filter(body => body.type === 'HOT_RELOAD_REQUEST').at(-1)!;
			await client.handleManagerMessages({
				type: 'HOT_RELOAD_RESULT',
				nonce: second.nonce,
				error: serializeWorkerError(new SeyfertError('HOT_RELOAD_IN_PROGRESS')),
			});
			await expect(rejected).rejects.toSatisfy(error => SeyfertError.is(error, 'HOT_RELOAD_IN_PROGRESS'));
		} finally {
			client.setWorkerData(workerData(false));
		}
	});
});

function gatewayWorkerData() {
	return {
		intents: 0,
		token: 'token',
		path: '',
		shards: [0],
		totalShards: 1,
		totalWorkers: 1,
		mode: 'custom' as const,
		workerId: 0,
		debug: false,
		workerProxy: false,
		info: gatewayInfo(),
		compress: false,
		resharding: false,
	};
}

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
