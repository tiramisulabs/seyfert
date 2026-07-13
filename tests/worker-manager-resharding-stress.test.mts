import { fork } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, test, vi } from 'vitest';
import { WorkerClient } from '../src/client';
import { GatewayIntentBits, type RESTGetAPIGatewayBotResult } from '../src/types';
import { WorkerManager } from '../src/websocket';
import type { CustomManagerWorkerResource, WorkerData } from '../src/websocket/discord/shared';

function gatewayInfo(shards: number): RESTGetAPIGatewayBotResult {
	return {
		url: 'wss://gateway.discord.gg',
		shards,
		session_start_limit: {
			total: 1_000,
			remaining: 1_000,
			reset_after: 0,
			max_concurrency: 2,
		},
	};
}

function createHarness(
	recommendations: readonly number[],
	heartbeaterInterval = 0,
	spawnWorker?: (worker: WorkerData) => CustomManagerWorkerResource | Promise<CustomManagerWorkerResource>,
) {
	const outbound: { workerId: number; message: { type: string; totalShards?: number; reshardId?: string } }[] = [];
	const spawned: { workerId: number; shards: number[]; totalShards: number; resharding: boolean }[] = [];
	const spawnEnvironments: Record<string, string>[] = [];
	let recommendation = 0;
	const manager = new WorkerManager({
		mode: 'custom',
		adapter: {
			postMessage(workerId, message) {
				outbound.push({ workerId, message: message as never });
			},
			async spawn(worker, environment) {
				const resource = (await spawnWorker?.(worker)) ?? { terminate() {} };
				spawnEnvironments.push(environment as Record<string, string>);
				spawned.push({
					workerId: worker.workerId,
					shards: [...worker.shards],
					totalShards: worker.totalShards,
					resharding: worker.resharding,
				});
				return resource;
			},
		},
		getRC: async () => ({
			debug: false,
			intents: GatewayIntentBits.Guilds,
			locations: { base: '' },
			token: 'stress-token',
		}),
		info: gatewayInfo(2),
		totalShards: 2,
		shardEnd: 2,
		shardsPerWorker: 1,
		workers: 2,
		heartbeaterInterval,
		resharding: {
			interval: 0,
			percentage: 1,
			getInfo: async () => gatewayInfo(recommendations[recommendation++]!),
		},
	});
	return { manager, outbound, spawned, spawnEnvironments };
}

async function beginReshard(manager: WorkerManager) {
	await (manager as unknown as { checkForResharding(): Promise<void> }).checkForResharding();
	return (manager as unknown as { reshardId?: string }).reshardId!;
}

function incarnationId(manager: WorkerManager, workerId: number) {
	return (manager.get(workerId) as { incarnationId?: string } | undefined)?.incarnationId!;
}

type AbortingManagerState = {
	reshardingState: 'aborting';
	reshardId?: string;
	reshardingParticipants: Map<number, string>;
	reshardingAbortAcks: Set<number>;
	reshardingCreatedWorkers: Map<number, string>;
	reshardingTerminationTasks: Map<number, { incarnationId: string; task: Promise<void> }>;
	spawnPromises: Map<number, Promise<void>>;
};

async function createAbortingTerminationHarness(terminate: () => Promise<void>) {
	const { manager } = createHarness([4], 1_000_000, worker => ({
		terminate: worker.workerId === 2 ? terminate : () => {},
	}));
	const preexisting0 = { incarnationId: 'initial-0' };
	const preexisting1 = { incarnationId: 'initial-1' };
	manager.set(0, preexisting0);
	manager.set(1, preexisting1);
	const worker2 = manager.createWorker({
		intents: 0,
		token: 'stress-token',
		path: 'worker.js',
		shards: [2],
		totalShards: 4,
		totalWorkers: 4,
		mode: 'custom',
		workerId: 2,
		debug: false,
		workerProxy: false,
		info: gatewayInfo(4),
		compress: false,
		resharding: true,
		reshardId: 'attempt-a',
		incarnationId: 'candidate-2',
	});
	const state = manager as unknown as AbortingManagerState;
	const spawn = state.spawnPromises.get(2);
	expect(spawn).toBeDefined();
	await spawn;
	manager.heartbeater.register(2, async () => {});
	state.reshardingState = 'aborting';
	state.reshardId = 'attempt-a';
	state.reshardingParticipants.set(0, preexisting0.incarnationId);
	state.reshardingParticipants.set(1, preexisting1.incarnationId);
	state.reshardingParticipants.set(2, 'candidate-2');
	state.reshardingCreatedWorkers.set(2, 'candidate-2');
	return { manager, preexisting0, preexisting1, state, worker2 };
}

