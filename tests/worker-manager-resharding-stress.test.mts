import { fork } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { WorkerClient } from '../src/client';
import { GatewayIntentBits, type RESTGetAPIGatewayBotResult } from '../src/types';
import { WorkerManager } from '../src/websocket';
import type { WorkerData } from '../src/websocket/discord/shared';

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

function createHarness(recommendations: readonly number[], heartbeaterInterval = 0) {
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
			spawn(worker, environment) {
				spawnEnvironments.push(environment as Record<string, string>);
				spawned.push({
					workerId: worker.workerId,
					shards: [...worker.shards],
					totalShards: worker.totalShards,
					resharding: worker.resharding,
				});
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

async function readyEveryWorker(manager: WorkerManager, count: number, reshardId: string) {
	for (let workerId = 0; workerId < count; workerId++) {
		await manager.handleWorkerMessage({ type: 'WORKER_READY_RESHARDING', workerId, reshardId });
	}
}

async function disconnectEveryWorker(manager: WorkerManager, count: number, reshardId: string) {
	for (let workerId = 0; workerId < count; workerId++) {
		await manager.handleWorkerMessage({ type: 'DISCONNECTED_ALL_SHARDS_RESHARDING', workerId, reshardId });
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
			await manager.handleWorkerMessage({ type: 'WORKER_READY_RESHARDING', workerId, reshardId });
		} else {
			await manager.handleWorkerMessage({ type: 'DISCONNECTED_ALL_SHARDS_RESHARDING', workerId, reshardId });
		}
	}
}

describe('WorkerManager legacy reshard protocol stress', () => {
	test('rejects stale and missing incarnation on worker data-plane traffic', async () => {
		const { manager } = createHarness([4]);
		manager.set(0, { incarnationId: 'current' });
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
		await manager.handleWorkerMessage({ ...message, incarnationId: 'current' });
		expect(received).toBe(1);
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
		};
		client.setWorkerData(data);
		const stage = (reshardId: string) => ({
			type: 'SPAWN_SHARDS_RESHARDING' as const,
			info: gatewayInfo(4),
			compress: false,
			properties: {} as never,
			reshardId,
		});

		await client.handleManagerMessages({ type: 'WORKER_ALREADY_EXISTS_RESHARDING', reshardId: 'attempt-a' });
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
				await manager.handleWorkerMessage({ type: 'WORKER_READY_RESHARDING', workerId, reshardId: attemptB });
				if (random() < 0.75) {
					await manager.handleWorkerMessage({ type: 'WORKER_READY_RESHARDING', workerId, reshardId: attemptB });
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
					reshardId: attemptB,
				});
				if (random() < 0.75) {
					await manager.handleWorkerMessage({
						type: 'DISCONNECTED_ALL_SHARDS_RESHARDING',
						workerId,
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
