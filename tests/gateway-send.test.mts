import { describe, expect, test, vi } from 'vitest';
import {
	GatewayDispatchEvents,
	GatewayIntentBits,
	GatewayOpcodes,
	type GatewaySendPayload,
	PresenceUpdateStatus,
} from '../src/types';
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
	} as ConstructorParameters<typeof WorkerManager>[0]);
	return { manager, messages };
}

describe('gateway send chokepoints', () => {
	test('ShardManager.setPresence propagates send failures while sending to every shard', async () => {
		const manager = createShardManager();
		const first = manager.create(0);
		const second = manager.create(1);
		const error = new Error('presence send failed');
		const firstSend = vi.spyOn(first, 'send').mockRejectedValue(error);
		const secondSend = vi.spyOn(second, 'send').mockResolvedValue(undefined);
		try {
			await expect(
				manager.setPresence({ activities: [], afk: false, since: null, status: PresenceUpdateStatus.Online }),
			).rejects.toBe(error);
			expect(firstSend).toHaveBeenCalledOnce();
			expect(secondSend).toHaveBeenCalledOnce();
		} finally {
			firstSend.mockRestore();
			secondSend.mockRestore();
		}
	});

	test('guild member requests reject failed sends and release their timeout', async () => {
		vi.useFakeTimers();
		const shard = createShardManager().create(0);
		const error = new Error('member request send failed');
		const send = vi.spyOn(shard, 'send').mockRejectedValue(error);
		try {
			await expect(shard.requestGuildMember({ guild_id: 'guild', query: '', limit: 0 })).rejects.toBe(error);
			expect(vi.getTimerCount()).toBe(0);
		} finally {
			send.mockRestore();
			vi.clearAllTimers();
			vi.useRealTimers();
		}
	});

	test('guild member requests propagate a failed rate-limit retry and release their timeout', async () => {
		vi.useFakeTimers();
		const shard = createShardManager().create(0);
		const error = new Error('member request retry failed');
		const send = vi.spyOn(shard, 'send').mockResolvedValueOnce(undefined).mockRejectedValueOnce(error);
		try {
			const pending = shard.requestGuildMember({ guild_id: 'guild', query: '', limit: 0 });
			const rejection = expect(pending).rejects.toBe(error);
			const nonce = (send.mock.calls[0][1].d as { nonce: string }).nonce;
			shard.onpacket({
				op: GatewayOpcodes.Dispatch,
				t: GatewayDispatchEvents.RateLimited,
				s: 1,
				d: { opcode: GatewayOpcodes.RequestGuildMembers, retry_after: 0, meta: { guild_id: 'guild', nonce } },
			});
			await vi.advanceTimersByTimeAsync(500);
			await rejection;
			expect(send).toHaveBeenCalledTimes(2);
			expect(vi.getTimerCount()).toBe(0);
		} finally {
			send.mockRestore();
			vi.clearAllTimers();
			vi.useRealTimers();
		}
	});

	test('guild member requests do not retry after their response has completed', async () => {
		vi.useFakeTimers();
		const shard = createShardManager().create(0);
		const send = vi.spyOn(shard, 'send').mockResolvedValue(undefined);
		try {
			const pending = shard.requestGuildMember({ guild_id: 'guild', query: '', limit: 0 });
			const nonce = (send.mock.calls[0][1].d as { nonce: string }).nonce;
			shard.onpacket({
				op: GatewayOpcodes.Dispatch,
				t: GatewayDispatchEvents.RateLimited,
				s: 1,
				d: { opcode: GatewayOpcodes.RequestGuildMembers, retry_after: 0, meta: { guild_id: 'guild', nonce } },
			});
			shard.onpacket({
				op: GatewayOpcodes.Dispatch,
				t: GatewayDispatchEvents.GuildMembersChunk,
				s: 2,
				d: { guild_id: 'guild', members: [], chunk_index: 0, chunk_count: 1, nonce },
			});
			await expect(pending).resolves.toEqual({ members: [], presences: [] });
			await vi.advanceTimersByTimeAsync(500);
			expect(send).toHaveBeenCalledOnce();
			expect(vi.getTimerCount()).toBe(0);
		} finally {
			send.mockRestore();
			vi.clearAllTimers();
			vi.useRealTimers();
		}
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

	test('WorkerManager.send registers acknowledgements before a reentrant transport responds', async () => {
		let manager!: WorkerManager;
		({ manager } = createWorkerManager({
			adapter: {
				spawn() {},
				async postMessage(workerId, message) {
					if (
						typeof message !== 'object' ||
						message === null ||
						!('type' in message) ||
						message.type !== 'SEND_PAYLOAD' ||
						!('nonce' in message) ||
						typeof message.nonce !== 'string'
					)
						return;
					await manager.handleWorkerMessage({
						type: 'RESULT_PAYLOAD',
						workerId,
						nonce: message.nonce,
					});
				},
			},
		}));
		manager.set(0, {});

		await expect(manager.send({ op: GatewayOpcodes.Heartbeat, d: null }, 0)).resolves.toBe(true);
		expect(manager.promises).toHaveLength(0);
	});

	test('WorkerManager.send clears acknowledgements when worker transport fails', async () => {
		const transportError = new Error('transport failed');
		const { manager } = createWorkerManager({
			adapter: {
				spawn() {},
				async postMessage() {
					throw transportError;
				},
			},
		});
		manager.set(0, {});

		await expect(manager.send({ op: GatewayOpcodes.Heartbeat, d: null }, 0)).rejects.toBe(transportError);
		expect(manager.promises).toHaveLength(0);
	});

	test('WorkerManager.start respects an explicit zero intents option', async () => {
		const { manager } = createWorkerManager({ intents: 0 });

		await manager.start();

		expect(manager.options.intents).toBe(0);
	});
});
