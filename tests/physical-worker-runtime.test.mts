import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { WorkerClient } from '../src/client/workerclient';
import type { GatewayDispatchPayload } from '../src/types';
import { Shard } from '../src/websocket/discord/shard';
import {
	type PhysicalGatewayDispatch,
	PhysicalWorkerPort,
	type PhysicalWorkerToHostMessage,
} from '../src/websocket/discord/physical-worker-port';
import type { WorkerData } from '../src/websocket/discord/shared';

const identity = { slot: 'worker-0', token: 'opaque-token' } as const;
const clients = new Set<WorkerClient>();
let connect: MockInstance<Shard['connect']>;
let disconnect: MockInstance<Shard['disconnect']>;

beforeEach(() => {
	connect = vi.spyOn(Shard.prototype, 'connect').mockResolvedValue(undefined);
	disconnect = vi.spyOn(Shard.prototype, 'disconnect');
});

afterEach(async () => {
	const active = [...clients];
	clients.clear();
	try {
		await Promise.all(active.map(client => client.close()));
	} finally {
		vi.useRealTimers();
		vi.restoreAllMocks();
	}
});

function gatewayInfo() {
	return {
		session_start_limit: {
			max_concurrency: 1,
			remaining: 1_000,
			reset_after: 0,
			total: 1_000,
		},
		shards: 1,
		url: 'wss://gateway.discord.gg',
	};
}

function data(): WorkerData {
	return {
		compress: false,
		debug: false,
		info: gatewayInfo(),
		intents: 0,
		mode: 'custom',
		path: '',
		resharding: false,
		shards: [0],
		token: 'discord-token',
		totalShards: 1,
		totalWorkers: 1,
		workerId: 0,
		workerProxy: false,
	};
}

function packet(sequence: number, id = `guild-${sequence}`) {
	return {
		op: 0,
		s: sequence,
		t: 'GUILD_DELETE',
		d: { id, unavailable: true },
	} as GatewayDispatchPayload;
}

function readyPacket(sequence: number) {
	return {
		op: 0,
		s: sequence,
		t: 'READY',
		d: {
			application: { id: 'application-id' },
			user: {
				avatar: null,
				bot: true,
				discriminator: '0',
				global_name: null,
				id: 'bot-id',
				username: 'bot',
			},
		},
	} as GatewayDispatchPayload;
}

function installFakeSocket(shard: Shard) {
	const socket = { readyState: 1, close: vi.fn() };
	shard.websocket = socket as never;
	return socket;
}

async function createPhysicalClient(handlePayload = vi.fn(), onShardDisconnect = vi.fn(), workerData = data()) {
	const messages: Record<string, any>[] = [];
	const client = new WorkerClient({
		getRC: async () => ({ token: 'discord-token', intents: 0, locations: { base: '' } }),
		handlePayload,
		onShardDisconnect,
		physicalWorker: identity,
		postMessage: body => messages.push(body as Record<string, any>),
	});
	client.setWorkerData(workerData);
	const shard = await startPhysicalClient(client);
	return { client, handlePayload, messages, onShardDisconnect, shard };
}

async function startPhysicalClient(client: WorkerClient) {
	clients.add(client);
	await client.start();
	const shard = client.shards.get(0);
	if (!shard) throw new Error('Physical bootstrap did not create assigned shard 0');
	return shard;
}

