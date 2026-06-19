import { describe, expect, test, vi } from 'vitest';
import { GatewayIntentBits, GatewayOpcodes, type GatewaySendPayload, PresenceUpdateStatus } from '../src/types';
import { ShardManager, WorkerManager } from '../src/websocket';

function gatewayInfo() {
	return {
		session_start_limit: {
			max_concurrency: 1,
			remaining: 1000,
			reset_after: 0,
			total: 1000,
		},
		shards: 1,
		url: 'wss://gateway.discord.gg',
	};
}

function createShardManager(options: Partial<ConstructorParameters<typeof ShardManager>[0]> = {}) {
	return new ShardManager({
		token: 'token',
		intents: 0,
		info: gatewayInfo(),
		handlePayload() {},
		...options,
	});
}

function createWorkerManager(options: Partial<ConstructorParameters<typeof WorkerManager>[0]> = {}) {
	const messages: unknown[] = [];
	const manager = new WorkerManager({
		mode: 'custom',
		token: 'token',
		intents: 0,
		info: gatewayInfo(),
		shardStart: 0,
		shardEnd: 1,
		totalShards: 1,
		workers: 1,
		shardsPerWorker: 1,
		resharding: { interval: 0, percentage: 0, getInfo: async () => gatewayInfo() },
		adapter: {
			postMessage: (_workerId, body) => messages.push(body),
			spawn: () => {},
		},
		getRC: async () => ({
			token: 'token',
			intents: GatewayIntentBits.Guilds,
			locations: { base: '' },
		}),
		...options,
	});
	return { manager, messages };
}

describe('gateway send chokepoints', () => {
	test('ShardManager.send rejects missing shards instead of silently dropping payloads', async () => {
		const manager = createShardManager();

		await expect(manager.send(0, { op: GatewayOpcodes.Heartbeat, d: null })).rejects.toMatchObject({
			metadata: expect.objectContaining({ detail: `Shard #0 doesn't exist` }),
		});
	});

	test('ShardManager.send applies payload hooks and reports consumed payloads', async () => {
		const sent: GatewaySendPayload[] = [];
		const manager = createShardManager({
			handleSendPayload: (_shardId, payload) => ({ ...payload, d: 42 }),
		});
		manager.set(0, {
			send: async (_force: boolean, payload: GatewaySendPayload) => sent.push(payload),
		} as never);

		await expect(manager.send(0, { op: GatewayOpcodes.Heartbeat, d: null })).resolves.toBe(true);
		expect(sent).toEqual([{ op: GatewayOpcodes.Heartbeat, d: 42 }]);

		manager.options.handleSendPayload = () => null;

		await expect(manager.send(0, { op: GatewayOpcodes.Heartbeat, d: null })).resolves.toBe(false);
		expect(sent).toEqual([{ op: GatewayOpcodes.Heartbeat, d: 42 }]);
	});

	test('ShardManager.create calls presence with only the shard id', () => {
		const presence = vi.fn(() => ({
			activities: [],
			afk: false,
			since: null,
			status: PresenceUpdateStatus.Online,
		}));
		const manager = createShardManager({ presence });

		manager.create(0);

		expect(presence).toHaveBeenCalledWith(0);
		expect(presence.mock.calls[0]).toHaveLength(1);
	});

	test('WorkerManager rejects shard ids outside the configured shard range', () => {
		const { manager } = createWorkerManager({
			shardStart: 4,
			shardEnd: 6,
			totalShards: 6,
			workers: 1,
			shardsPerWorker: 2,
		});

		expect(manager.calculateWorkerId(4)).toBe(0);
		expect(manager.calculateWorkerId(5)).toBe(0);
		expect(() => manager.calculateWorkerId(3)).toThrow(/Invalid shardId/);
		expect(() => manager.calculateWorkerId(6)).toThrow(/Invalid shardId/);
	});

	test('WorkerManager.send can consume payloads before posting to workers', async () => {
		const { manager, messages } = createWorkerManager({
			handleSendPayload: () => null,
		});
		manager.set(0, {});

		await expect(manager.send({ op: GatewayOpcodes.Heartbeat, d: null }, 0)).resolves.toBe(false);
		expect(messages).toEqual([]);
	});

	test('WorkerManager.spawn calls presence with the shard id and worker id', () => {
		const presence = vi.fn(() => ({
			activities: [],
			afk: false,
			since: null,
			status: PresenceUpdateStatus.Online,
		}));
		const { manager, messages } = createWorkerManager({ presence });
		manager.connectQueue = { push: (callback: () => unknown) => callback() } as never;
		manager.set(1, {});

		manager.spawn(1, 3);

		expect(presence).toHaveBeenCalledWith(3, 1);
		expect(messages).toEqual([
			{
				type: 'ALLOW_CONNECT',
				shardId: 3,
				presence: {
					activities: [],
					afk: false,
					since: null,
					status: PresenceUpdateStatus.Online,
				},
			},
		]);
	});

	test('WorkerManager.spawn allows missing presence callbacks', () => {
		const { manager, messages } = createWorkerManager();
		manager.connectQueue = { push: (callback: () => unknown) => callback() } as never;
		manager.set(0, {});

		manager.spawn(0, 0);

		expect(messages).toEqual([
			{
				type: 'ALLOW_CONNECT',
				shardId: 0,
				presence: undefined,
			},
		]);
	});

	test('WorkerManager.start respects an explicit zero intents option', async () => {
		const { manager } = createWorkerManager({ intents: 0 });

		await manager.start();

		expect(manager.options.intents).toBe(0);
	});

	test('WorkerManager defaults omitted native mode to threads', () => {
		const manager = new WorkerManager({
			path: 'worker.js',
			token: 'token',
			intents: 0,
			info: gatewayInfo(),
		});

		expect(manager.options.mode).toBe('threads');
	});

	test('WorkerManager preserves custom adapter paths when provided', () => {
		const spawn = vi.fn();
		const { manager } = createWorkerManager({
			path: 'worker.js',
			adapter: {
				postMessage: () => {},
				spawn,
			},
		});

		manager.prepareWorkers([[0]]);
		manager.workerQueue.shift()!();

		expect(spawn).toHaveBeenCalledWith(expect.objectContaining({ path: 'worker.js' }), expect.any(Object));
	});
});