async function readyEveryWorker(manager: WorkerManager, count: number, reshardId: string) {
	for (let workerId = 0; workerId < count; workerId++) {
		await manager.handleWorkerMessage({
			type: 'WORKER_READY_RESHARDING',
			workerId,
			incarnationId: incarnationId(manager, workerId),
			reshardId,
		});
	}
}

async function disconnectEveryWorker(manager: WorkerManager, count: number, reshardId: string) {
	for (let workerId = 0; workerId < count; workerId++) {
		await manager.handleWorkerMessage({
			type: 'DISCONNECTED_ALL_SHARDS_RESHARDING',
			workerId,
			incarnationId: incarnationId(manager, workerId),
			reshardId,
		});
	}
	for (let workerId = 0; workerId < count; workerId++) {
		await manager.handleWorkerMessage({
			type: 'WORKER_CUTOVER_APPLIED_RESHARDING',
			workerId,
			incarnationId: incarnationId(manager, workerId),
			reshardId,
		});
	}
}

function seeded(seed: number) {
	let value = seed | 0;
	return () => {
		value = (value + 0x6d2b79f5) | 0;
		let mixed = Math.imul(value ^ (value >>> 15), 1 | value);
		mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed);
		return ((mixed ^ (mixed >>> 14)) >>> 0) / 0x1_0000_0000;
	};
}

function shuffle(values: number[], random: () => number) {
	for (let index = values.length - 1; index > 0; index--) {
		const target = Math.floor(random() * (index + 1));
		[values[index], values[target]] = [values[target]!, values[index]!];
	}
	return values;
}

async function staleNoise(manager: WorkerManager, reshardId: string, random: () => number) {
	const count = 1 + Math.floor(random() * 8);
	for (let index = 0; index < count; index++) {
		const workerId = Math.floor(random() * 4);
		if (random() < 0.5) {
			await manager.handleWorkerMessage({
				type: 'WORKER_READY_RESHARDING',
				workerId,
				incarnationId: incarnationId(manager, workerId),
				reshardId,
			});
		} else {
			await manager.handleWorkerMessage({
				type: 'DISCONNECTED_ALL_SHARDS_RESHARDING',
				workerId,
				incarnationId: incarnationId(manager, workerId),
				reshardId,
			});
		}
	}
}

