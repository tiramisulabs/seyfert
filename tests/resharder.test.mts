import { afterEach, describe, expect, test, vi } from 'vitest';
import { GatewayCloseCodes } from '../src/types';
import { ShardManager } from '../src/websocket/discord/sharder';

function gatewayInfo(shards = 1) {
	return {
		url: 'wss://gateway.discord.gg',
		shards,
		session_start_limit: {
			total: shards,
			remaining: shards,
			reset_after: 0,
			max_concurrency: 1,
		},
	};
}

function createManager(getInfo: () => Promise<ReturnType<typeof gatewayInfo>>) {
	const manager = new ShardManager({
		token: 'token',
		intents: 0,
		info: gatewayInfo(),
		handlePayload: vi.fn(),
		resharding: { getInfo, interval: 100, percentage: 100 },
	});
	manager.debugger = { debug: vi.fn(), error: vi.fn(), info: vi.fn() } as never;
	return manager;
}

describe('ShardManager resharder', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	test('owns one timer and does not overlap checks', async () => {
		vi.useFakeTimers();
		let release!: (info: ReturnType<typeof gatewayInfo>) => void;
		const getInfo = vi.fn(
			() =>
				new Promise<ReturnType<typeof gatewayInfo>>(resolve => {
					release = resolve;
				}),
		);
		const manager = createManager(getInfo);
		await manager.startResharder();
		await manager.startResharder();

		await vi.advanceTimersByTimeAsync(300);
		expect(getInfo).toHaveBeenCalledTimes(1);
		release(gatewayInfo());
		await Promise.resolve();
		await vi.advanceTimersByTimeAsync(100);
		expect(getInfo).toHaveBeenCalledTimes(2);

		manager.stopResharding();
		release(gatewayInfo());
		await Promise.resolve();
		await vi.advanceTimersByTimeAsync(300);
		expect(getInfo).toHaveBeenCalledTimes(2);
	});

	test('captures check failures and continues monitoring', async () => {
		vi.useFakeTimers();
		const failure = new Error('gateway unavailable');
		const getInfo = vi.fn().mockRejectedValueOnce(failure).mockResolvedValue(gatewayInfo());
		const manager = createManager(getInfo);
		await manager.startResharder();

		await vi.advanceTimersByTimeAsync(100);
		await Promise.resolve();
		expect(manager.debugger?.error).toHaveBeenCalledWith('Resharding check failed', failure);
		await vi.advanceTimersByTimeAsync(100);
		expect(getInfo).toHaveBeenCalledTimes(2);
		manager.stopResharding();
	});

	test('abandons a replacement topology when a provisional shard closes permanently', async () => {
		vi.useFakeTimers();
		const getInfo = vi.fn().mockResolvedValue(gatewayInfo(3));
		const manager = createManager(getInfo);
		const spawnShards = vi.spyOn(ShardManager.prototype, 'spawnShards').mockImplementation(async function (
			this: ShardManager,
		) {
			if (this === manager) return;
			await this.options.onShardDisconnect?.({
				shardId: 0,
				code: GatewayCloseCodes.InvalidShard,
				reason: 'invalid shard',
			});
		});
		await manager.startResharder();

		await vi.advanceTimersByTimeAsync(100);
		await vi.waitFor(() =>
			expect(manager.debugger?.error).toHaveBeenCalledWith('Resharding check failed', expect.any(Error)),
		);
		expect(manager.totalShards).toBe(1);
		expect(manager).toHaveLength(0);

		await vi.advanceTimersByTimeAsync(100);
		expect(getInfo).toHaveBeenCalledTimes(2);
		manager.stopResharding();
		spawnShards.mockRestore();
	});
});
