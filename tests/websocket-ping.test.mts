import { afterEach, describe, expect, test, vi } from 'vitest';
import { BaseSocket } from '../src/websocket/discord/basesocket';
import { SeyfertWebSocket } from '../src/websocket/discord/socket/custom';

class FakeBunWebSocket {
	readyState = 1;
	lastPing?: string;
	listeners = new Map<string, Set<(event: any) => void>>();

	addEventListener(name: string, listener: (event: any) => void) {
		const listeners = this.listeners.get(name) ?? new Set();
		listeners.add(listener);
		this.listeners.set(name, listeners);
	}

	removeEventListener(name: string, listener: (event: any) => void) {
		this.listeners.get(name)?.delete(listener);
	}

	ping(nonce: string) {
		this.lastPing = nonce;
	}

	emit(name: string, event: unknown = {}) {
		for (const listener of this.listeners.get(name) ?? []) listener(event);
	}

	send() {}
	close() {}
}

describe('websocket ping', () => {
	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	test('resolves Node ping timeouts as Infinity and clears the pending entry', async () => {
		vi.useFakeTimers();
		vi.spyOn(SeyfertWebSocket.prototype as any, 'connect').mockResolvedValue(undefined);
		const socket = new SeyfertWebSocket('wss://gateway.discord.gg');
		socket.ping = vi.fn();

		const ping = socket.waitPing();
		await vi.advanceTimersByTimeAsync(60_000);

		await expect(ping).resolves.toBe(Number.POSITIVE_INFINITY);
		expect(socket.__promises.size).toBe(0);
	});

	test('registers the Node ping waiter before sending the frame', async () => {
		vi.spyOn(SeyfertWebSocket.prototype as any, 'connect').mockResolvedValue(undefined);
		const socket = new SeyfertWebSocket('wss://gateway.discord.gg');
		socket.ping = vi.fn(id => socket.__promises.get(id)?.resolve());

		await expect(socket.waitPing()).resolves.toBeGreaterThanOrEqual(0);
		expect(socket.__promises.size).toBe(0);
	});

	test('cleans Bun pong listeners on success and rejects transport errors', async () => {
		const OriginalWebSocket = globalThis.WebSocket;
		globalThis.WebSocket = FakeBunWebSocket as never;
		try {
			const successful = new BaseSocket('bun', 'wss://gateway.discord.gg');
			const successfulInternal = (successful as any).internal as FakeBunWebSocket;
			const success = successful.ping();
			successfulInternal.emit('pong', { data: successfulInternal.lastPing });
			await expect(success).resolves.toBeGreaterThanOrEqual(0);
			expect(successfulInternal.listeners.get('pong')?.size).toBe(0);

			const failed = new BaseSocket('bun', 'wss://gateway.discord.gg');
			const failedInternal = (failed as any).internal as FakeBunWebSocket;
			const failure = failed.ping();
			failedInternal.emit('error');
			await expect(failure).rejects.toThrow(/errored/i);
			expect(failedInternal.listeners.get('pong')?.size).toBe(0);
		} finally {
			globalThis.WebSocket = OriginalWebSocket;
		}
	});

	test('cleans Bun ping resources when the transport throws synchronously', async () => {
		vi.useFakeTimers();
		const OriginalWebSocket = globalThis.WebSocket;
		globalThis.WebSocket = FakeBunWebSocket as never;
		try {
			const socket = new BaseSocket('bun', 'wss://gateway.discord.gg');
			const internal = (socket as any).internal as FakeBunWebSocket;
			const transportError = new Error('ping failed');
			vi.spyOn(internal, 'ping').mockImplementationOnce(() => {
				throw transportError;
			});

			await expect(socket.ping()).rejects.toBe(transportError);
			expect(internal.listeners.get('pong')?.size).toBe(0);
			expect(internal.listeners.get('close')?.size).toBe(0);
			expect(internal.listeners.get('error')?.size).toBe(0);
			expect(vi.getTimerCount()).toBe(0);
		} finally {
			globalThis.WebSocket = OriginalWebSocket;
		}
	});
});
