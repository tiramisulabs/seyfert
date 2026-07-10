import { describe, expect, test, vi } from 'vitest';
import { GatewayIntentBits, type RESTGetAPIGatewayBotResult } from '../src/types';
import { WorkerManager } from '../src/websocket';

function gatewayInfo(shards = 4): RESTGetAPIGatewayBotResult {
	return {
		session_start_limit: {
			max_concurrency: 2,
			remaining: 999,
			reset_after: 0,
			total: 1_000,
		},
		shards,
		url: 'wss://gateway.discord.gg',
	};
}

function resolvedTopology(shards = 4) {
	return {
		info: gatewayInfo(shards),
		shardEnd: shards,
		shardsPerWorker: 16,
		shardStart: 0,
		totalShards: shards,
		workers: 1,
	};
}

function createManager(
	gatewayGet = vi.fn(async () => gatewayInfo()),
	info?: RESTGetAPIGatewayBotResult,
) {
	const spawn = vi.fn();
	const getRC = vi.fn(async () => ({
		debug: false,
		intents: GatewayIntentBits.Guilds,
		locations: { base: '' },
		token: 'runtime-token',
	}));
	const manager = new WorkerManager({
		mode: 'custom',
		adapter: {
			postMessage() {},
			spawn,
		},
		getRC,
		info,
		resharding: {
			interval: 0,
			percentage: 80,
		},
	});
	manager.setRest({
		proxy: {
			gateway: {
				bot: { get: gatewayGet },
			},
		},
	} as never);
	return { gatewayGet, getRC, manager, spawn };
}

