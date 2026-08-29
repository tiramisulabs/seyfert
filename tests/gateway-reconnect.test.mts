import { EventEmitter } from 'node:events';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { GatewayDispatchEvents, GatewayOpcodes } from '../src/types';
import { Shard } from '../src/websocket/discord/shard';
import { type ShardOptions, ShardSocketCloseCodes } from '../src/websocket/discord/shared';

afterEach(() => {
	vi.clearAllTimers();
	vi.resetModules();
	vi.restoreAllMocks();
	vi.useRealTimers();
	vi.doUnmock('../src/websocket/discord/basesocket');
	FakeBaseSocket.instances.length = 0;
});

describe('gateway reconnect stability', () => {
	test('disconnect closes sockets that are still handshaking', () => {
		const shard = new Shard(0, {
			token: 'token',
			intents: 0,
			info: {
				url: 'wss://gateway.discord.gg',
				shards: 1,
				session_start_limit: {
					total: 1,
					remaining: 1,
					reset_after: 0,
					max_concurrency: 1,
				},
			},
			handlePayload: vi.fn(),
		} as unknown as ShardOptions);
		const close = vi.fn();

		shard.websocket = {
			close,
			ping: vi.fn().mockResolvedValue(0),
			readyState: 2,
			send: vi.fn(),
		} as any;

		shard.disconnect(ShardSocketCloseCodes.Reconnect);

		expect(close).toHaveBeenCalledWith(ShardSocketCloseCodes.Reconnect, 'Shard down request');
	});

	test('rejects pending and future sends after a terminal close', async () => {
		const shard = new Shard(3, {
			token: 'token',
			intents: 0,
			info: {
				url: 'wss://gateway.discord.gg',
				shards: 4,
				session_start_limit: {
					total: 4,
					remaining: 4,
					reset_after: 0,
					max_concurrency: 1,
				},
			},
			handlePayload: vi.fn(),
		} as unknown as ShardOptions);
		const pending = shard.send(false, { op: GatewayOpcodes.Heartbeat, d: null });
		const pendingRejection = expect(pending).rejects.toThrow(/shard #3.*3000.*Shard down request/i);

		shard.disconnect(ShardSocketCloseCodes.Shutdown);

		await pendingRejection;
		await expect(shard.send(false, { op: GatewayOpcodes.Heartbeat, d: null })).rejects.toThrow(
			/shard #3.*3000.*Shard down request/i,
		);
	});

	test('rejects guild member requests when their gateway send fails', async () => {
		vi.useFakeTimers();
		const shard = new Shard(3, {
			token: 'token',
			intents: 0,
			info: {
				url: 'wss://gateway.discord.gg',
				shards: 4,
				session_start_limit: {
					total: 4,
					remaining: 4,
					reset_after: 0,
					max_concurrency: 1,
				},
			},
			handlePayload: vi.fn(),
		} as unknown as ShardOptions);
		shard.disconnect(ShardSocketCloseCodes.Shutdown);

		await expect(shard.requestGuildMember({ guild_id: '1', user_ids: ['2'] })).rejects.toThrow(
			/shard #3.*3000.*Shard down request/i,
		);
		expect(vi.getTimerCount()).toBe(0);
	});

	test('a public reconnect reopens a terminally disconnected shard', async () => {
		const { shard, socket: first } = await createConnectedShard({ reconnectTimeout: 0 });
		first.open();
		shard.disconnect(ShardSocketCloseCodes.Shutdown);

		await shard.reconnect();
		const second = FakeBaseSocket.instances[1]!;
		second.open();
		second.message(hello());
		await vi.waitFor(() => expect(second.sent).toHaveLength(1));

		expect(second.sent).toEqual([expect.objectContaining({ op: GatewayOpcodes.Identify })]);
	});

	test('preserves offline sends across an explicit reconnect close', async () => {
		const shard = new Shard(0, {
			token: 'token',
			intents: 0,
			info: {
				url: 'wss://gateway.discord.gg',
				shards: 1,
				session_start_limit: {
					total: 1,
					remaining: 1,
					reset_after: 0,
					max_concurrency: 1,
				},
			},
			handlePayload: vi.fn(),
		} as unknown as ShardOptions);
		const pending = shard.send(false, { op: GatewayOpcodes.Heartbeat, d: null });

		shard.disconnect(ShardSocketCloseCodes.Reconnect);

		expect(shard.offlineSendQueue).toHaveLength(1);
		const rejection = expect(pending).rejects.toThrow(/terminally closed shard/i);
		shard.disconnect(ShardSocketCloseCodes.Shutdown);
		await rejection;
	});

	test('closing an unopened websocket aborts the pending request', async () => {
		const destroy = vi.fn();

		vi.doMock('node:https', () => ({
			request: vi.fn(() => {
				const req = new EventEmitter() as EventEmitter & {
					destroy: typeof destroy;
					end: ReturnType<typeof vi.fn>;
				};
				req.destroy = destroy;
				req.end = vi.fn();
				return req;
			}),
		}));

		const { SeyfertWebSocket } = await import('../src/websocket/discord/socket/custom');
		const socket = new SeyfertWebSocket('wss://gateway.discord.gg/?v=10');
		const onclose = vi.fn();
		socket.onclose = onclose;

		socket.close(ShardSocketCloseCodes.Reconnect, 'Shard down request');

		expect(destroy).toHaveBeenCalledTimes(1);
		expect(onclose).toHaveBeenCalledWith({
			code: ShardSocketCloseCodes.Reconnect,
			reason: 'Shard down request',
		});
	});

	test('transient handshake errors retry before surfacing a close', async () => {
		vi.useFakeTimers();
		const request = vi.fn(() => {
			const req = new EventEmitter() as EventEmitter & {
				destroy: ReturnType<typeof vi.fn>;
				end: () => void;
			};
			req.destroy = vi.fn();
			req.end = () => {
				queueMicrotask(() => {
					req.emit('error', new Error(`boom-${request.mock.calls.length}`));
				});
			};
			return req;
		});

		vi.doMock('node:https', () => ({ request }));

		const { SeyfertWebSocket } = await import('../src/websocket/discord/socket/custom');
		const socket = new SeyfertWebSocket('wss://gateway.discord.gg/?v=10');
		const onclose = vi.fn();
		const onerror = vi.fn();
		socket.onclose = onclose;
		socket.onerror = onerror;

		await Promise.resolve();
		for (let i = 0; i < 5; i++) {
			await vi.advanceTimersByTimeAsync(500);
		}

		expect(request).toHaveBeenCalledTimes(6);
		expect(onerror).toHaveBeenCalledTimes(1);
		expect(onclose).toHaveBeenCalledTimes(1);
		expect(onclose).toHaveBeenCalledWith({
			code: 1006,
			reason: 'boom-6',
		});
	});
});

type CloseEvent = {
	code: number;
	reason: string;
};

class FakeBaseSocket {
	static instances: FakeBaseSocket[] = [];

	readyState = 0;
	sent: unknown[] = [];
	onopen = () => {};
	onmessage = (_event: { data: string | Buffer }) => {};
	onclose = (_event: CloseEvent) => {};
	onerror = (_error: unknown) => {};

	close = vi.fn((_code: number, _reason: string) => {
		this.readyState = 3;
	});

	send = vi.fn((data: string) => {
		this.sent.push(JSON.parse(data));
	});

	ping = vi.fn(async () => 0);

	constructor(
		_kind: 'ws' | 'bun',
		readonly url: string,
	) {
		FakeBaseSocket.instances.push(this);
	}

	open() {
		this.readyState = 1;
		this.onopen();
	}

	message(packet: unknown) {
		this.onmessage({ data: JSON.stringify(packet) });
	}

	remoteClose(event: CloseEvent) {
		this.readyState = 3;
		this.onclose(Object.create(event) as CloseEvent);
	}
}

function gatewayInfo() {
	return {
		url: 'wss://gateway.discord.gg',
		shards: 1,
		session_start_limit: {
			total: 1,
			remaining: 1,
			reset_after: 0,
			max_concurrency: 1,
		},
	};
}

function createOptions(overrides: Partial<ShardOptions> = {}): ShardOptions {
	return {
		token: 'token',
		intents: 0,
		compress: false,
		info: gatewayInfo(),
		handlePayload: vi.fn(),
		...overrides,
	} as ShardOptions;
}

function hello(heartbeatInterval = 1_000) {
	return {
		op: GatewayOpcodes.Hello,
		d: { heartbeat_interval: heartbeatInterval },
		s: null,
		t: null,
	};
}

function gatewayPacket(op: GatewayOpcodes, data: unknown = null) {
	return { op, d: data, s: null, t: null };
}

function ready(sequence = 1, sessionId = 'session-b') {
	return {
		op: GatewayOpcodes.Dispatch,
		t: GatewayDispatchEvents.Ready,
		s: sequence,
		d: {
			guilds: [],
			resume_gateway_url: 'wss://resume-b.discord.gg',
			session_id: sessionId,
		},
	};
}

async function loadLifecycleShard() {
	vi.resetModules();
	FakeBaseSocket.instances.length = 0;
	vi.doMock('../src/websocket/discord/basesocket', () => ({ BaseSocket: FakeBaseSocket }));
	vi.spyOn(Math, 'random').mockReturnValue(0.5);
	return (await import('../src/websocket/discord/shard')).Shard;
}

async function createConnectedShard(overrides: Partial<ShardOptions> = {}) {
	const LifecycleShard = await loadLifecycleShard();
	const shard = new LifecycleShard(0, createOptions(overrides));
	shard.connectTimeout.wait = vi.fn().mockResolvedValue(true);
	await shard.connect();
	const socket = FakeBaseSocket.instances.at(-1)!;
	return { shard, socket };
}

describe('gateway reconnect lifecycle', () => {
	test('a missed heartbeat ACK replaces the zombied connection after the transport stops being open', async () => {
		vi.useFakeTimers();
		const { shard, socket } = await createConnectedShard({ reconnectTimeout: 60_000 });
		vi.mocked(Math.random).mockReturnValue(0);
		socket.open();
		socket.message(hello());
		await vi.advanceTimersByTimeAsync(0);

		expect(shard.heart.ack).toBe(false);
		socket.readyState = 2;
		await vi.advanceTimersByTimeAsync(1_000);

		expect(socket.close).toHaveBeenCalledWith(
			ShardSocketCloseCodes.ZombiedConnection,
			'Heartbeat ACK was not received before the next interval',
		);
		expect(FakeBaseSocket.instances).toHaveLength(2);
	});

	test('Opcode 7 opens a replacement immediately and resumes only after its HELLO', async () => {
		vi.useFakeTimers();
		const { shard, socket: first } = await createConnectedShard({ reconnectTimeout: 60_000 });
		shard.data = {
			resume_seq: 42,
			resume_gateway_url: 'wss://resume.discord.gg',
			session_id: 'session-a',
		};
		first.open();
		first.message(gatewayPacket(GatewayOpcodes.Reconnect));
		await vi.waitFor(() => expect(FakeBaseSocket.instances).toHaveLength(2));

		expect(first.close).toHaveBeenCalledWith(ShardSocketCloseCodes.Reconnect, 'Discord requested a reconnect');
		expect(first.sent).toEqual([]);

		const second = FakeBaseSocket.instances[1]!;
		second.open();
		second.message(hello());
		await vi.waitFor(() => expect(second.sent).toHaveLength(1));

		expect(first.sent).toEqual([]);
		expect(second.sent).toEqual([expect.objectContaining({ op: GatewayOpcodes.Resume })]);
	});

	test('Opcode 7 before HELLO bypasses the per-shard connection delay', async () => {
		vi.useFakeTimers();
		const LifecycleShard = await loadLifecycleShard();
		const shard = new LifecycleShard(0, createOptions());
		const wait = vi.spyOn(shard.connectTimeout, 'wait');
		await shard.connect();
		const first = FakeBaseSocket.instances[0]!;
		first.open();

		first.message(gatewayPacket(GatewayOpcodes.Reconnect));
		await vi.waitFor(() => expect(FakeBaseSocket.instances).toHaveLength(2));
		expect(wait).toHaveBeenCalledOnce();
	});

	test('a connection timeout discards the failed resume session before retrying', async () => {
		vi.useFakeTimers();
		const LifecycleShard = await loadLifecycleShard();
		const shard = new LifecycleShard(
			0,
			createOptions({
				connectionTimeout: 30_000,
				reconnectTimeout: 10_000,
			}),
		);
		shard.data = {
			resume_seq: 42,
			resume_gateway_url: 'wss://dead-edge.discord.gg',
			session_id: 'session-a',
		};
		shard.pendingGuilds = new Set(['guild']);
		shard.connectTimeout.wait = vi.fn().mockResolvedValue(true);

		await shard.connect();
		const first = FakeBaseSocket.instances[0]!;
		expect(new URL(first.url).hostname).toBe('dead-edge.discord.gg');

		await vi.advanceTimersByTimeAsync(30_000);
		expect(first.close).toHaveBeenCalledWith(ShardSocketCloseCodes.Timeout, 'Gateway connection timed out');
		expect(shard.data.resume_seq).toBeNull();
		expect(shard.data.resume_gateway_url).toBeUndefined();
		expect(shard.data.session_id).toBeUndefined();
		expect(shard.pendingGuilds).toBeUndefined();

		await vi.advanceTimersByTimeAsync(10_000);
		expect(FakeBaseSocket.instances).toHaveLength(2);
		expect(new URL(FakeBaseSocket.instances[1]!.url).hostname).toBe('gateway.discord.gg');
	});

	test('a 1006 creates one replacement after the configured backoff and resumes', async () => {
		vi.useFakeTimers();
		const onShardDisconnect = vi.fn();
		const { shard, socket: first } = await createConnectedShard({ reconnectTimeout: 1_000, onShardDisconnect });
		shard.data = {
			resume_seq: 42,
			resume_gateway_url: 'wss://resume.discord.gg',
			session_id: 'session-a',
		};
		first.open();
		first.remoteClose({ code: 1006, reason: 'connection reset' });
		first.remoteClose({ code: 1006, reason: 'duplicate close callback' });

		expect(FakeBaseSocket.instances).toHaveLength(1);
		await vi.advanceTimersByTimeAsync(1_000);
		expect(FakeBaseSocket.instances).toHaveLength(2);

		const second = FakeBaseSocket.instances[1]!;
		expect(new URL(second.url).hostname).toBe('resume.discord.gg');
		second.open();
		second.message(hello());
		await vi.waitFor(() => expect(second.sent).toHaveLength(1));

		expect(second.sent).toEqual([expect.objectContaining({ op: GatewayOpcodes.Resume })]);
		expect(onShardDisconnect).toHaveBeenCalledOnce();
		expect(onShardDisconnect).toHaveBeenCalledWith({
			shardId: 0,
			code: 1006,
			reason: 'connection reset',
		});
	});

	test('a stale authentication cannot be sent after its socket is replaced', async () => {
		vi.useFakeTimers();
		const { shard, socket: first } = await createConnectedShard();
		shard.data = {
			resume_seq: 42,
			resume_gateway_url: 'wss://resume.discord.gg',
			session_id: 'session-a',
		};
		let release!: () => void;
		const acquire = vi
			.spyOn(shard.bucket, 'acquire')
			.mockImplementationOnce(() => new Promise<void>(resolve => (release = resolve)))
			.mockResolvedValue(undefined);
		first.open();
		const staleAuthentication = shard.resume();
		await vi.waitFor(() => expect(acquire).toHaveBeenCalledOnce());

		first.message(gatewayPacket(GatewayOpcodes.Reconnect));
		await vi.waitFor(() => expect(FakeBaseSocket.instances).toHaveLength(2));
		release();
		await vi.waitFor(() => expect(shard.offlineSendQueue).toHaveLength(1));

		const second = FakeBaseSocket.instances[1]!;
		second.open();
		second.message(hello());
		await vi.waitFor(() => expect(second.sent).toHaveLength(1));
		second.message(ready(42));
		await staleAuthentication;

		expect(first.sent).toEqual([]);
		expect(second.sent).toEqual([expect.objectContaining({ op: GatewayOpcodes.Resume })]);
	});

	test('Opcode 9 reconnects before authenticating and preserves only resumable sessions', async () => {
		vi.useFakeTimers();
		const resumable = await createConnectedShard();
		resumable.shard.data = {
			resume_seq: 42,
			resume_gateway_url: 'wss://resume.discord.gg',
			session_id: 'session-a',
		};
		resumable.socket.open();
		resumable.socket.message(gatewayPacket(GatewayOpcodes.InvalidSession, true));
		await vi.waitFor(() => expect(FakeBaseSocket.instances).toHaveLength(2));
		const resumedSocket = FakeBaseSocket.instances[1]!;
		resumedSocket.open();
		resumedSocket.message(hello());
		await vi.waitFor(() => expect(resumedSocket.sent).toHaveLength(1));
		expect(resumedSocket.sent).toEqual([expect.objectContaining({ op: GatewayOpcodes.Resume })]);

		const nonResumable = await createConnectedShard();
		nonResumable.shard.data = {
			resume_seq: 42,
			resume_gateway_url: 'wss://resume.discord.gg',
			session_id: 'session-a',
		};
		nonResumable.shard.pendingGuilds = new Set(['guild']);
		nonResumable.socket.open();
		nonResumable.socket.message(gatewayPacket(GatewayOpcodes.InvalidSession, false));
		await vi.waitFor(() => expect(FakeBaseSocket.instances).toHaveLength(2));
		expect(nonResumable.shard.data.resume_seq).toBeNull();
		expect(nonResumable.shard.data.resume_gateway_url).toBeUndefined();
		expect(nonResumable.shard.data.session_id).toBeUndefined();
		expect(nonResumable.shard.pendingGuilds).toBeUndefined();
		const identifiedSocket = FakeBaseSocket.instances[1]!;
		identifiedSocket.open();
		identifiedSocket.message(hello());
		await vi.waitFor(() => expect(identifiedSocket.sent).toHaveLength(1));
		expect(identifiedSocket.sent).toEqual([expect.objectContaining({ op: GatewayOpcodes.Identify })]);
	});

	test('late callbacks from a replaced socket cannot mutate the active lifecycle', async () => {
		vi.useFakeTimers();
		const handlePayload = vi.fn();
		const onShardDisconnect = vi.fn();
		const onShardReconnect = vi.fn();
		const { shard, socket: first } = await createConnectedShard({
			handlePayload,
			onShardDisconnect,
			onShardReconnect,
		});
		first.open();
		first.message(gatewayPacket(GatewayOpcodes.Reconnect));
		await vi.waitFor(() => expect(FakeBaseSocket.instances).toHaveLength(2));

		const second = FakeBaseSocket.instances[1]!;
		second.open();
		second.message(hello());
		await vi.waitFor(() => expect(second.sent).toHaveLength(1));
		second.message(ready(42));
		const payloadCalls = handlePayload.mock.calls.length;
		const reconnectCalls = onShardReconnect.mock.calls.length;
		const disconnectCalls = onShardDisconnect.mock.calls.length;

		first.open();
		first.message(ready(999, 'stale-session'));
		first.remoteClose({ code: 1006, reason: 'stale EOF' });

		expect(shard.websocket).toBe(second);
		expect(shard.data.resume_seq).toBe(42);
		expect(shard.data.session_id).toBe('session-b');
		expect(shard.isReady).toBe(true);
		expect(FakeBaseSocket.instances).toHaveLength(2);
		expect(handlePayload).toHaveBeenCalledTimes(payloadCalls);
		expect(onShardReconnect).toHaveBeenCalledTimes(reconnectCalls);
		expect(onShardDisconnect).toHaveBeenCalledTimes(disconnectCalls);
	});

	test.each([
		['disconnect', (shard: Shard) => shard.disconnect()],
		['close', (shard: Shard) => shard.close(ShardSocketCloseCodes.Shutdown, 'manual close')],
	] as const)('%s cancels a connection that is still waiting to start', async (_name, cancel) => {
		const LifecycleShard = await loadLifecycleShard();
		const shard = new LifecycleShard(0, createOptions());
		let release!: (value: boolean) => void;
		shard.connectTimeout.wait = vi.fn(
			() =>
				new Promise<boolean>(resolve => {
					release = resolve;
				}),
		);

		const connecting = shard.connect();
		cancel(shard);
		release(true);
		await connecting;

		expect(FakeBaseSocket.instances).toEqual([]);
		expect(shard.websocket).toBeNull();
	});

	test('canceling a reconnect backoff prevents it from replacing a newer lifecycle', async () => {
		vi.useFakeTimers();
		const { shard, socket } = await createConnectedShard({ reconnectTimeout: 1_000 });
		socket.open();

		const canceledReconnect = shard.reconnect();
		shard.disconnect();
		const replacementReconnect = shard.reconnect();
		await vi.advanceTimersByTimeAsync(1_000);
		await Promise.all([canceledReconnect, replacementReconnect]);

		expect(FakeBaseSocket.instances).toHaveLength(2);
	});

	test('an invalidated queued connect does not leave the shard permanently connecting', async () => {
		vi.useFakeTimers();
		const LifecycleShard = await loadLifecycleShard();
		const shard = new LifecycleShard(0, createOptions({ reconnectTimeout: 1_000 }));
		shard.connectTimeout.wait = vi.fn().mockResolvedValue(true);
		await shard.connect();
		const first = FakeBaseSocket.instances[0]!;
		first.open();
		first.remoteClose({ code: 1006, reason: 'connection reset' });

		let release!: (value: boolean) => void;
		shard.connectTimeout.wait = vi.fn(
			() =>
				new Promise<boolean>(resolve => {
					release = resolve;
				}),
		);
		const queuedConnect = shard.connect();
		await vi.advanceTimersByTimeAsync(1_000);
		shard.disconnect(ShardSocketCloseCodes.Resharding);
		release(true);
		await queuedConnect;

		shard.connectTimeout.wait = vi.fn().mockResolvedValue(true);
		await shard.connect();
		expect(FakeBaseSocket.instances).toHaveLength(2);
	});

	test('a direct connect supersedes an older reconnect single-flight', async () => {
		vi.useFakeTimers();
		const LifecycleShard = await loadLifecycleShard();
		const shard = new LifecycleShard(0, createOptions({ reconnectTimeout: 10_000 }));
		shard.connectTimeout.wait = vi.fn().mockResolvedValue(true);
		await shard.connect();
		const first = FakeBaseSocket.instances[0]!;
		first.open();
		first.remoteClose({ code: 1006, reason: 'first reset' });

		await shard.connect();
		const second = FakeBaseSocket.instances[1]!;
		second.open();
		second.remoteClose({ code: 1006, reason: 'second reset' });

		await vi.advanceTimersByTimeAsync(10_000);
		expect(FakeBaseSocket.instances).toHaveLength(3);
	});

	test.each([1000, ShardSocketCloseCodes.Timeout])(
		'a public close with policy code %s resets the session and reconnects',
		async code => {
			const { shard, socket } = await createConnectedShard({ reconnectTimeout: 0 });
			shard.data = {
				resume_seq: 42,
				resume_gateway_url: 'wss://resume.discord.gg',
				session_id: 'session-a',
			};
			shard.pendingGuilds = new Set(['guild']);
			socket.open();

			shard.close(code, 'public policy close');
			await vi.waitFor(() => expect(FakeBaseSocket.instances).toHaveLength(2));

			expect(shard.data.resume_seq).toBeNull();
			expect(shard.data.resume_gateway_url).toBeUndefined();
			expect(shard.data.session_id).toBeUndefined();
			expect(shard.pendingGuilds).toBeUndefined();
		},
	);

	test('a failed transport close does not finalize or replace the active socket', async () => {
		const onShardDisconnect = vi.fn();
		const { shard, socket } = await createConnectedShard({ reconnectTimeout: 0, onShardDisconnect });
		socket.close.mockImplementationOnce(() => {
			throw new RangeError('invalid close frame');
		});
		socket.open();

		await expect(shard.reconnect()).rejects.toThrow('invalid close frame');

		expect(shard.websocket).toBe(socket);
		expect(shard.isOpen).toBe(true);
		expect(FakeBaseSocket.instances).toHaveLength(1);
		expect(onShardDisconnect).not.toHaveBeenCalled();
	});

	test('a failed close preserves connection ownership while the socket is handshaking', async () => {
		const { shard, socket } = await createConnectedShard();
		socket.close.mockImplementationOnce(() => {
			throw new RangeError('invalid close frame');
		});

		expect(() => shard.close(ShardSocketCloseCodes.Reconnect, 'failed handshake close')).toThrow('invalid close frame');
		await shard.connect();

		expect(FakeBaseSocket.instances).toHaveLength(1);
		expect(shard.websocket).toBe(socket);
	});

	test('a failed public timeout reconnect preserves the active resume session', async () => {
		const { shard, socket } = await createConnectedShard({ reconnectTimeout: 0 });
		shard.data = {
			resume_seq: 42,
			resume_gateway_url: 'wss://resume.discord.gg',
			session_id: 'session-a',
		};
		shard.pendingGuilds = new Set(['guild']);
		socket.close.mockImplementationOnce(() => {
			throw new RangeError('invalid close frame');
		});
		socket.open();

		await expect(shard.reconnect(ShardSocketCloseCodes.Timeout)).rejects.toThrow('invalid close frame');

		expect(shard.data.resume_seq).toBe(42);
		expect(shard.data.resume_gateway_url).toBe('wss://resume.discord.gg');
		expect(shard.data.session_id).toBe('session-a');
		expect(shard.pendingGuilds).toEqual(new Set(['guild']));
		expect(shard.websocket).toBe(socket);
		expect(shard.isOpen).toBe(true);
	});

	test('a public timeout reconnect discards the failed resume session', async () => {
		const { shard, socket } = await createConnectedShard({ reconnectTimeout: 0 });
		shard.data = {
			resume_seq: 42,
			resume_gateway_url: 'wss://dead-edge.discord.gg',
			session_id: 'session-a',
		};
		shard.pendingGuilds = new Set(['guild']);
		socket.open();

		await shard.reconnect(ShardSocketCloseCodes.Timeout);

		expect(shard.data.resume_seq).toBeNull();
		expect(shard.data.resume_gateway_url).toBeUndefined();
		expect(shard.data.session_id).toBeUndefined();
		expect(shard.pendingGuilds).toBeUndefined();
		expect(new URL(FakeBaseSocket.instances[1]!.url).hostname).toBe('gateway.discord.gg');
	});

	test('a public local close finalizes the socket exactly once', async () => {
		const onShardDisconnect = vi.fn();
		const { shard, socket } = await createConnectedShard({ onShardDisconnect });
		socket.close.mockImplementationOnce((code, reason) => {
			socket.readyState = 3;
			socket.onclose({ code, reason });
		});
		socket.open();

		shard.close(ShardSocketCloseCodes.Reconnect, 'manual reconnect');
		await vi.waitFor(() => expect(onShardDisconnect).toHaveBeenCalledOnce());
		socket.remoteClose({ code: ShardSocketCloseCodes.Reconnect, reason: 'manual reconnect' });

		expect(socket.close).toHaveBeenCalledWith(ShardSocketCloseCodes.Reconnect, 'manual reconnect');
		expect(onShardDisconnect).toHaveBeenCalledOnce();
		expect(onShardDisconnect).toHaveBeenCalledWith({
			shardId: 0,
			code: ShardSocketCloseCodes.Reconnect,
			reason: 'manual reconnect',
		});
	});
});
