import { EventEmitter } from 'node:events';
import { describe, expect, test, vi, afterEach } from 'vitest';
import { ShardSocketCloseCodes } from '../src/websocket/discord/shared';

afterEach(() => {
	vi.clearAllTimers();
	vi.resetModules();
	vi.restoreAllMocks();
	vi.unmock('node:https');
	vi.useRealTimers();
});

describe('gateway reconnect stability', () => {
	test('disconnect closes sockets that are still handshaking', async () => {
		const { Shard } = await import('../src/websocket/discord/shard');
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
		});
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