describe('WorkerManager legacy reshard protocol stress', () => {
	test('stamps manager commands and rejects stale or missing targets before custom hooks', async () => {
		const { manager, outbound } = createHarness([4]);
		manager.set(0, { incarnationId: 'current' });
		manager.postMessage(0, { type: 'HEARTBEAT' });
		expect(outbound).toEqual([
			{ workerId: 0, message: { type: 'HEARTBEAT', incarnationId: 'current' } },
		]);

		const posted: unknown[] = [];
		const handleManagerMessages = vi.fn();
		const client = new WorkerClient({
			handleManagerMessages,
			postMessage(message) {
				posted.push(message);
			},
		});
		client.setWorkerData({
			intents: 0,
			token: 'stress-token',
			path: 'worker.js',
			shards: [0],
			totalShards: 1,
			totalWorkers: 1,
			mode: 'custom',
			workerId: 0,
			debug: false,
			workerProxy: false,
			info: gatewayInfo(1),
			compress: false,
			resharding: false,
			incarnationId: 'current',
		});
		await client.handleManagerMessages({ type: 'HEARTBEAT', incarnationId: 'stale' });
		await client.handleManagerMessages({ type: 'HEARTBEAT' } as never);
		await client.handleManagerMessages({ type: 'HEARTBEAT', incarnationId: undefined } as never);
		expect(handleManagerMessages).not.toHaveBeenCalled();
		expect(posted).toHaveLength(0);

		await client.handleManagerMessages({ type: 'HEARTBEAT', incarnationId: 'current' });
		expect(handleManagerMessages).toHaveBeenCalledOnce();
		expect(posted).toEqual([{ type: 'ACK_HEARTBEAT', workerId: 0, incarnationId: 'current' }]);
	});

	test('rejects stale and missing incarnation on worker data-plane traffic', async () => {
		const { manager } = createHarness([4]);
		manager.set(0, { incarnationId: 'current' });
		const handleWorkerMessage = vi.fn();
		manager.options.handleWorkerMessage = handleWorkerMessage;
		let received = 0;
		manager.options.handlePayload = () => received++;
		const message = {
			type: 'RECEIVE_PAYLOAD' as const,
			workerId: 0,
			shardId: 0,
			payload: { op: 0, s: 1, t: 'TEST', d: {} } as never,
		};
		await manager.handleWorkerMessage({ ...message, incarnationId: 'stale' });
		await manager.handleWorkerMessage(message as never);
		expect(received).toBe(0);
		expect(handleWorkerMessage).not.toHaveBeenCalled();
		await manager.handleWorkerMessage({ ...message, incarnationId: 'current' });
		expect(received).toBe(1);
		expect(handleWorkerMessage).toHaveBeenCalledOnce();
		expect(handleWorkerMessage).toHaveBeenCalledWith({ ...message, incarnationId: 'current' });
	});

	test('assigns one incarnation when direct createWorker callers omit it', async () => {
		const { manager, spawnEnvironments } = createHarness([4]);
		const data: WorkerData = {
			intents: 0,
			token: 'stress-token',
			path: 'worker.js',
			shards: [0],
			totalShards: 1,
			totalWorkers: 1,
			mode: 'custom',
			workerId: 0,
			debug: false,
			workerProxy: false,
			info: gatewayInfo(1),
			compress: false,
			resharding: false,
		};
		manager.createWorker(data);
		expect(data.incarnationId).toEqual(expect.any(String));
		expect((manager.get(0) as { incarnationId?: string }).incarnationId).toBe(data.incarnationId);
		await Promise.resolve();
		await Promise.resolve();
		expect(spawnEnvironments).toHaveLength(1);
		expect(spawnEnvironments[0]!.SEYFERT_WORKER_INCARNATIONID).toBe(data.incarnationId);
		const child = fork(join(process.cwd(), 'tests/worker-incarnation-bootstrap.cjs'), [], {
			env: { ...process.env, ...spawnEnvironments[0] },
			silent: true,
		});
		const bootstrapMessage = await new Promise<Record<string, unknown>>((resolve, reject) => {
			child.once('message', message => resolve(message as Record<string, unknown>));
			child.once('error', reject);
			child.once('exit', code => {
				if (code && code !== 0) reject(new Error(`Bootstrap child exited with ${code}`));
			});
		});
		child.kill();
		expect(bootstrapMessage).toMatchObject({
			type: 'ACK_HEARTBEAT',
			workerId: 0,
			incarnationId: data.incarnationId,
		});
		let received = 0;
		manager.options.handlePayload = () => received++;
		await manager.handleWorkerMessage({
			type: 'RECEIVE_PAYLOAD',
			workerId: 0,
			incarnationId: data.incarnationId!,
			shardId: 0,
			payload: { op: 0, s: 1, t: 'TEST', d: {} } as never,
		});
		expect(received).toBe(1);
	});

	test('delayed disconnect evidence from attempt A cannot commit attempt B', async () => {
		const { manager, outbound } = createHarness([4, 6]);
		await manager.resolveShardTopology();
		manager.set(0, { incarnationId: 'initial-0' });
		manager.set(1, { incarnationId: 'initial-1' });

		const attemptA = await beginReshard(manager);
		await readyEveryWorker(manager, 4, attemptA);
		await disconnectEveryWorker(manager, 4, attemptA);
		expect(manager.totalShards).toBe(4);

		outbound.length = 0;
		const attemptB = await beginReshard(manager);
		expect(attemptB).not.toBe(attemptA);
		await disconnectEveryWorker(manager, 4, attemptA);

		expect(manager.totalShards).toBe(4);
		expect(outbound.filter(({ message }) => message.type === 'CONNECT_ALL_SHARDS_RESHARDING')).toEqual([]);

		await readyEveryWorker(manager, 6, attemptB);
		await disconnectEveryWorker(manager, 6, attemptB);
		expect(manager.totalShards).toBe(6);
	});

	test('delayed readiness from attempt A cannot advance attempt B', async () => {
		const { manager, outbound } = createHarness([4, 6]);
		await manager.resolveShardTopology();
		manager.set(0, { incarnationId: 'initial-0' });
		manager.set(1, { incarnationId: 'initial-1' });
		const attemptA = await beginReshard(manager);
		await readyEveryWorker(manager, 4, attemptA);
		await disconnectEveryWorker(manager, 4, attemptA);

		outbound.length = 0;
		const attemptB = await beginReshard(manager);
		await readyEveryWorker(manager, 4, attemptA);
		expect(outbound.filter(({ message }) => message.type === 'DISCONNECT_ALL_SHARDS_RESHARDING')).toEqual([]);

		await readyEveryWorker(manager, 6, attemptB);
		expect(outbound.filter(({ message }) => message.type === 'DISCONNECT_ALL_SHARDS_RESHARDING')).toHaveLength(6);
	});

	test('spawn failure retries transient cleanup after one ACK and terminates only new workers', async () => {
		vi.useFakeTimers();
		const failure = new Error('worker-3 spawn failed');
		const transientTerminationFailure = new Error('worker-2 termination failed once');
		let worker2Alive = true;
		let terminationAttempts = 0;
		const terminateWorker2 = vi.fn(async () => {
			if (terminationAttempts++ === 0) throw transientTerminationFailure;
			worker2Alive = false;
		});
		const { manager, outbound } = createHarness([4], 1_000_000, worker => {
			if (worker.workerId === 2) return { terminate: terminateWorker2 };
			if (worker.workerId === 3) throw failure;
			return { terminate() {} };
		});
		const posted: Record<string, any>[] = [];
		const client = new WorkerClient({
			postMessage(message) {
				posted.push(message as Record<string, any>);
			},
		});
		const connect = vi.fn();
		try {
			await manager.resolveShardTopology();
			manager.set(0, { incarnationId: 'initial-0' });
			manager.set(1, { incarnationId: 'initial-1' });
			client.setWorkerData({
				intents: 0,
				token: 'stress-token',
				path: 'worker.js',
				shards: [0],
				totalShards: 2,
				totalWorkers: 2,
				mode: 'custom',
				workerId: 0,
				debug: false,
				workerProxy: false,
				info: gatewayInfo(2),
				compress: false,
				resharding: false,
				incarnationId: 'initial-0',
			});
			const getInfo = vi.spyOn(manager.options.resharding, 'getInfo');
			const attempt = await beginReshard(manager);
			const alreadyExists = outbound.find(
				({ workerId, message }) => workerId === 0 && message.type === 'WORKER_ALREADY_EXISTS_RESHARDING',
			)!;
			await client.handleManagerMessages(alreadyExists.message as never);
			await manager.handleWorkerMessage(posted.find(message => message.type === 'WORKER_START_RESHARDING') as never);
			const spawnShards = outbound.find(
				({ workerId, message }) => workerId === 0 && message.type === 'SPAWN_SHARDS_RESHARDING',
			)!;
			await client.handleManagerMessages(spawnShards.message as never);
			const staged = client.resharding.get(0)!;
			staged.options.reconnectTimeout = 100;
			vi.spyOn(staged, 'connect').mockImplementation(connect);
			const reconnecting = staged.reconnect();

			await manager.handleWorkerMessage({
				type: 'WORKER_READY_RESHARDING',
				workerId: 0,
				incarnationId: 'initial-0',
				reshardId: attempt,
			});
			await manager.handleWorkerMessage({
				type: 'WORKER_START_RESHARDING',
				workerId: 1,
				incarnationId: 'initial-1',
				reshardId: attempt,
			});
			await manager.handleWorkerMessage({
				type: 'WORKER_READY_RESHARDING',
				workerId: 1,
				incarnationId: 'initial-1',
				reshardId: attempt,
			});
			const worker2Incarnation = incarnationId(manager, 2);
			await manager.handleWorkerMessage({
				type: 'WORKER_START_RESHARDING',
				workerId: 2,
				incarnationId: worker2Incarnation,
				reshardId: attempt,
			});
			await expect(
				manager.handleWorkerMessage({
					type: 'WORKER_READY_RESHARDING',
					workerId: 2,
					incarnationId: worker2Incarnation,
					reshardId: attempt,
				}),
			).rejects.toBe(failure);

			const failedState = manager as unknown as {
				_info?: unknown;
				checkForResharding(): Promise<void>;
				reshardId?: string;
				reshardingState: string;
			};
			expect(failedState.reshardingState).toBe('aborting');
			expect(failedState.reshardId).toBe(attempt);
			expect(failedState._info).toBeDefined();
			expect(
				outbound.some(
					({ workerId, message }) => workerId === 2 && message.type === 'ABORT_RESHARDING',
				),
			).toBe(true);
			expect(manager.has(2)).toBe(true);
			expect(worker2Alive).toBe(true);
			expect(terminateWorker2).not.toHaveBeenCalled();
			const abort = [...outbound]
				.reverse()
				.find(({ workerId, message }) => workerId === 0 && message.type === 'ABORT_RESHARDING')!;
			await client.handleManagerMessages(abort.message as never);
			expect(client.resharding.size).toBe(0);
			const ack = posted.find(message => message.type === 'WORKER_RESHARD_ABORTED')!;
			await manager.handleWorkerMessage(ack as never);
			expect(failedState.reshardingState).toBe('aborting');
			expect(failedState.reshardId).toBe(attempt);

			await manager.handleWorkerMessage({
				type: 'WORKER_RESHARD_ABORTED',
				workerId: 1,
				incarnationId: 'initial-1',
				reshardId: attempt,
			});
			expect(failedState.reshardingState).toBe('aborting');
			expect(manager.has(0)).toBe(true);
			expect(manager.has(1)).toBe(true);
			expect(manager.has(2)).toBe(true);
			expect(terminateWorker2).not.toHaveBeenCalled();

			await manager.handleWorkerMessage({
				type: 'WORKER_RESHARD_ABORTED',
				workerId: 2,
				incarnationId: worker2Incarnation,
				reshardId: attempt,
			});
			expect(failedState.reshardingState).toBe('failed');
			expect(failedState.reshardId).toBeUndefined();
			expect(failedState._info).toBeUndefined();
			expect(terminateWorker2).toHaveBeenCalledTimes(2);
			expect(worker2Alive).toBe(false);
			expect(manager.has(0)).toBe(true);
			expect(manager.has(1)).toBe(true);
			expect(manager.has(2)).toBe(false);
			expect(manager.heartbeater.store.has(2)).toBe(false);
			await vi.advanceTimersByTimeAsync(100);
			await reconnecting;
			expect(connect).not.toHaveBeenCalled();

			const getInfoCalls = getInfo.mock.calls.length;
			const spawnCount = outbound.filter(({ message }) => message.type === 'SPAWN_SHARDS_RESHARDING').length;
			await failedState.checkForResharding();
			await manager.handleWorkerMessage({
				type: 'WORKER_START_RESHARDING',
				workerId: 0,
				incarnationId: 'initial-0',
				reshardId: 'attempt-b',
			});
			expect(getInfo).toHaveBeenCalledTimes(getInfoCalls);
			expect(outbound.filter(({ message }) => message.type === 'SPAWN_SHARDS_RESHARDING')).toHaveLength(spawnCount);
		} finally {
			vi.useRealTimers();
			vi.restoreAllMocks();
			for (const workerId of [...manager.heartbeater.store.keys()]) manager.heartbeater.unregister(workerId);
		}
	});

	test('concurrent duplicate abort ACKs share one exact termination task', async () => {
		let releaseTermination!: () => void;
		const termination = new Promise<void>(resolve => {
			releaseTermination = resolve;
		});
		const terminate = vi.fn(() => termination);
		const { manager, preexisting0, preexisting1, state } = await createAbortingTerminationHarness(terminate);
		const ack = {
			type: 'WORKER_RESHARD_ABORTED' as const,
			workerId: 2,
			incarnationId: 'candidate-2',
			reshardId: 'attempt-a',
		};
		try {
			const first = manager.handleWorkerMessage(ack);
			const duplicate = manager.handleWorkerMessage({ ...ack });
			await Promise.resolve();
			await Promise.resolve();

			expect(terminate).toHaveBeenCalledOnce();
			expect(state.reshardingTerminationTasks.size).toBe(1);
			const exactTask = state.reshardingTerminationTasks.get(2);
			expect(exactTask?.incarnationId).toBe('candidate-2');
			expect(exactTask?.task).toBeInstanceOf(Promise);

			releaseTermination();
			await Promise.all([first, duplicate]);

			expect(terminate).toHaveBeenCalledOnce();
			expect(state.reshardingTerminationTasks.get(2)).toBe(exactTask);
			expect(state.reshardingAbortAcks).toEqual(new Set([2]));
			expect(manager.has(2)).toBe(false);
			expect(manager.heartbeater.store.has(2)).toBe(false);
			expect(manager.get(0)).toBe(preexisting0);
			expect(manager.get(1)).toBe(preexisting1);
			expect(state.reshardingState).toBe('aborting');
		} finally {
			for (const workerId of [...manager.heartbeater.store.keys()]) manager.heartbeater.unregister(workerId);
		}
	});

	test('exhausted abort cleanup preserves the exact candidate and terminal evidence', async () => {
		const terminationFailure = new Error('candidate termination unavailable');
		const terminate = vi.fn(async () => {
			throw terminationFailure;
		});
		const { manager, preexisting0, preexisting1, state, worker2 } =
			await createAbortingTerminationHarness(terminate);
		const ack = {
			type: 'WORKER_RESHARD_ABORTED' as const,
			workerId: 2,
			incarnationId: 'candidate-2',
			reshardId: 'attempt-a',
		};
		try {
			await expect(manager.handleWorkerMessage(ack)).rejects.toThrow('Could not terminate resharding worker 2');
			const failedTask = state.reshardingTerminationTasks.get(2);

			expect(terminate).toHaveBeenCalledTimes(3);
			expect(failedTask).toBeDefined();
			expect(state.reshardingState).toBe('aborting');
			expect(state.reshardId).toBe('attempt-a');
			expect(state.reshardingAbortAcks).toEqual(new Set([2]));
			expect(state.reshardingCreatedWorkers.get(2)).toBe('candidate-2');
			expect(failedTask?.incarnationId).toBe('candidate-2');
			expect(manager.get(2)).toBe(worker2);
			expect(incarnationId(manager, 2)).toBe('candidate-2');
			expect(manager.heartbeater.store.has(2)).toBe(true);
			expect(manager.get(0)).toBe(preexisting0);
			expect(manager.get(1)).toBe(preexisting1);

			await expect(manager.handleWorkerMessage({ ...ack })).rejects.toThrow(
				'Could not terminate resharding worker 2',
			);
			expect(terminate).toHaveBeenCalledTimes(3);
			expect(state.reshardingTerminationTasks.get(2)).toBe(failedTask);
		} finally {
			for (const workerId of [...manager.heartbeater.store.keys()]) manager.heartbeater.unregister(workerId);
		}
	});

	test('a worker death after reshard recreates the current ordinary topology', async () => {
		const { manager, spawned } = createHarness([4], 1_000_000);
		try {
			await manager.resolveShardTopology();
			manager.set(0, { incarnationId: 'initial-0' });
			manager.set(1, { incarnationId: 'initial-1' });
			const attempt = await beginReshard(manager);
			await readyEveryWorker(manager, 4, attempt);
			await disconnectEveryWorker(manager, 4, attempt);
			expect(manager.totalShards).toBe(4);

			spawned.length = 0;
			const timer = manager.heartbeater.store.get(0)!.interval as unknown as { _onTimeout(): void | Promise<void> };
			timer._onTimeout();
			await timer._onTimeout();

			expect(spawned).toContainEqual({
				workerId: 0,
				shards: [0],
				totalShards: 4,
				resharding: false,
			});
		} finally {
			for (const workerId of [...manager.heartbeater.store.keys()]) manager.heartbeater.unregister(workerId);
		}
	});

	test('a worker replacement can rejoin reshard barriers after peers applied cutover', async () => {
		const { manager, outbound } = createHarness([4], 1_000_000);
		try {
			await manager.resolveShardTopology();
			manager.set(0, { incarnationId: 'initial-0' });
			manager.set(1, { incarnationId: 'initial-1' });
			const attempt = await beginReshard(manager);
			await readyEveryWorker(manager, 4, attempt);
			for (let workerId = 0; workerId < 4; workerId++) {
				await manager.handleWorkerMessage({
					type: 'DISCONNECTED_ALL_SHARDS_RESHARDING',
					workerId,
					incarnationId: incarnationId(manager, workerId),
					reshardId: attempt,
				});
			}
			for (let workerId = 1; workerId < 4; workerId++) {
				await manager.handleWorkerMessage({
					type: 'WORKER_CUTOVER_APPLIED_RESHARDING',
					workerId,
					incarnationId: incarnationId(manager, workerId),
					reshardId: attempt,
				});
			}

			const timer = manager.heartbeater.store.get(0)!.interval as unknown as { _onTimeout(): void | Promise<void> };
			timer._onTimeout();
			await timer._onTimeout();
			outbound.length = 0;
			await manager.handleWorkerMessage({
				type: 'WORKER_READY_RESHARDING',
				workerId: 0,
				incarnationId: incarnationId(manager, 0),
				reshardId: attempt,
			});
			expect(outbound.filter(({ message }) => message.type === 'DISCONNECT_ALL_SHARDS_RESHARDING')).toHaveLength(4);

			await manager.handleWorkerMessage({
				type: 'DISCONNECTED_ALL_SHARDS_RESHARDING',
				workerId: 0,
				incarnationId: incarnationId(manager, 0),
				reshardId: attempt,
			});
			await manager.handleWorkerMessage({
				type: 'WORKER_CUTOVER_APPLIED_RESHARDING',
				workerId: 0,
				incarnationId: incarnationId(manager, 0),
				reshardId: attempt,
			});
			expect((manager as unknown as { reshardingState: string }).reshardingState).toBe('idle');
		} finally {
			for (const workerId of [...manager.heartbeater.store.keys()]) manager.heartbeater.unregister(workerId);
		}
	});

	test('a repeated shard-staging command remains capable of completing after an interrupted attempt', async () => {
		const posted: { type: string; shardId?: number }[] = [];
		const client = new WorkerClient({
			postMessage(message) {
				posted.push(message as never);
			},
		});
		const data: WorkerData = {
			intents: 0,
			token: 'stress-token',
			path: 'worker.js',
			shards: [0],
			totalShards: 2,
			totalWorkers: 2,
			mode: 'custom',
			workerId: 0,
			debug: false,
			workerProxy: false,
			info: gatewayInfo(2),
			compress: false,
			resharding: false,
			incarnationId: 'reshard-client',
		};
		client.setWorkerData(data);
		const stage = (reshardId: string) => ({
			type: 'SPAWN_SHARDS_RESHARDING' as const,
			info: gatewayInfo(4),
			compress: false,
			properties: {} as never,
			reshardId,
			incarnationId: data.incarnationId!,
		});

		await client.handleManagerMessages({
			type: 'WORKER_ALREADY_EXISTS_RESHARDING',
			incarnationId: data.incarnationId!,
			reshardId: 'attempt-a',
		});
		posted.length = 0;
		await client.handleManagerMessages(stage('attempt-a'));
		expect(posted.filter(message => message.type === 'CONNECT_QUEUE_RESHARDING')).toHaveLength(1);
		posted.length = 0;

		await client.handleManagerMessages(stage('attempt-a'));
		const staged = client.resharding.get(0)!;
		await staged.options.handlePayload(0, { op: 0, s: 1, t: 'GUILDS_READY', d: null } as never);
		expect(posted.filter(message => message.type === 'WORKER_READY_RESHARDING')).toHaveLength(1);
	});

	test('128 seeded duplicate and reordered stale schedules cannot cross the attempt boundary', async () => {
		for (let seed = 0; seed < 128; seed++) {
			const random = seeded(seed);
			const { manager, outbound } = createHarness([4, 6]);
			await manager.resolveShardTopology();
			manager.set(0, { incarnationId: 'initial-0' });
			manager.set(1, { incarnationId: 'initial-1' });
			const attemptA = await beginReshard(manager);
			await readyEveryWorker(manager, 4, attemptA);
			await disconnectEveryWorker(manager, 4, attemptA);
			outbound.length = 0;
			const attemptB = await beginReshard(manager);

			for (let workerId = 0; workerId < 6; workerId++) {
				await staleNoise(manager, attemptA, random);
				await manager.handleWorkerMessage({
					type: 'WORKER_READY_RESHARDING',
					workerId,
					incarnationId: incarnationId(manager, workerId),
					reshardId: attemptB,
				});
				if (random() < 0.75) {
					await manager.handleWorkerMessage({
						type: 'WORKER_READY_RESHARDING',
						workerId,
						incarnationId: incarnationId(manager, workerId),
						reshardId: attemptB,
					});
				}
				if (workerId < 5) {
					expect(
						outbound.filter(({ message }) => message.type === 'DISCONNECT_ALL_SHARDS_RESHARDING'),
						`seed ${seed} disconnected before every current worker was ready`,
					).toEqual([]);
				}
			}

			const order = shuffle([0, 1, 2, 3, 4, 5], random);
			for (let index = 0; index < order.length; index++) {
				await staleNoise(manager, attemptA, random);
				const workerId = order[index]!;
				await manager.handleWorkerMessage({
					type: 'DISCONNECTED_ALL_SHARDS_RESHARDING',
					workerId,
					incarnationId: incarnationId(manager, workerId),
					reshardId: attemptB,
				});
				if (random() < 0.75) {
					await manager.handleWorkerMessage({
						type: 'DISCONNECTED_ALL_SHARDS_RESHARDING',
						workerId,
						incarnationId: incarnationId(manager, workerId),
						reshardId: attemptB,
					});
				}
				if (index < order.length - 1) {
					expect(manager.totalShards, `seed ${seed} committed before every current disconnect`).toBe(4);
				}
			}
			expect(manager.totalShards, `seed ${seed} did not commit exact current evidence`).toBe(6);
		}
	});
});