describe('WorkerManager.resolveShardTopology', () => {
	test('resolves runtime defaults and gateway information without creating workers', async () => {
		const { gatewayGet, getRC, manager, spawn } = createManager();

		await expect(manager.resolveShardTopology()).resolves.toEqual(resolvedTopology());

		expect(getRC).toHaveBeenCalledTimes(1);
		expect(gatewayGet).toHaveBeenCalledTimes(1);
		expect(spawn).not.toHaveBeenCalled();
		expect(manager.size).toBe(0);
		expect(manager.workerQueue).toHaveLength(0);
		expect(manager.options.token).toBe('runtime-token');
		expect(manager.options.intents).toBe(GatewayIntentBits.Guilds);
		expect(manager.totalShards).toBe(4);
		expect(manager.shardStart).toBe(0);
		expect(manager.shardEnd).toBe(4);
		expect(manager.shardsPerWorker).toBe(16);
		expect(manager.totalWorkers).toBe(1);
		expect(manager.remaining).toBe(999);
		expect(manager.concurrency).toBe(2);
	});

	test('reuses a sequential topology resolution when start is called', async () => {
		const { gatewayGet, getRC, manager, spawn } = createManager();

		const topology = await manager.resolveShardTopology();
		await manager.start();

		expect(topology).toEqual(resolvedTopology());
		expect(getRC).toHaveBeenCalledTimes(1);
		expect(gatewayGet).toHaveBeenCalledTimes(1);
		expect(spawn).toHaveBeenCalledTimes(1);
	});

	test('shares one resolution between concurrent resolve and start calls', async () => {
		const { gatewayGet, getRC, manager, spawn } = createManager();

		const resolution = manager.resolveShardTopology();
		const start = manager.start();
		await expect(resolution).resolves.toEqual(resolvedTopology());
		await start;

		expect(getRC).toHaveBeenCalledTimes(1);
		expect(gatewayGet).toHaveBeenCalledTimes(1);
		expect(spawn).toHaveBeenCalledTimes(1);
	});

	test('allows retrying after a failed gateway request', async () => {
		const gatewayError = new Error('gateway unavailable');
		const gatewayGet = vi
			.fn<() => Promise<RESTGetAPIGatewayBotResult>>()
			.mockRejectedValueOnce(gatewayError)
			.mockResolvedValueOnce(gatewayInfo());
		const { getRC, manager, spawn } = createManager(gatewayGet);

		await expect(manager.resolveShardTopology()).rejects.toBe(gatewayError);
		await expect(manager.resolveShardTopology()).resolves.toEqual(resolvedTopology());

		expect(getRC).toHaveBeenCalledTimes(2);
		expect(gatewayGet).toHaveBeenCalledTimes(2);
		expect(spawn).not.toHaveBeenCalled();
	});

	test('reuses pre-supplied gateway information without making a REST request', async () => {
		const gatewayGet = vi.fn(async () => gatewayInfo());
		const { manager, spawn } = createManager(gatewayGet, gatewayInfo(6));

		await expect(manager.resolveShardTopology()).resolves.toEqual(resolvedTopology(6));
		await manager.start();

		expect(gatewayGet).not.toHaveBeenCalled();
		expect(spawn).toHaveBeenCalledTimes(1);
	});

	test('rejects invalid recommended shard counts without spawning workers', async () => {
		const { manager, spawn } = createManager(vi.fn(async () => gatewayInfo(0)));

		await expect(manager.resolveShardTopology()).rejects.toMatchObject({
			metadata: { detail: 'info.shards must be a positive safe integer' },
		});

		expect(spawn).not.toHaveBeenCalled();
	});

	test('retries REST after an invalid fetched shard recommendation', async () => {
		const gatewayGet = vi
			.fn<() => Promise<RESTGetAPIGatewayBotResult>>()
			.mockResolvedValueOnce(gatewayInfo(0))
			.mockResolvedValueOnce(gatewayInfo(4));
		const { manager, spawn } = createManager(gatewayGet);

		await expect(manager.resolveShardTopology()).rejects.toMatchObject({
			metadata: { detail: 'info.shards must be a positive safe integer' },
		});
		await expect(manager.resolveShardTopology()).resolves.toEqual(resolvedTopology(4));

		expect(gatewayGet).toHaveBeenCalledTimes(2);
		expect(spawn).not.toHaveBeenCalled();
	});

	test('returns a topology snapshot independent from later gateway info mutations', async () => {
		const info = gatewayInfo();
		const { manager } = createManager(vi.fn(async () => info));

		const topology = await manager.resolveShardTopology();
		info.shards = 8;
		info.session_start_limit.remaining = 0;

		expect(topology.totalShards).toBe(4);
		expect(topology.info.shards).toBe(4);
		expect(topology.info.session_start_limit.remaining).toBe(999);
		expect(Object.isFrozen(topology)).toBe(true);
		expect(Object.isFrozen(topology.info)).toBe(true);
		expect(Object.isFrozen(topology.info.session_start_limit)).toBe(true);
	});

	test('rejects topology drift between resolution and start', async () => {
		const { manager, spawn } = createManager();
		await manager.resolveShardTopology();
		manager.options.totalShards = 8;

		await expect(manager.start()).rejects.toMatchObject({
			metadata: { detail: 'WorkerManager shard topology changed after it was resolved' },
		});
		expect(spawn).not.toHaveBeenCalled();
	});

	test('derives workers from the effective partial shard range', async () => {
		const { manager } = createManager(vi.fn(async () => gatewayInfo(16)));
		manager.options.shardStart = 8;
		manager.options.shardEnd = 16;
		manager.options.totalShards = 16;
		manager.options.shardsPerWorker = 4;

		await expect(manager.resolveShardTopology()).resolves.toMatchObject({
			shardStart: 8,
			shardEnd: 16,
			totalShards: 16,
			shardsPerWorker: 4,
			workers: 2,
		});
	});

	test('rejects an explicit worker count that cannot match the effective shard buckets', async () => {
		const { manager, spawn } = createManager(vi.fn(async () => gatewayInfo(16)));
		manager.options.shardStart = 8;
		manager.options.shardEnd = 16;
		manager.options.totalShards = 16;
		manager.options.shardsPerWorker = 4;
		manager.options.workers = 4;

		await expect(manager.resolveShardTopology()).rejects.toMatchObject({
			metadata: { detail: expect.stringMatching(/workers must be 2/) },
		});
		expect(spawn).not.toHaveBeenCalled();
	});
});
