import { describe, expect, test, vi } from 'vitest';
import { GatewayOpcodes, type GatewaySendPayload } from '../src/types';
import { BaseSocket } from '../src/websocket/discord/basesocket';
import { Shard } from '../src/websocket/discord/shard';
import { type ShardOptions, ShardSocketCloseCodes } from '../src/websocket/discord/shared';

type BunServerWebSocket = {
	send(data: string): number;
	sendBinary(data: Uint8Array): number;
};

type BunServer = {
	port: number;
	stop(closeActiveConnections?: boolean): void;
	upgrade(request: Request): boolean;
};

type BunRuntime = {
	serve(options: {
		port: number;
		fetch(request: Request, server: BunServer): Response | undefined | Promise<Response | undefined>;
		websocket: {
			open?(socket: BunServerWebSocket): void;
			message(socket: BunServerWebSocket, data: string | Buffer): void;
		};
	}): BunServer;
};

function gatewayInfo(url: string) {
	return {
		url,
		shards: 1,
		session_start_limit: {
			total: 1,
			remaining: 1,
			reset_after: 0,
			max_concurrency: 1,
		},
	};
}

function createOptions(url: string, onShardDisconnect = vi.fn()): ShardOptions {
	return {
		token: 'token',
		intents: 0,
		compress: false,
		info: gatewayInfo(url),
		handlePayload: vi.fn(),
		onShardDisconnect,
	};
}

const bun = (globalThis as typeof globalThis & { Bun?: BunRuntime }).Bun;
const describeBun = bun ? describe : describe.skip;

describeBun('Bun native WebSocket transport', () => {
	test('BaseSocket preserves native text, binary, ping, and close behavior', async () => {
		const messages: (string | Buffer)[] = [];
		const serverMessages: string[] = [];
		const server = bun!.serve({
			port: 0,
			fetch(request, server) {
				if (server.upgrade(request)) return;
				return new Response('upgrade failed', { status: 400 });
			},
			websocket: {
				message(socket, data) {
					serverMessages.push(data.toString());
					socket.send('text-payload');
					socket.sendBinary(new Uint8Array([1, 2, 3]));
				},
			},
		});
		const socket = new BaseSocket('bun', `ws://127.0.0.1:${server.port}`);
		const opened = Promise.withResolvers<void>();
		const closed = Promise.withResolvers<{ code: number; reason: string }>();
		socket.onopen = () => opened.resolve();
		socket.onmessage = event => messages.push(event.data);
		socket.onclose = event => closed.resolve(event);

		try {
			await opened.promise;
			socket.send('client-payload');

			await vi.waitFor(() => {
				expect(serverMessages).toEqual(['client-payload']);
				expect(messages).toHaveLength(2);
			});
			expect(messages[0]).toBe('text-payload');
			expect(Buffer.isBuffer(messages[1])).toBe(true);
			expect(messages[1]).toEqual(Buffer.from([1, 2, 3]));
			await expect(socket.ping()).resolves.toBeGreaterThanOrEqual(0);

			socket.close(ShardSocketCloseCodes.Shutdown, 'native close');
			await expect(closed.promise).resolves.toMatchObject({
				code: ShardSocketCloseCodes.Shutdown,
				reason: 'native close',
			});
		} finally {
			if (socket.readyState < 2) socket.close(ShardSocketCloseCodes.Shutdown, 'test cleanup');
			server.stop(true);
		}
	});

	test('Shard completes a gateway handshake through the native transport', async () => {
		const gatewayMessages: GatewaySendPayload[] = [];
		const server = bun!.serve({
			port: 0,
			fetch(request, server) {
				if (server.upgrade(request)) return;
				return new Response('upgrade failed', { status: 400 });
			},
			websocket: {
				open(socket) {
					socket.send(
						JSON.stringify({
							op: GatewayOpcodes.Hello,
							d: { heartbeat_interval: 60_000 },
							s: null,
							t: null,
						}),
					);
				},
				message(_socket, data) {
					gatewayMessages.push(JSON.parse(data.toString()));
				},
			},
		});
		const onShardDisconnect = vi.fn();
		const shard = new Shard(0, createOptions(`ws://127.0.0.1:${server.port}`, onShardDisconnect));
		shard.connectTimeout.wait = vi.fn().mockResolvedValue(true);

		try {
			await shard.connect();
			await vi.waitFor(() => expect(gatewayMessages).toHaveLength(1));
			expect(gatewayMessages[0]).toMatchObject({
				op: GatewayOpcodes.Identify,
				d: { token: 'Bot token', compress: false },
			});
		} finally {
			shard.disconnect();
			await vi.waitFor(() => expect(onShardDisconnect).toHaveBeenCalledOnce());
			server.stop(true);
		}
	});

	test('Shard preserves its local close contract while Bun is still handshaking', async () => {
		const server = bun!.serve({
			port: 0,
			fetch() {
				return new Promise<Response>(() => {});
			},
			websocket: {
				message() {},
			},
		});
		const onShardDisconnect = vi.fn();
		const shard = new Shard(0, createOptions(`ws://127.0.0.1:${server.port}`, onShardDisconnect));
		shard.connectTimeout.wait = vi.fn().mockResolvedValue(true);
		let disconnected = false;

		try {
			await shard.connect();
			expect(shard.websocket?.readyState).toBe(0);

			shard.disconnect(ShardSocketCloseCodes.Shutdown);
			disconnected = true;
			await vi.waitFor(() => {
				expect(shard.websocket?.readyState).toBe(3);
				expect(onShardDisconnect).toHaveBeenCalledOnce();
			});

			expect(onShardDisconnect).toHaveBeenCalledWith({
				shardId: 0,
				code: ShardSocketCloseCodes.Shutdown,
				reason: 'Shard down request',
			});
		} finally {
			if (!disconnected) shard.disconnect(ShardSocketCloseCodes.Shutdown);
			server.stop(true);
		}
	});
});
