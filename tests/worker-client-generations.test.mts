import { describe, expect, test, vi } from 'vitest';
import { WorkerClient } from '../src/client/workerclient';
import { createPlugin } from '../src/client/plugins';
import { GatewayOpcodes, type GatewayDispatchPayload } from '../src/types';
import { ShardSocketCloseCodes, type WorkerData } from '../src/websocket/discord/shared';

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

function workerData(): WorkerData {
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

describe('WorkerClient generation gate', () => {
	test('hydrates READY identity while shadowed and acknowledges activation only after shard readiness', async () => {
		const messages: Record<string, unknown>[] = [];
		const handleManagerMessages = vi.fn();
		const client = new WorkerClient({
			handleManagerMessages,
			postMessage: body => messages.push(body as Record<string, unknown>),
		});
		client.setWorkerData({
			...workerData(),
			generation: 1,
			allocationId: 'candidate-1',
			shadow: true,
		});
		const shard = client.createShard(0, {
			compress: false,
			info: gatewayInfo(),
			properties: { browser: 'test', device: 'test', os: 'test' },
		});
		shard.isReady = true;
		client.shards.set(0, shard);
		const disconnect = vi.spyOn(shard, 'disconnect');
		const cacheOnPacket = vi.spyOn(client.cache, 'onPacket').mockResolvedValue(undefined);
		await shard.options.handlePayload(0, {
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
		} as GatewayDispatchPayload);
		expect(client.botId).toBe('bot-id');
		expect(client.applicationId).toBe('application-id');
		expect(client.me.id).toBe('bot-id');
		const guildCreate = {
			op: 0,
			s: 2,
			t: 'GUILD_CREATE',
			d: { id: 'guild-id' },
		} as GatewayDispatchPayload;
		let releaseHydration!: () => void;
		const hydrationBlocked = new Promise<void>(resolve => {
			releaseHydration = resolve;
		});
		cacheOnPacket.mockImplementation(packet =>
			packet.t === 'GUILD_CREATE' ? hydrationBlocked : Promise.resolve(),
		);
		const hydration = shard.options.handlePayload(0, guildCreate);
		await vi.waitFor(() => expect(cacheOnPacket).toHaveBeenCalledWith(guildCreate));
		const shardsReady = shard.options.handlePayload(0, {
			op: 0,
			s: 3,
			t: 'GUILDS_READY',
		} as GatewayDispatchPayload);
		await Promise.resolve();
		expect(messages.some(message => message.type === 'WORKER_GENERATION_SHARDS_READY')).toBe(false);
		releaseHydration();
		await hydration;
		await shardsReady;
		expect(messages.at(-1)).toMatchObject({
			type: 'WORKER_GENERATION_SHARDS_READY',
			workerId: 0,
			generation: 1,
			allocationId: 'candidate-1',
		});

		const runEvent = vi.spyOn(client.events, 'runEvent');
		const executeEvent = vi.spyOn(client.events, 'execute');
		await client.handleManagerMessages({
			type: 'BEGIN_WORKER_GENERATION_CUTOVER',
			generation: 1,
			allocationId: 'candidate-1',
		});
		expect(messages.at(-1)).toMatchObject({ type: 'WORKER_GENERATION_CUTOVER_READY', generation: 1 });
		await client.handleManagerMessages({
			type: 'ACTIVATE_WORKER_GENERATION',
			generation: 1,
			allocationId: 'candidate-1',
		});
		expect(messages.at(-1)).toMatchObject({ type: 'WORKER_GENERATION_ACTIVATED', generation: 1 });
		expect(runEvent).toHaveBeenCalledWith('WORKER_SHARDS_CONNECTED', client, client.me, -1);
		expect(runEvent).toHaveBeenCalledWith('WORKER_READY', client, client.me, -1);
		expect(executeEvent.mock.calls.map(call => (call[0] as GatewayDispatchPayload).t)).toEqual(['READY', 'GUILDS_READY']);

		await client.handleManagerMessages({
			type: 'DRAIN_WORKER_GENERATION',
			generation: 0,
			allocationId: 'stale',
		});
		await client.handleManagerMessages({ type: 'DRAIN_WORKER_GENERATION' });
		expect(disconnect).not.toHaveBeenCalled();
		expect(handleManagerMessages).not.toHaveBeenCalled();
	});

	test('applies eager shadow dispatch interceptors once before cache hydration and bootstrap replay', async () => {
		const intercepted: GatewayDispatchPayload[] = [];
		const plugin = createPlugin({
			name: 'shadow-dispatch-interceptor',
			register(api) {
				api.gateway.onDispatch((packet, next) => {
					intercepted.push(packet);
					if (packet.t === 'GUILD_DELETE') return null;
					return next({ ...packet, s: (packet.s ?? 0) + 100 } as GatewayDispatchPayload);
				});
			},
		});
		const messages: Record<string, unknown>[] = [];
		const client = new WorkerClient({
			getRC: async () => ({ token: 'token', intents: 0, locations: { base: '' } }),
			plugins: [plugin],
			postMessage: body => messages.push(body as Record<string, unknown>),
		});
		client.setWorkerData({
			...workerData(),
			generation: 1,
			allocationId: 'intercepted-shadow',
			shadow: true,
		});
		await client.start();
		const cacheOnPacket = vi.spyOn(client.cache, 'onPacket').mockResolvedValue(undefined);
		const shard = client.createShard(0, {
			compress: false,
			info: gatewayInfo(),
			properties: { browser: 'test', device: 'test', os: 'test' },
		});
		shard.isReady = true;
		client.shards.set(0, shard);

		await shard.options.handlePayload(0, {
			op: GatewayOpcodes.Dispatch,
			s: 1,
			t: 'GUILD_DELETE',
			d: { id: 'vetoed', unavailable: true },
		} as GatewayDispatchPayload);
		await shard.options.handlePayload(0, {
			op: GatewayOpcodes.Dispatch,
			s: 2,
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
		} as GatewayDispatchPayload);
		await shard.options.handlePayload(0, {
			op: GatewayOpcodes.Dispatch,
			s: 3,
			t: 'GUILDS_READY',
		} as GatewayDispatchPayload);

		expect(intercepted).toHaveLength(3);
		expect(cacheOnPacket.mock.calls.map(([packet]) => packet.s)).toEqual([102, 103]);
		expect(messages.at(-1)).toMatchObject({ type: 'WORKER_GENERATION_SHARDS_READY' });

		await client.handleManagerMessages({
			type: 'BEGIN_WORKER_GENERATION_CUTOVER',
			generation: 1,
			allocationId: 'intercepted-shadow',
		});
		await client.handleManagerMessages({
			type: 'ACTIVATE_WORKER_GENERATION',
			generation: 1,
			allocationId: 'intercepted-shadow',
		});

		expect(intercepted).toHaveLength(3);
		expect(
			cacheOnPacket.mock.calls
				.map(([packet]) => packet)
				.filter(packet => packet.t === 'READY' || packet.t === 'GUILDS_READY')
				.map(packet => packet.s),
		).toEqual([102, 103]);
	});

	test('buffers cutover dispatches and replays them before acknowledging activation', async () => {
		const messages: Record<string, unknown>[] = [];
		const handlePayload = vi.fn();
		const client = new WorkerClient({
			handlePayload,
			postMessage: body => messages.push(body as Record<string, unknown>),
		});
		client.setWorkerData({
			...workerData(),
			generation: 1,
			allocationId: 'buffered-1',
			shadow: true,
		});
		const generation = (
			client as unknown as {
				generation: { shardsReady: boolean; waitForDispatches(): Promise<void> };
			}
		).generation;
		generation.shardsReady = true;
		const shard = client.createShard(0, {
			compress: false,
			info: gatewayInfo(),
			properties: { browser: 'test', device: 'test', os: 'test' },
		});
		client.shards.set(0, shard);

		await client.handleManagerMessages({
			type: 'BEGIN_WORKER_GENERATION_CUTOVER',
			generation: 1,
			allocationId: 'buffered-1',
		});
		const packet = {
			op: 0,
			s: 4,
			t: 'GUILD_DELETE',
			d: { id: 'guild-id', unavailable: true },
		} as GatewayDispatchPayload;
		const packet2 = { ...packet, s: 5, d: { id: 'guild-id-2', unavailable: true } } as GatewayDispatchPayload;
		const boundaryPacket = { ...packet, s: 6, d: { id: 'guild-id-3', unavailable: true } } as GatewayDispatchPayload;
		await shard.options.handlePayload(0, packet);
		await shard.options.handlePayload(0, packet2);
		expect(handlePayload).not.toHaveBeenCalled();
		let injectedAtBoundary = false;
		generation.waitForDispatches = async () => {
			if (injectedAtBoundary) return;
			injectedAtBoundary = true;
			await shard.options.handlePayload(0, boundaryPacket);
		};

		await client.handleManagerMessages({
			type: 'ACTIVATE_WORKER_GENERATION',
			generation: 1,
			allocationId: 'buffered-1',
		});
		expect(handlePayload.mock.calls).toEqual([
			[0, packet],
			[0, packet2],
			[0, boundaryPacket],
		]);
		expect(injectedAtBoundary).toBe(true);
		expect(messages.at(-1)).toMatchObject({ type: 'WORKER_GENERATION_ACTIVATED' });
	});

	test('serializes duplicate activation commands through one activation', async () => {
		const messages: Record<string, unknown>[] = [];
		const client = new WorkerClient({ postMessage: body => messages.push(body as Record<string, unknown>) });
		client.setWorkerData({
			...workerData(),
			generation: 1,
			allocationId: 'duplicate-activation-1',
			shadow: true,
		});
		let release!: () => void;
		const blocked = new Promise<void>(resolve => {
			release = resolve;
		});
		const activateShadowGeneration = vi.fn(() => blocked);
		const generation = (
			client as unknown as {
				generation: { shardsReady: boolean; activateShadowGeneration: typeof activateShadowGeneration };
			}
		).generation;
		generation.shardsReady = true;
		generation.activateShadowGeneration = activateShadowGeneration;
		await client.handleManagerMessages({
			type: 'BEGIN_WORKER_GENERATION_CUTOVER',
			generation: 1,
			allocationId: 'duplicate-activation-1',
		});
		const command = {
			type: 'ACTIVATE_WORKER_GENERATION' as const,
			generation: 1,
			allocationId: 'duplicate-activation-1',
		};
		const first = client.handleManagerMessages(command);
		const second = client.handleManagerMessages(command);
		await Promise.resolve();
		expect(activateShadowGeneration).toHaveBeenCalledOnce();
		release();
		await Promise.all([first, second]);
		expect(messages.filter(message => message.type === 'WORKER_GENERATION_ACTIVATED')).toHaveLength(1);
	});

	test('fails a candidate instead of growing the cutover buffer past its internal bound', async () => {
		const messages: Record<string, unknown>[] = [];
		const client = new WorkerClient({ postMessage: body => messages.push(body as Record<string, unknown>) });
		client.logger.fatal = vi.fn();
		client.setWorkerData({
			...workerData(),
			generation: 1,
			allocationId: 'bounded-1',
			shadow: true,
		});
		const generation = (
			client as unknown as {
				generation: {
					shardsReady: boolean;
					cutoverBuffer: { shardId: number; packet: GatewayDispatchPayload }[];
				};
			}
		).generation;
		generation.shardsReady = true;
		const shard = client.createShard(0, {
			compress: false,
			info: gatewayInfo(),
			properties: { browser: 'test', device: 'test', os: 'test' },
		});
		client.shards.set(0, shard);
		await client.handleManagerMessages({
			type: 'BEGIN_WORKER_GENERATION_CUTOVER',
			generation: 1,
			allocationId: 'bounded-1',
		});
		generation.cutoverBuffer = Array.from({ length: 10_000 }, () => ({
			shardId: 0,
			packet: { op: 0, s: 0, t: 'GUILD_DELETE', d: { id: 'queued', unavailable: true } } as GatewayDispatchPayload,
		}));
		const packet = {
			op: 0,
			s: 1,
			t: 'GUILD_DELETE',
			d: { id: 'guild-id', unavailable: true },
		} as GatewayDispatchPayload;
		await shard.options.handlePayload(0, packet);

		expect(messages.at(-1)).toMatchObject({
			type: 'WORKER_GENERATION_FAILED',
			message: expect.stringMatching(/cutover buffer exceeded 10000 events/),
		});
		expect(messages.filter(message => message.type === 'WORKER_GENERATION_FAILED')).toHaveLength(1);
		await client.handleManagerMessages({
			type: 'ACTIVATE_WORKER_GENERATION',
			generation: 1,
			allocationId: 'bounded-1',
		});
		expect(messages.some(message => message.type === 'WORKER_GENERATION_ACTIVATED')).toBe(false);
	});

	test('fails closed before startup when required supervisor IPC is already disconnected', () => {
		const client = new WorkerClient();
		client.setWorkerData({
			...workerData(),
			supervisorTimeoutMs: 100,
			supervisorIssuedAtMonotonicMs: 0,
		});
		const shard = client.createShard(0, {
			compress: false,
			info: gatewayInfo(),
			properties: { browser: 'test', device: 'test', os: 'test' },
		});
		client.shards.set(0, shard);
		const disconnect = vi.spyOn(shard, 'disconnect');
		const exitProcess = vi.fn();
		const generation = (
			client as unknown as {
				generation: {
					installSupervisorFence(supervisor: unknown, exitProcess: (code: number) => void): boolean;
				};
			}
		).generation;

		expect(
			generation.installSupervisorFence({ connected: false, once: vi.fn(), send: vi.fn() }, exitProcess),
		).toBe(false);
		expect(disconnect).toHaveBeenCalledWith(ShardSocketCloseCodes.ShutdownAll);
		expect(client.shards.size).toBe(0);
		expect(exitProcess).toHaveBeenCalledWith(1);
	});

	test('expires, extends, and generation-fences the monotonic supervisor lease without invoking user hooks', async () => {
		vi.useFakeTimers();
		try {
			const handleManagerMessages = vi.fn();
			const client = new WorkerClient({ handleManagerMessages });
			client.setWorkerData({
				...workerData(),
				generation: 1,
				allocationId: 'supervisor-lease-1',
				supervisorTimeoutMs: 100,
				supervisorIssuedAtMonotonicMs: 0,
			});
			const shard = client.createShard(0, {
				compress: false,
				info: gatewayInfo(),
				properties: { browser: 'test', device: 'test', os: 'test' },
			});
			client.shards.set(0, shard);
			const disconnect = vi.spyOn(shard, 'disconnect');
			const exitProcess = vi.fn();
			let monotonicNow = 0;
			const generation = (
				client as unknown as {
					generation: {
						supervisorMonotonicNow: () => number;
						installSupervisorFence(supervisor: unknown, exitProcess: (code: number) => void): boolean;
					};
				}
			).generation;
			generation.supervisorMonotonicNow = () => monotonicNow;
			const supervisor = { connected: true, once: vi.fn(), send: vi.fn() };
			expect(generation.installSupervisorFence(supervisor, exitProcess)).toBe(true);

			const advance = async (milliseconds: number) => {
				monotonicNow += milliseconds;
				await vi.advanceTimersByTimeAsync(milliseconds);
			};
			await advance(90);
			await client.handleManagerMessages({
				type: 'RENEW_WORKER_SUPERVISOR_LEASE',
				expiresInMs: 1_000,
				issuedAtMonotonicMs: monotonicNow,
				sequence: 99,
				generation: 0,
				allocationId: 'stale-allocation',
			});
			await client.handleManagerMessages({
				type: 'RENEW_WORKER_SUPERVISOR_LEASE',
				expiresInMs: 100,
				issuedAtMonotonicMs: 70,
				sequence: 1,
				generation: 1,
				allocationId: 'supervisor-lease-1',
			});
			await client.handleManagerMessages({
				type: 'RENEW_WORKER_SUPERVISOR_LEASE',
				expiresInMs: 1,
				issuedAtMonotonicMs: monotonicNow,
				sequence: 2,
				generation: 1,
				allocationId: 'supervisor-lease-1',
			});
			await client.handleManagerMessages({
				type: 'RENEW_WORKER_SUPERVISOR_LEASE',
				expiresInMs: 1_000,
				issuedAtMonotonicMs: monotonicNow,
				sequence: 1,
				generation: 1,
				allocationId: 'supervisor-lease-1',
			});
			expect(handleManagerMessages).not.toHaveBeenCalled();

			await advance(11);
			expect(exitProcess).not.toHaveBeenCalled();
			await advance(69);
			expect(disconnect).toHaveBeenCalledWith(ShardSocketCloseCodes.ShutdownAll);
			expect(exitProcess).toHaveBeenCalledWith(1);
		} finally {
			vi.useRealTimers();
		}
	});

	test('counts the initial supervisor lease from the supervisor-issued timestamp', async () => {
		vi.useFakeTimers();
		try {
			const client = new WorkerClient();
			client.setWorkerData({
				...workerData(),
				generation: 1,
				allocationId: 'startup-lease-1',
				supervisorTimeoutMs: 100,
				supervisorIssuedAtMonotonicMs: 0,
			});
			const exitProcess = vi.fn();
			let monotonicNow = 90;
			const generation = (
				client as unknown as {
					generation: {
						supervisorMonotonicNow: () => number;
						installSupervisorFence(supervisor: unknown, exitProcess: (code: number) => void): boolean;
					};
				}
			).generation;
			generation.supervisorMonotonicNow = () => monotonicNow;
			generation.installSupervisorFence({ connected: true, once: vi.fn(), send: vi.fn() }, exitProcess);
			monotonicNow = 99;
			await vi.advanceTimersByTimeAsync(9);
			expect(exitProcess).not.toHaveBeenCalled();
			monotonicNow = 100;
			await vi.advanceTimersByTimeAsync(1);
			expect(exitProcess).toHaveBeenCalledWith(1);
		} finally {
			vi.useRealTimers();
		}
	});

	test('waits for in-flight dispatch before acknowledging drain', async () => {
		const messages: Record<string, unknown>[] = [];
		const onShardDisconnect = vi.fn();
		const onShardReconnect = vi.fn();
		let release!: () => void;
		const blocked = new Promise<void>(resolve => {
			release = resolve;
		});
		const client = new WorkerClient({
			handlePayload: () => blocked,
			onShardDisconnect,
			onShardReconnect,
			postMessage: body => messages.push(body as Record<string, unknown>),
		});
		client.setWorkerData({
			...workerData(),
			generation: 0,
			allocationId: 'active-0',
			shadow: false,
		});
		const shard = client.createShard(0, {
			compress: false,
			info: gatewayInfo(),
			properties: { browser: 'test', device: 'test', os: 'test' },
		});
		client.shards.set(0, shard);
		const disconnect = vi.spyOn(shard, 'disconnect');

		const dispatch = shard.options.handlePayload(0, {
			op: 0,
			s: 1,
			t: 'GUILD_DELETE',
			d: { id: 'guild-id', unavailable: true },
		} as GatewayDispatchPayload);
		await Promise.resolve();
		const drain = client.handleManagerMessages({
			type: 'DRAIN_WORKER_GENERATION',
			generation: 0,
			allocationId: 'active-0',
		});
		await Promise.resolve();
		expect(messages.some(message => message.type === 'WORKER_GENERATION_DRAINED')).toBe(false);
		expect(disconnect).not.toHaveBeenCalled();

		release();
		await dispatch;
		await drain;
		expect(disconnect).toHaveBeenCalledOnce();
		expect(messages.at(-1)).toMatchObject({
			type: 'WORKER_GENERATION_DRAINED',
			generation: 0,
			allocationId: 'active-0',
		});
		await shard.options.onShardDisconnect?.({
			shardId: 0,
			code: ShardSocketCloseCodes.Resharding,
			reason: 'generation drained',
		});
		await shard.options.onShardReconnect?.({ shardId: 0 });
		expect(onShardDisconnect).not.toHaveBeenCalled();
		expect(onShardReconnect).not.toHaveBeenCalled();
	});
});
