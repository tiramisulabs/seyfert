import { describe, expect, test, vi } from 'vitest';
import { WorkerClient } from '../src/client/workerclient';
import {
	type GatewayDispatchPayload,
	GatewayIntentBits,
	GatewayOpcodes,
	type GatewaySendPayload,
	PresenceUpdateStatus,
} from '../src/types';
import { ShardManager, WorkerManager } from '../src/websocket';
import type { WorkerData } from '../src/websocket/discord/shared';

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
			spawn: () => ({ terminate() {} }),
		},
		getRC: async () => ({
			token: 'token',
			intents: GatewayIntentBits.Guilds,
			locations: { base: '' },
		}),
		...options,
	} as ConstructorParameters<typeof WorkerManager>[0]);
	return { manager, messages };
}

function legacyWorkerData(): WorkerData {
	return {
		compress: false,
		debug: false,
		info: gatewayInfo(),
		intents: 0,
		mode: 'custom',
		path: '',
		resharding: false,
		shards: [0],
		token: 'token',
		totalShards: 1,
		totalWorkers: 1,
		workerId: 0,
		workerProxy: false,
	};
}

describe('gateway send chokepoints', () => {
	test('WorkerClient rejects missing legacy incarnation during configuration and start', async () => {
		const client = new WorkerClient({ postMessage() {} });
		const data = legacyWorkerData();
		expect(() => client.setWorkerData(data)).toThrow(/legacy worker data requires a non-empty incarnationId/i);

		data.incarnationId = 'configured-incarnation';
		client.setWorkerData(data);
		delete data.incarnationId;
		await expect(client.start()).rejects.toThrow(/legacy worker data requires a non-empty incarnationId/i);
		data.incarnationId = 'configured-incarnation';
	});

	test('ShardManager.send rejects missing shards instead of silently dropping payloads', async () => {
		const manager = createShardManager();

		await expect(manager.send(0, { op: GatewayOpcodes.Heartbeat, d: null })).rejects.toMatchObject({
			metadata: expect.objectContaining({ detail: `Shard #0 doesn't exist` }),
		});
	});

	test('ShardManager.send applies payload hooks and reports consumed payloads', async () => {
		const sent: GatewaySendPayload[] = [];
		const manager = createShardManager({
			handleSendPayload: (_shardId, payload) => ({ ...payload, d: 42 }) as GatewaySendPayload,
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

	test('WorkerClient does not forward manager routing identity to Discord', async () => {
		const send = vi.fn();
		const client = new WorkerClient({ postMessage() {} });
		client.setWorkerData({
			compress: false,
			debug: false,
			incarnationId: 'send-target',
			info: gatewayInfo(),
			intents: 0,
			mode: 'custom',
			path: '',
			resharding: false,
			shards: [0],
			token: 'token',
			totalShards: 1,
			totalWorkers: 1,
			workerId: 0,
			workerProxy: false,
		});
		client.shards.set(0, { send } as never);

		await client.handleManagerMessages({
			type: 'SEND_PAYLOAD',
			incarnationId: 'send-target',
			nonce: 'send-nonce',
			shardId: 0,
			op: GatewayOpcodes.Heartbeat,
			d: null,
		});

		expect(send).toHaveBeenCalledWith(true, { op: GatewayOpcodes.Heartbeat, d: null });
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
		manager.set(1, { incarnationId: 'presence-worker' });

		manager.spawn(1, 3);

		expect(presence).toHaveBeenCalledWith(3, 1);
		expect(messages).toEqual([
			{
				type: 'ALLOW_CONNECT',
				incarnationId: 'presence-worker',
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
		manager.set(0, { incarnationId: 'no-presence-worker' });

		manager.spawn(0, 0);

		expect(messages).toEqual([
			{
				type: 'ALLOW_CONNECT',
				incarnationId: 'no-presence-worker',
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

	test('WorkerManager preserves custom adapter paths when provided', async () => {
		const spawn = vi.fn(() => ({ terminate() {} }));
		const { manager } = createWorkerManager({
			path: 'worker.js',
			adapter: {
				postMessage: () => {},
				spawn,
			},
		});

		manager.prepareWorkers([[0]]);
		await manager.workerQueue.shift()!();

		expect(spawn).toHaveBeenCalledWith(expect.objectContaining({ path: 'worker.js' }), expect.any(Object));
	});

	test('WorkerClient reshard swap preserves ordinary parent payload forwarding', async () => {
		const messages: unknown[] = [];
		const handlePayload = vi.fn();
		const client = new WorkerClient({
			getRC: async () => ({ token: 'token', intents: 0, locations: { base: '' } }),
			handlePayload,
			postMessage: body => messages.push(body),
			sendPayloadToParent: true,
		});
		client.setWorkerData({
			compress: false,
			debug: false,
			info: gatewayInfo(),
			intents: 0,
			incarnationId: 'gateway-send-cutover',
			mode: 'custom',
			path: '',
			resharding: false,
			reshardId: 'gateway-send-reshard',
			shards: [0],
			token: 'token',
			totalShards: 1,
			totalWorkers: 1,
			workerId: 7,
			workerProxy: false,
		});
		const shard = client.createShard(0, { info: gatewayInfo(), compress: false });
		client.resharding.set(0, shard);
		await client.handleManagerMessages({
			type: 'CONNECT_ALL_SHARDS_RESHARDING',
			incarnationId: 'gateway-send-cutover',
			info: gatewayInfo(),
			totalShards: 1,
			totalWorkers: 1,
			reshardId: 'gateway-send-reshard',
		});
		const payload = {
			op: GatewayOpcodes.Dispatch,
			t: 'RESHARD_TEST_EVENT',
			s: 1,
			d: { value: 'after-swap' },
		} as unknown as GatewayDispatchPayload;

		await shard.options.handlePayload(0, payload);

		expect(handlePayload).toHaveBeenCalledWith(0, payload);
		expect(messages.at(-1)).toEqual({
			workerId: 7,
			incarnationId: 'gateway-send-cutover',
			shardId: 0,
			type: 'RECEIVE_PAYLOAD',
			payload,
		});
	});

	test('WorkerClient RAW hooks do not block semantic gateway dispatch', async () => {
		let releaseRaw!: () => void;
		const rawBlocked = new Promise<void>(resolve => (releaseRaw = resolve));
		const client = new WorkerClient({
			getRC: async () => ({ token: 'token', intents: 0, locations: { base: '' } }),
		});
		client.setWorkerData({
			compress: false,
			debug: false,
			incarnationId: 'raw-hooks',
			info: gatewayInfo(),
			intents: 0,
			mode: 'custom',
			path: '',
			resharding: false,
			shards: [0],
			token: 'token',
			totalShards: 1,
			totalWorkers: 1,
			workerId: 0,
			workerProxy: false,
		});
		vi.spyOn(client.events, 'runEvent').mockImplementation(event =>
			event === 'RAW' ? rawBlocked : Promise.resolve(),
		);
		const execute = vi.spyOn(client.events, 'execute').mockResolvedValue(undefined);
		const packet = {
			op: GatewayOpcodes.Dispatch,
			t: 'RAW_NON_BLOCKING_TEST',
			s: 1,
			d: {},
		} as unknown as GatewayDispatchPayload;
		let settled = false;
		const processing = (
			client as unknown as {
				onPacket(packet: GatewayDispatchPayload, shardId: number): Promise<GatewayDispatchPayload | null>;
			}
		)
			.onPacket(packet, 0)
			.then(result => {
				settled = true;
				return result;
			});

		await vi.waitFor(() => expect(execute).toHaveBeenCalledOnce());
		await Promise.resolve();
		expect(settled).toBe(true);
		releaseRaw();
		await expect(processing).resolves.toBe(packet);
	});
});