describe('WorkerClient physical IPC', () => {
	test('reports shard connection failure as one terminal physical launch fault', async () => {
		connect.mockRejectedValueOnce(new Error('connect failed'));
		const messages: Record<string, any>[] = [];
		const client = new WorkerClient({
			getRC: async () => ({ token: 'discord-token', intents: 0, locations: { base: '' } }),
			physicalWorker: identity,
			postMessage: body => messages.push(body as Record<string, any>),
		});
		client.setWorkerData(data());
		await startPhysicalClient(client);
		await vi.waitFor(() =>
			expect(messages.filter(message => message.type === 'SEYFERT_PHYSICAL_FAULT')).toEqual([
				expect.objectContaining({ error: 'connect failed', ...identity }),
			]),
		);
	});

	test('acknowledges cyclic and bigint dispatch values exactly once', async () => {
		const { client, messages } = await createPhysicalClient();
		const cyclic: Record<string, unknown> = {};
		cyclic.self = cyclic;
		for (const [dispatchId, value] of [
			['cyclic', cyclic],
			['bigint', { value: 1n }],
		] as const) {
			await client.handleManagerMessages({
				type: 'SEYFERT_PHYSICAL_APPLY_DISPATCH',
				...identity,
				dispatchId,
				body: { shardId: 0, payload: { ...packet(1), d: value } as GatewayDispatchPayload },
			});
			expect(messages.filter(message => message.dispatchId === dispatchId)).toHaveLength(1);
			expect(messages.at(-1)).toMatchObject({ type: 'SEYFERT_PHYSICAL_DISPATCH_ACK', dispatchId });
		}
	});

	test('rejects a same-identity dispatch outside the assigned shard topology', async () => {
		const handlePayload = vi.fn();
		const { client, messages } = await createPhysicalClient(handlePayload);
		await client.handleManagerMessages({
			type: 'SEYFERT_PHYSICAL_APPLY_DISPATCH',
			...identity,
			dispatchId: 'outside-topology',
			body: { shardId: 1, payload: packet(1) },
		});
		expect(handlePayload).not.toHaveBeenCalled();
		expect(messages.at(-1)).toMatchObject({
			type: 'SEYFERT_PHYSICAL_DISPATCH_ACK',
			dispatchId: 'outside-topology',
			error: expect.stringMatching(/invalid physical gateway dispatch/i),
		});
	});

	test('bootstraps exactly its physical shards through the local identify queue without a legacy manager', async () => {
		vi.useFakeTimers();
		const messages: Record<string, any>[] = [];
		const handlePayload = vi.fn();
		const client = new WorkerClient({
			getRC: async () => ({ token: 'discord-token', intents: 0, locations: { base: '' } }),
			handlePayload,
			physicalWorker: identity,
			postMessage: body => messages.push(body as Record<string, any>),
		});
		const worker = data();
		worker.shards = [0, 1, 2, 3];
		worker.totalShards = worker.info.shards = 4;
		worker.info.session_start_limit.max_concurrency = 2;
		client.setWorkerData(worker);

		try {
			await startPhysicalClient(client);
			expect([...client.shards.keys()]).toEqual([0, 1, 2, 3]);
			expect([...client.shards.values()].every(shard => shard.websocket === null)).toBe(true);
			for (const shard of client.shards.values()) installFakeSocket(shard);
			expect(connect).toHaveBeenCalledTimes(2);
			expect(messages.some(message => message.type === 'WORKER_START')).toBe(false);
			expect(messages.some(message => message.type === 'SEYFERT_PHYSICAL_READY')).toBe(false);

			await vi.advanceTimersByTimeAsync(5_499);
			expect(connect).toHaveBeenCalledTimes(2);
			await vi.advanceTimersByTimeAsync(1);
			expect(connect).toHaveBeenCalledTimes(4);
			for (const shard of client.shards.values()) {
				shard.data.session_id = `session-${shard.id}`;
				await shard.options.handlePayload(shard.id, readyPacket(shard.id + 1));
			}
			for (const shard of client.shards.values()) {
				shard.isReady = true;
				await shard.options.handlePayload(shard.id, {
					op: 0,
					s: shard.id + 5,
					t: 'GUILDS_READY',
				} as GatewayDispatchPayload);
			}
			expect(handlePayload).not.toHaveBeenCalled();
			expect(messages.filter(message => message.type === 'SEYFERT_PHYSICAL_READY')).toEqual([
				{ type: 'SEYFERT_PHYSICAL_READY', ...identity },
			]);
			const runEvent = vi.spyOn(client.events, 'runEvent');
			const captured = messages.filter(message => message.type === 'SEYFERT_PHYSICAL_RAW_DISPATCH');
			for (const [index, message] of captured.entries()) {
				await client.handleManagerMessages({
					type: 'SEYFERT_PHYSICAL_APPLY_DISPATCH',
					...identity,
					dispatchId: `ready-${index}`,
					body: message.body,
				});
				expect(runEvent.mock.calls.filter(([name]) => name === 'WORKER_SHARDS_CONNECTED')).toHaveLength(
					index < 3 ? 0 : 1,
				);
				expect(runEvent.mock.calls.filter(([name]) => name === 'WORKER_READY')).toHaveLength(index < 7 ? 0 : 1);
			}
			expect(handlePayload).toHaveBeenCalledTimes(8);
			expect(runEvent.mock.calls.filter(([name]) => name === 'WORKER_SHARDS_CONNECTED')).toHaveLength(1);
			expect(runEvent.mock.calls.filter(([name]) => name === 'WORKER_READY')).toHaveLength(1);
			expect(messages.some(message => message.type === 'WORKER_READY')).toBe(false);

			const unknownStart = messages.length;
			const firstShard = client.shards.get(0)!;
			await firstShard.options.handlePayload(99, readyPacket(30));
			await firstShard.options.handlePayload(99, { op: 0, s: 31, t: 'GUILDS_READY' } as GatewayDispatchPayload);
			const unknown = messages
				.slice(unknownStart)
				.filter(message => message.type === 'SEYFERT_PHYSICAL_RAW_DISPATCH');
			for (const [index, message] of [...unknown, captured[0], captured[4]].entries()) {
				await client.handleManagerMessages({
					type: 'SEYFERT_PHYSICAL_APPLY_DISPATCH',
					...identity,
					dispatchId: `unknown-${index}`,
					body: message.body,
				});
			}
			expect(runEvent.mock.calls.filter(([name]) => name === 'WORKER_SHARDS_CONNECTED')).toHaveLength(1);
			expect(runEvent.mock.calls.filter(([name]) => name === 'WORKER_READY')).toHaveLength(1);

			const reconnectStart = messages.length;
			const reconnecting = [client.shards.get(0)!, client.shards.get(1)!];
			for (const shard of reconnecting) await shard.options.handlePayload(shard.id, readyPacket(shard.id + 10));
			for (const shard of reconnecting) {
				await shard.options.handlePayload(shard.id, {
					op: 0,
					s: shard.id + 12,
					t: 'GUILDS_READY',
				} as GatewayDispatchPayload);
			}
			const reconnect = messages
				.slice(reconnectStart)
				.filter(message => message.type === 'SEYFERT_PHYSICAL_RAW_DISPATCH');
			for (const [index, message] of reconnect.entries()) {
				await client.handleManagerMessages({
					type: 'SEYFERT_PHYSICAL_APPLY_DISPATCH',
					...identity,
					dispatchId: `reconnect-${index}`,
					body: message.body,
				});
				expect(runEvent.mock.calls.filter(([name]) => name === 'WORKER_SHARDS_CONNECTED')).toHaveLength(
					index < 1 ? 1 : 2,
				);
				expect(runEvent.mock.calls.filter(([name]) => name === 'WORKER_READY')).toHaveLength(index < 3 ? 1 : 2);
			}
			expect(runEvent.mock.calls.filter(([name]) => name === 'WORKER_SHARDS_CONNECTED')).toHaveLength(2);
			expect(runEvent.mock.calls.filter(([name]) => name === 'WORKER_READY')).toHaveLength(2);
			expect(messages.filter(message => message.type === 'SEYFERT_PHYSICAL_READY')).toHaveLength(1);

			const resumedStart = messages.length;
			await reconnecting[0].options.handlePayload(0, { op: 0, s: 20, t: 'RESUMED' } as GatewayDispatchPayload);
			const resumed = messages
				.slice(resumedStart)
				.find(message => message.type === 'SEYFERT_PHYSICAL_RAW_DISPATCH');
			await client.handleManagerMessages({
				type: 'SEYFERT_PHYSICAL_APPLY_DISPATCH',
				...identity,
				dispatchId: 'resumed',
				body: resumed!.body,
			});
			expect(runEvent.mock.calls.filter(([name]) => name === 'WORKER_SHARDS_CONNECTED')).toHaveLength(2);
			expect(runEvent.mock.calls.filter(([name]) => name === 'WORKER_READY')).toHaveLength(2);

			await client.close();
			clients.delete(client);
			expect(disconnect).toHaveBeenCalledTimes(4);
		} finally {
			vi.useRealTimers();
		}
	});

	test('reports readiness only after application and every local shard are ready without running user hooks', async () => {
		const { client, handlePayload, messages, shard } = await createPhysicalClient();
		shard.isReady = true;
		await shard.options.handlePayload(0, {
			op: 0,
			s: 1,
			t: 'GUILDS_READY',
		} as GatewayDispatchPayload);

		expect(handlePayload).not.toHaveBeenCalled();
		expect(messages).toContainEqual({
			type: 'SEYFERT_PHYSICAL_RAW_DISPATCH',
			...identity,
			body: expect.objectContaining({ shardId: 0 }),
		});
		expect(messages.filter(message => message.type === 'SEYFERT_PHYSICAL_READY')).toEqual([
			{ type: 'SEYFERT_PHYSICAL_READY', ...identity },
		]);
		expect(client.me).toBeUndefined();
	});

	test('restores resumable shard membership without premature or retroactive aggregate readiness', async () => {
		const worker = data();
		worker.shards = [0, 1];
		worker.totalShards = worker.info.shards = 2;
		worker.info.session_start_limit.max_concurrency = 2;
		const onShardDisconnect = vi.fn();
		const { client, messages } = await createPhysicalClient(vi.fn(), onShardDisconnect, worker);
		const runEvent = vi.spyOn(client.events, 'runEvent');
		const shards = [client.shards.get(0)!, client.shards.get(1)!];
		expect(shards.every(shard => shard.websocket === null)).toBe(true);
		const sockets = shards.map(installFakeSocket);
		for (const shard of shards) {
			shard.data.session_id = `session-${shard.id}`;
			await shard.options.handlePayload(shard.id, readyPacket(shard.id + 40));
		}
		for (const shard of shards) {
			shard.isReady = true;
			await shard.options.handlePayload(shard.id, {
				op: 0,
				s: shard.id + 42,
				t: 'GUILDS_READY',
			} as GatewayDispatchPayload);
		}
		let applied = 0;
		for (const message of messages.filter(message => message.type === 'SEYFERT_PHYSICAL_RAW_DISPATCH')) {
			await client.handleManagerMessages({
				type: 'SEYFERT_PHYSICAL_APPLY_DISPATCH',
				...identity,
				dispatchId: `initial-resume-${applied++}`,
				body: message.body,
			});
		}
		expect(runEvent.mock.calls.filter(([name]) => name === 'WORKER_SHARDS_CONNECTED')).toHaveLength(1);
		expect(runEvent.mock.calls.filter(([name]) => name === 'WORKER_READY')).toHaveLength(1);

		const shard0 = shards[0];
		const shard1 = shards[1];
		const replayCycle = async (capture: () => Promise<void>, prefix: string) => {
			const start = messages.length;
			await capture();
			const cycle = messages.slice(start).filter(message => message.type === 'SEYFERT_PHYSICAL_RAW_DISPATCH');
			for (const [index, message] of cycle.entries()) {
				await client.handleManagerMessages({
					type: 'SEYFERT_PHYSICAL_APPLY_DISPATCH',
					...identity,
					dispatchId: `${prefix}-${index}`,
					body: message.body,
				});
			}
		};
		const disconnectShard0 = async (reason: string) => {
			sockets[0].readyState = 3;
			shard0.isReady = false;
			await shard0.options.onShardDisconnect?.({ shardId: 0, code: 1_001, reason });
		};

		await disconnectShard0('pure-resumed');
		await replayCycle(async () => {
			sockets[0].readyState = 1;
			shard0.isReady = true;
			await shard0.options.handlePayload(0, { op: 0, s: 49, t: 'RESUMED' } as GatewayDispatchPayload);
		}, 'pure-resumed');
		expect(runEvent.mock.calls.filter(([name]) => name === 'WORKER_SHARDS_CONNECTED')).toHaveLength(1);
		expect(runEvent.mock.calls.filter(([name]) => name === 'WORKER_READY')).toHaveLength(1);

		sockets[0].readyState = 3;
		shard0.isReady = false;
		await replayCycle(async () => {
			await shard1.options.handlePayload(1, readyPacket(50));
			await shard1.options.handlePayload(1, { op: 0, s: 51, t: 'GUILDS_READY' } as GatewayDispatchPayload);
		}, 'before-late-disconnect');
		expect(runEvent.mock.calls.filter(([name]) => name === 'WORKER_SHARDS_CONNECTED')).toHaveLength(1);
		expect(runEvent.mock.calls.filter(([name]) => name === 'WORKER_READY')).toHaveLength(1);
		await shard0.options.onShardDisconnect?.({ shardId: 0, code: 1_001, reason: 'late-disconnect' });
		await replayCycle(async () => {
			sockets[0].readyState = 1;
			shard0.isReady = true;
			await shard0.options.handlePayload(0, { op: 0, s: 52, t: 'RESUMED' } as GatewayDispatchPayload);
		}, 'resumed-last');
		expect(runEvent.mock.calls.filter(([name]) => name === 'WORKER_SHARDS_CONNECTED')).toHaveLength(1);
		expect(runEvent.mock.calls.filter(([name]) => name === 'WORKER_READY')).toHaveLength(1);

		await disconnectShard0('resumed-first');
		await replayCycle(async () => {
			sockets[0].readyState = 1;
			shard0.isReady = true;
			await shard0.options.handlePayload(0, { op: 0, s: 60, t: 'RESUMED' } as GatewayDispatchPayload);
			await shard1.options.handlePayload(1, readyPacket(61));
			await shard1.options.handlePayload(1, { op: 0, s: 62, t: 'GUILDS_READY' } as GatewayDispatchPayload);
		}, 'resumed-first');
		expect(runEvent.mock.calls.filter(([name]) => name === 'WORKER_SHARDS_CONNECTED')).toHaveLength(2);
		expect(runEvent.mock.calls.filter(([name]) => name === 'WORKER_READY')).toHaveLength(2);
		expect(onShardDisconnect).toHaveBeenCalledTimes(3);
	});

	test('rejects a stale token before cache, events, hooks, or acknowledgements mutate', async () => {
		const { client, handlePayload, messages } = await createPhysicalClient();
		const cache = vi.spyOn(client.cache, 'onPacket');
		const events = vi.spyOn(client.events, 'runEvent');
		const before = messages.length;

		await client.handleManagerMessages({
			type: 'SEYFERT_PHYSICAL_APPLY_DISPATCH',
			slot: identity.slot,
			token: 'stale',
			dispatchId: 'stale-dispatch',
			body: { shardId: 0, payload: packet(2) },
			snapshot: { dispatches: [{ shardId: 0, payload: packet(1) }] },
		});

		expect(cache).not.toHaveBeenCalled();
		expect(events).not.toHaveBeenCalled();
		expect(handlePayload).not.toHaveBeenCalled();
		expect(messages).toHaveLength(before);
	});

	test('hydrates dispatch snapshots through cache without firing user hooks for snapshot packets', async () => {
		const { client, handlePayload, messages } = await createPhysicalClient();
		const cache = vi.spyOn(client.cache, 'onPacket').mockResolvedValue(undefined);
		const ready = {
			op: 0,
			s: 1,
			t: 'READY',
			d: {
				application: { id: 'application-id' },
				user: {
					avatar: null,
					bot: true,
					discriminator: '0',
					global_name: null,
					id: 'bot-id',
					username: 'bot',
				},
			},
		} as GatewayDispatchPayload;

		const command = {
			type: 'SEYFERT_PHYSICAL_APPLY_DISPATCH' as const,
			...identity,
			dispatchId: 'hydrate-1',
			snapshot: { dispatches: [{ shardId: 0, payload: ready }, { shardId: 0, payload: packet(2) }] },
			body: { shardId: 0, payload: packet(3) },
		};
		await client.handleManagerMessages(command);
		await client.handleManagerMessages(command);

		const cached = cache.mock.calls.map(([value]) => value);
		expect(cached.slice(0, 2)).toEqual([ready, packet(2)]);
		expect(cached[2]).toEqual(expect.objectContaining({ t: 'GUILD_DELETE', d: packet(3).d }));
		expect(client.botId).toBe('bot-id');
		expect(client.applicationId).toBe('application-id');
		expect(handlePayload).toHaveBeenCalledOnce();
		expect(handlePayload).toHaveBeenCalledWith(0, packet(3));
		expect(messages.filter(message => message.type === 'SEYFERT_PHYSICAL_DISPATCH_ACK')).toEqual([
			expect.objectContaining({ dispatchId: 'hydrate-1' }),
			expect.objectContaining({ dispatchId: 'hydrate-1' }),
		]);
	});

	test('acknowledges only after the authorized dispatch and all user work settle', async () => {
		let release!: () => void;
		const blocked = new Promise<void>(resolve => {
			release = resolve;
		});
		const handlePayload = vi.fn(() => blocked);
		const { client, messages } = await createPhysicalClient(handlePayload);
		const applying = client.handleManagerMessages({
			type: 'SEYFERT_PHYSICAL_APPLY_DISPATCH',
			...identity,
			dispatchId: 'dispatch-1',
			body: { shardId: 0, payload: packet(1) },
		});
		await vi.waitFor(() => expect(handlePayload).toHaveBeenCalledOnce());
		expect(messages.some(message => message.type === 'SEYFERT_PHYSICAL_DISPATCH_ACK')).toBe(false);
		release();
		await applying;
		expect(messages.at(-1)).toEqual({
			type: 'SEYFERT_PHYSICAL_DISPATCH_ACK',
			...identity,
			dispatchId: 'dispatch-1',
		});
	});

	test('runs typed handling while RAW is pending but delays dispatch ACK until RAW settles', async () => {
		let releaseRaw!: () => void;
		const rawPending = new Promise<void>(resolve => {
			releaseRaw = resolve;
		});
		const { client, messages } = await createPhysicalClient();
		const runEvent = vi.spyOn(client.events, 'runEvent').mockImplementation(async name => {
			if (name === 'RAW') await rawPending;
		});
		const execute = vi.spyOn(client.events, 'execute').mockResolvedValue(undefined);

		const applying = client.handleManagerMessages({
			type: 'SEYFERT_PHYSICAL_APPLY_DISPATCH',
			...identity,
			dispatchId: 'raw-concurrency',
			body: { shardId: 0, payload: packet(1) },
		});
		await vi.waitFor(() => expect(execute).toHaveBeenCalledOnce());
		expect(runEvent).toHaveBeenCalledWith('RAW', client, packet(1), 0, false);
		expect(messages.some(message => message.type === 'SEYFERT_PHYSICAL_DISPATCH_ACK')).toBe(false);

		let settled = false;
		void applying.then(() => (settled = true));
		await Promise.resolve();
		expect(settled).toBe(false);
		releaseRaw();
		await applying;
		expect(messages.at(-1)).toEqual({
			type: 'SEYFERT_PHYSICAL_DISPATCH_ACK',
			...identity,
			dispatchId: 'raw-concurrency',
		});
	});

	test('gates disconnect callbacks until port-authorized traffic starts', async () => {
		const { client, onShardDisconnect, shard } = await createPhysicalClient();
		const disconnected = { shardId: 0, code: 3000, reason: 'test' };
		await shard.options.onShardDisconnect?.(disconnected);
		expect(onShardDisconnect).not.toHaveBeenCalled();

		await client.handleManagerMessages({
			type: 'SEYFERT_PHYSICAL_APPLY_DISPATCH',
			...identity,
			dispatchId: 'authorize-callbacks',
			body: { shardId: 0, payload: packet(1) },
		});
		await shard.options.onShardDisconnect?.(disconnected);
		expect(onShardDisconnect).toHaveBeenCalledOnce();
	});

	test('shares duplicate dispatch work and rejects conflicting id reuse without double side effects', async () => {
		const handlePayload = vi.fn();
		const { client, messages } = await createPhysicalClient(handlePayload);
		const first = {
			type: 'SEYFERT_PHYSICAL_APPLY_DISPATCH' as const,
			...identity,
			dispatchId: 'once',
			body: { shardId: 0, payload: packet(1) },
		};
		await Promise.all([client.handleManagerMessages(first), client.handleManagerMessages(first)]);
		await client.handleManagerMessages({
			...first,
			body: { shardId: 0, payload: packet(2) },
		});

		expect(handlePayload).toHaveBeenCalledOnce();
		expect(messages.filter(message => message.type === 'SEYFERT_PHYSICAL_DISPATCH_ACK')).toEqual([
			expect.objectContaining({ dispatchId: 'once' }),
			expect.objectContaining({ dispatchId: 'once' }),
			expect.objectContaining({ dispatchId: 'once', error: expect.stringMatching(/different input/) }),
		]);
	});

	test('roundtrips through the real port in order and keeps drain blocked until worker ACK', async () => {
		const delivered: number[] = [];
		let release!: () => void;
		const blocked = new Promise<void>(resolve => {
			release = resolve;
		});
		const handlePayload = vi.fn(async (_shardId: number, payload: GatewayDispatchPayload) => {
			delivered.push(payload.s!);
			if (payload.s === 4) await blocked;
		});
		let raw!: (body: PhysicalGatewayDispatch) => void;
		let resolveReady!: () => void;
		const ready = new Promise<void>(resolve => {
			resolveReady = resolve;
		});
		const dispatchAcks = new Map<string, { resolve(): void; reject(error: Error): void }>();
		const onWorkerMessage = (message: PhysicalWorkerToHostMessage) => {
			switch (message.type) {
				case 'SEYFERT_PHYSICAL_RAW_DISPATCH':
					raw(message.body);
					break;
				case 'SEYFERT_PHYSICAL_READY':
					resolveReady();
					break;
				case 'SEYFERT_PHYSICAL_DISPATCH_ACK': {
					const ack = dispatchAcks.get(message.dispatchId);
					if (!ack) break;
					dispatchAcks.delete(message.dispatchId);
					if (message.error) ack.reject(new Error(message.error));
					else ack.resolve();
					break;
				}
			}
		};
		const client = new WorkerClient({
			getRC: async () => ({ token: 'discord-token', intents: 0, locations: { base: '' } }),
			handlePayload,
			physicalWorker: identity,
			postMessage: body => onWorkerMessage(body as PhysicalWorkerToHostMessage),
		});
		client.setWorkerData(data());
		let dispatchId = 0;
		const port = new PhysicalWorkerPort<PhysicalGatewayDispatch>({
			adapter: {
				launch: async input => {
					raw = input.dispatch;
					return { ready, close() {} };
				},
				dispatch(body, snapshot) {
					const id = `dispatch-${++dispatchId}`;
					return new Promise<void>((resolve, reject) => {
						dispatchAcks.set(id, { resolve, reject });
						void client.handleManagerMessages({
							type: 'SEYFERT_PHYSICAL_APPLY_DISPATCH',
							...identity,
							dispatchId: id,
							body,
							snapshot,
						});
					});
				},
			},
		});
		const launching = port.control({
			kind: 'launch',
			commandId: 'launch',
			identity,
			topology: { shardStart: 0, shardEnd: 1, totalShards: 1 },
			maxBufferedDispatches: 10,
		});
		const shard = await startPhysicalClient(client);
		shard.isReady = true;
		await shard.options.handlePayload(0, {
			op: 0,
			s: 1,
			t: 'GUILDS_READY',
		} as GatewayDispatchPayload);
		await expect(launching).resolves.toMatchObject({ state: 'standby' });
		await port.control({ kind: 'hydrate', commandId: 'hydrate', identity, snapshot: { dispatches: [] } });
		await port.control({ kind: 'arm', commandId: 'arm', identity });
		await shard.options.handlePayload(0, packet(2));
		await shard.options.handlePayload(0, packet(3));
		expect(delivered).toEqual([]);
		await expect(port.control({ kind: 'activate', commandId: 'activate', identity })).resolves.toMatchObject({
			state: 'active',
			replayed: 3,
		});
		expect(delivered).toEqual([1, 2, 3]);

		await shard.options.handlePayload(0, packet(4));
		await vi.waitFor(() => expect(delivered).toEqual([1, 2, 3, 4]));
		let drained = false;
		const drain = port.control({ kind: 'drain', commandId: 'drain', identity }).then(receipt => {
			drained = true;
			return receipt;
		});
		await Promise.resolve();
		expect(drained).toBe(false);
		release();
		await expect(drain).resolves.toMatchObject({ state: 'drained' });
	});

	test('does not evict an in-flight dispatch before its ACK is delivered', async () => {
		const previousLimit = process.env.SEYFERT_PHYSICAL_RECENT_DISPATCHES;
		process.env.SEYFERT_PHYSICAL_RECENT_DISPATCHES = '8';
		let release!: () => void;
		const blocked = new Promise<void>(resolve => {
			release = resolve;
		});
		try {
			const handlePayload = vi.fn(() => blocked);
			const { client, messages } = await createPhysicalClient(handlePayload);
			const applying = Array.from({ length: 8 }, (_, index) =>
				client.handleManagerMessages({
					type: 'SEYFERT_PHYSICAL_APPLY_DISPATCH',
					...identity,
					dispatchId: `blocked-${index}`,
					body: { shardId: 0, payload: packet(index + 1) },
				}),
			);
			await vi.waitFor(() => expect(handlePayload).toHaveBeenCalledTimes(1));

			await client.handleManagerMessages({
				type: 'SEYFERT_PHYSICAL_APPLY_DISPATCH',
				...identity,
				dispatchId: 'blocked-overflow',
				body: { shardId: 0, payload: packet(9) },
			});
			expect(handlePayload).toHaveBeenCalledTimes(1);
			expect(messages.at(-1)).toMatchObject({
				type: 'SEYFERT_PHYSICAL_DISPATCH_ACK',
				dispatchId: 'blocked-overflow',
				error: expect.stringMatching(/retry window is full/),
			});

			release();
			await Promise.all(applying);
			await client.handleManagerMessages({
				type: 'SEYFERT_PHYSICAL_APPLY_DISPATCH',
				...identity,
				dispatchId: 'after-ack',
				body: { shardId: 0, payload: packet(10) },
			});
			expect(handlePayload).toHaveBeenCalledTimes(9);
		} finally {
			release();
			if (previousLimit === undefined) delete process.env.SEYFERT_PHYSICAL_RECENT_DISPATCHES;
			else process.env.SEYFERT_PHYSICAL_RECENT_DISPATCHES = previousLimit;
		}
	});

	test('bounds acknowledged dispatch and hydration retry evidence under sustained traffic', async () => {
		const previousLimit = process.env.SEYFERT_PHYSICAL_RECENT_DISPATCHES;
		process.env.SEYFERT_PHYSICAL_RECENT_DISPATCHES = '8';
		try {
			const { client, handlePayload, messages } = await createPhysicalClient();
			for (let sequence = 1; sequence <= 64; sequence++) {
				await client.handleManagerMessages({
					type: 'SEYFERT_PHYSICAL_APPLY_DISPATCH',
					...identity,
					dispatchId: `stress-${sequence}`,
					snapshot: { dispatches: [{ shardId: 0, payload: packet(sequence, `snapshot-${sequence}`) }] },
					body: { shardId: 0, payload: packet(sequence, `body-${sequence}`) },
				});
			}

			const runtime = (client as unknown as {
				physicalRuntime: {
					applied: ReadonlyMap<string, unknown>;
					hydratedSnapshots: ReadonlyMap<string, unknown>;
				};
			}).physicalRuntime;
			expect(runtime.applied.size).toBeLessThanOrEqual(8);
			expect(runtime.hydratedSnapshots.size).toBeLessThanOrEqual(8);
			expect(handlePayload).toHaveBeenCalledTimes(64);

			const latest = {
				type: 'SEYFERT_PHYSICAL_APPLY_DISPATCH' as const,
				...identity,
				dispatchId: 'stress-64',
				snapshot: { dispatches: [{ shardId: 0, payload: packet(64, 'snapshot-64') }] },
				body: { shardId: 0, payload: packet(64, 'body-64') },
			};
			await client.handleManagerMessages(latest);
			expect(handlePayload).toHaveBeenCalledTimes(64);
			expect(messages.filter(message => message.type === 'SEYFERT_PHYSICAL_DISPATCH_ACK')).toHaveLength(65);

			await client.handleManagerMessages({
				...latest,
				dispatchId: 'stress-1',
				snapshot: { dispatches: [{ shardId: 0, payload: packet(1, 'snapshot-1') }] },
				body: { shardId: 0, payload: packet(1, 'body-1') },
			});
			expect(handlePayload).toHaveBeenCalledTimes(65);
			expect(runtime.applied.size).toBeLessThanOrEqual(8);
			expect(runtime.hydratedSnapshots.size).toBeLessThanOrEqual(8);
		} finally {
			if (previousLimit === undefined) delete process.env.SEYFERT_PHYSICAL_RECENT_DISPATCHES;
			else process.env.SEYFERT_PHYSICAL_RECENT_DISPATCHES = previousLimit;
		}
	});
});
