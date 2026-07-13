import { PhysicalWorkerPort, type PhysicalWorkerCommand } from '../src/index';
import { describe, expect, test, vi } from 'vitest';

const id = { slot: 'local-1', token: 'opaque:b' } as const;
type LocalCommand = PhysicalWorkerCommand extends infer Command
	? Command extends PhysicalWorkerCommand
		? Omit<Command, 'identity'>
		: never
	: never;
const command = (command: LocalCommand) => ({
	...command,
	identity: id,
}) as PhysicalWorkerCommand;

describe('PhysicalWorkerPort', () => {
	test('hydrates without dispatch, replays in order, drains in-flight work, and rejects stale tokens', async () => {
		const delivered: number[] = [];
		let emit!: (value: number) => void;
		let release!: () => void;
		let injectedDuringReplay = false;
		const blocked = new Promise<void>(resolve => (release = resolve));
		const port = new PhysicalWorkerPort<number>({
			adapter: {
				async launch(input) {
					emit = input.dispatch;
					return { ready: Promise.resolve(), close() {} };
				},
				async dispatch(value) {
					delivered.push(value);
					if (value === 1 && !injectedDuringReplay) {
						injectedDuringReplay = true;
						emit(3);
					}
					if (value === 4) await blocked;
				},
			},
		});

		await port.control(command({ commandId: '1', kind: 'launch', topology: { shardStart: 2, shardEnd: 4, totalShards: 8 }, maxBufferedDispatches: 8 }));
		emit(1);
		emit(2);
		await port.control(command({ commandId: '2', kind: 'hydrate', snapshot: { session: 'resume-data' } }));
		expect(delivered).toEqual([]);
		await port.control(command({ commandId: '3', kind: 'arm' }));
		const activated = await port.control(command({ commandId: '4', kind: 'activate' }));
		expect(activated).toMatchObject({ kind: 'accepted', state: 'active', replayed: 3 });
		expect(delivered).toEqual([1, 2, 3]);

		emit(4);
		const draining = port.control(command({ commandId: '5', kind: 'drain' }));
		await Promise.resolve();
		let drained = false;
		void draining.then(() => (drained = true));
		await Promise.resolve();
		expect(drained).toBe(false);
		release();
		await expect(draining).resolves.toMatchObject({ kind: 'accepted', state: 'drained' });

		await port.control(command({ commandId: '6', kind: 'close' }));
		const stale = await port.control({ commandId: '7', kind: 'arm', identity: { ...id, token: 'old' } });
		expect(stale).toMatchObject({ kind: 'rejected', reason: 'stale-token' });
	});

	test('memoizes cache-only hydration and forwards its snapshot through dispatch', async () => {
		const dispatched: Readonly<Record<string, unknown>>[] = [];
		let emit!: (value: number) => void;
		const port = new PhysicalWorkerPort<number>({
			adapter: {
				launch: async input => {
					emit = input.dispatch;
					return { ready: Promise.resolve(), close() {} };
				},
				dispatch(_value, snapshot) {
					if (snapshot) dispatched.push(snapshot);
				},
			},
		});
		await port.control(
			command({
				commandId: 'hydrate-launch',
				kind: 'launch',
				topology: { shardStart: 0, shardEnd: 1, totalShards: 1 },
				maxBufferedDispatches: 2,
			}),
		);
		const hydrateCommand = command({
			commandId: 'hydrate',
			kind: 'hydrate',
			snapshot: { dispatches: [] },
		});
		const receipt = await port.control(hydrateCommand);
		expect(await port.control(hydrateCommand)).toEqual(receipt);
		emit(1);
		await port.control(command({ commandId: 'hydrate-arm', kind: 'arm' }));
		await port.control(command({ commandId: 'hydrate-activate', kind: 'activate' }));
		expect(dispatched).toEqual([expect.objectContaining({ dispatches: [] })]);
	});

	test('is idempotent by commandId and rejects conflicting reuse', async () => {
		const port = new PhysicalWorkerPort({
			adapter: { launch: async () => ({ ready: Promise.resolve(), close() {} }), dispatch() {} },
		});
		const launch = command({ commandId: 'same', kind: 'launch', topology: { shardStart: 0, shardEnd: 1, totalShards: 1 }, maxBufferedDispatches: 1 });
		const first = await port.control(launch);
		expect(await port.control(launch)).toEqual(first);
		expect(await port.control(command({ commandId: 'same', kind: 'arm' }))).toMatchObject({ kind: 'rejected', reason: 'invalid-command' });
	});

	test('rejects malformed runtime commands without throwing before correlation', async () => {
		const launch = vi.fn(async () => ({ ready: Promise.resolve(), close() {} }));
		const port = new PhysicalWorkerPort({ adapter: { launch, dispatch() {} } });
		const circular: Record<string, unknown> = {};
		circular.self = circular;
		const malformed = [
			null,
			{},
			{ kind: 'arm', commandId: 42, identity: id },
			{ kind: 'arm', commandId: 'bad-token', identity: { slot: id.slot, token: 1 } },
			{ kind: 'hydrate', commandId: 'bad-snapshot', identity: id, snapshot: null },
			{ kind: 'hydrate', commandId: 'circular', identity: id, snapshot: circular },
		];

		for (const input of malformed) {
			await expect(port.control(input as never)).resolves.toMatchObject({
				kind: 'rejected',
				reason: 'invalid-command',
			});
		}
		await expect(
			port.control({ kind: 'arm', commandId: 'correlated', identity: { slot: id.slot, token: 1 } } as never),
		).resolves.toMatchObject({
			operation: 'arm',
			commandId: 'correlated',
			identity: { slot: id.slot, token: '' },
			reason: 'invalid-command',
		});
		expect(launch).not.toHaveBeenCalled();
	});

	test('fails closed when synchronous launch traffic exceeds the bound', async () => {
		let closes = 0;
		const port = new PhysicalWorkerPort<number>({
			adapter: {
				async launch({ dispatch }) {
					dispatch(1);
					dispatch(2);
					return { ready: Promise.resolve(), close: () => void closes++ };
				},
				dispatch() {},
			},
		});
		await expect(
			port.control(command({ commandId: 'overflow', kind: 'launch', topology: { shardStart: 0, shardEnd: 1, totalShards: 1 }, maxBufferedDispatches: 1 })),
		).resolves.toMatchObject({ kind: 'rejected', reason: 'buffer-overflow' });
		expect(closes).toBeGreaterThan(0);
	});

	test('does not report ready before the local readiness barrier resolves', async () => {
		let releaseReady!: () => void;
		const ready = new Promise<void>(resolve => (releaseReady = resolve));
		const signals: string[] = [];
		const port = new PhysicalWorkerPort({
			adapter: { launch: async () => ({ ready, close() {} }), dispatch() {} },
			onSignal: signal => signals.push(signal.kind),
		});
		let settled = false;
		const launching = port
			.control(
				command({
					commandId: 'readiness',
					kind: 'launch',
					topology: { shardStart: 0, shardEnd: 1, totalShards: 1 },
					maxBufferedDispatches: 1,
				}),
			)
			.then(receipt => {
				settled = true;
				return receipt;
			});
		await Promise.resolve();
		await Promise.resolve();
		expect(settled).toBe(false);
		expect(signals).toEqual([]);
		releaseReady();
		await expect(launching).resolves.toMatchObject({ kind: 'accepted', operation: 'launch' });
		expect(signals).toEqual(['ready']);
	});

	test('reports readiness failure before physical close can emit exit evidence', async () => {
		const events: string[] = [];
		const port = new PhysicalWorkerPort({
			adapter: {
				launch: async () => ({
					ready: Promise.reject(new Error('application readiness failed')),
					close() {
						events.push('close');
					},
				}),
				dispatch() {},
			},
			onSignal(signal) {
				if (signal.kind === 'fault') events.push(`fault:${signal.error.message}`);
			},
		});
		await expect(
			port.control(
				command({
					commandId: 'failed-readiness',
					kind: 'launch',
					topology: { shardStart: 0, shardEnd: 1, totalShards: 1 },
					maxBufferedDispatches: 1,
				}),
			),
		).rejects.toThrow('application readiness failed');
		expect(events).toEqual(['fault:application readiness failed', 'close']);
	});

	test('shares a concurrent duplicate launch without opening twice', async () => {
		let releaseReady!: () => void;
		const ready = new Promise<void>(resolve => (releaseReady = resolve));
		const launch = vi.fn(async () => ({ ready, close() {} }));
		const port = new PhysicalWorkerPort({ adapter: { launch, dispatch() {} } });
		const input = command({
			commandId: 'concurrent-launch',
			kind: 'launch',
			topology: { shardStart: 0, shardEnd: 1, totalShards: 1 },
			maxBufferedDispatches: 1,
		});
		const first = port.control(input);
		const second = port.control(input);
		await vi.waitFor(() => expect(launch).toHaveBeenCalledOnce());
		releaseReady();
		await expect(Promise.all([first, second])).resolves.toEqual([
			expect.objectContaining({ state: 'standby' }),
			expect.objectContaining({ state: 'standby' }),
		]);
		expect(launch).toHaveBeenCalledOnce();
	});

	test('captures synchronous dispatch failures as exact-token fault signals', async () => {
		let emit!: (value: number) => void;
		const signals: unknown[] = [];
		const port = new PhysicalWorkerPort<number>({
			adapter: {
				async launch(input) {
					emit = input.dispatch;
					return { ready: Promise.resolve(), close() {} };
				},
				dispatch() {
					throw new Error('sync dispatch failure');
				},
			},
			onSignal: signal => signals.push(signal),
		});
		await port.control(
			command({
				commandId: 'sync-launch',
				kind: 'launch',
				topology: { shardStart: 0, shardEnd: 1, totalShards: 1 },
				maxBufferedDispatches: 1,
			}),
		);
		await port.control(command({ commandId: 'sync-arm', kind: 'arm' }));
		await port.control(command({ commandId: 'sync-activate', kind: 'activate' }));
		expect(() => emit(1)).not.toThrow();
		await Promise.resolve();
		await Promise.resolve();
		expect(signals).toContainEqual(
			expect.objectContaining({
				kind: 'fault',
				commandId: 'sync-activate',
				identity: id,
				error: expect.objectContaining({ message: 'sync dispatch failure' }),
			}),
		);
	});

	test('closes after a failed in-flight dispatch and releases the stable slot', async () => {
		let emit!: (value: number) => void;
		const port = new PhysicalWorkerPort<number>({
			adapter: {
				async launch(input) {
					emit = input.dispatch;
					return { ready: Promise.resolve(), close() {} };
				},
				dispatch() {
					throw new Error('dispatch failed before cleanup');
				},
			},
		});
		await port.control(
			command({
				commandId: 'failed-dispatch-launch',
				kind: 'launch',
				topology: { shardStart: 0, shardEnd: 1, totalShards: 1 },
				maxBufferedDispatches: 1,
			}),
		);
		await port.control(command({ commandId: 'failed-dispatch-arm', kind: 'arm' }));
		await port.control(command({ commandId: 'failed-dispatch-activate', kind: 'activate' }));
		emit(1);
		await Promise.resolve();
		await expect(port.control(command({ commandId: 'failed-dispatch-close', kind: 'close' }))).resolves.toMatchObject({
			kind: 'accepted',
			state: 'closed',
		});
		await expect(
			port.control({
				commandId: 'replacement-launch',
				kind: 'launch',
				identity: { slot: id.slot, token: 'replacement-token' },
				topology: { shardStart: 0, shardEnd: 1, totalShards: 1 },
				maxBufferedDispatches: 1,
			}),
		).resolves.toMatchObject({ kind: 'accepted', state: 'standby' });
	});

	test('captures asynchronous dispatch failures as exact-token fault signals', async () => {
		let emit!: (value: number) => void;
		const signals: unknown[] = [];
		const port = new PhysicalWorkerPort<number>({
			adapter: {
				async launch(input) {
					emit = input.dispatch;
					return { ready: Promise.resolve(), close() {} };
				},
				async dispatch() {
					await Promise.resolve();
					throw new Error('async dispatch failure');
				},
			},
			onSignal: signal => signals.push(signal),
		});
		await port.control(
			command({
				commandId: 'async-launch',
				kind: 'launch',
				topology: { shardStart: 0, shardEnd: 1, totalShards: 1 },
				maxBufferedDispatches: 1,
			}),
		);
		await port.control(command({ commandId: 'async-arm', kind: 'arm' }));
		await port.control(command({ commandId: 'async-activate', kind: 'activate' }));
		await expect(port.control(command({ commandId: 'rejected-arm', kind: 'arm' }))).resolves.toMatchObject({
			kind: 'rejected',
			reason: 'invalid-state',
		});
		emit(1);
		await new Promise(resolve => setImmediate(resolve));
		expect(signals).toContainEqual(
			expect.objectContaining({
				kind: 'fault',
				commandId: 'async-activate',
				identity: id,
				error: expect.objectContaining({ message: 'async dispatch failure' }),
			}),
		);
	});

	test('makes concurrent close commands wait for the same physical close', async () => {
		let releaseClose!: () => void;
		const closeBarrier = new Promise<void>(resolve => (releaseClose = resolve));
		let closeCalls = 0;
		const port = new PhysicalWorkerPort({
			adapter: {
				launch: async () => ({
					ready: Promise.resolve(),
					close() {
						closeCalls++;
						return closeBarrier;
					},
				}),
				dispatch() {},
			},
		});
		await port.control(
			command({
				commandId: 'close-launch',
				kind: 'launch',
				topology: { shardStart: 0, shardEnd: 1, totalShards: 1 },
				maxBufferedDispatches: 1,
			}),
		);
		let firstSettled = false;
		let secondSettled = false;
		const firstCommand = command({ commandId: 'close-1', kind: 'close' });
		const secondCommand = command({ commandId: 'close-2', kind: 'close' });
		const first = port.control(firstCommand).then(receipt => {
			firstSettled = true;
			return receipt;
		});
		const second = port.control(secondCommand).then(receipt => {
			secondSettled = true;
			return receipt;
		});
		await Promise.resolve();
		await Promise.resolve();
		expect(closeCalls).toBe(1);
		expect([firstSettled, secondSettled]).toEqual([false, false]);
		releaseClose();
		const receipts = await Promise.all([first, second]);
		expect(receipts).toEqual([
			expect.objectContaining({ commandId: 'close-1', state: 'closed' }),
			expect.objectContaining({ commandId: 'close-2', state: 'closed' }),
		]);
		expect(await port.control(firstCommand)).toEqual(receipts[0]);
		expect(await port.control(secondCommand)).toEqual(receipts[1]);
		expect(closeCalls).toBe(1);
	});

	test('blocks slot reuse when physical close fails', async () => {
		const signals: unknown[] = [];
		const port = new PhysicalWorkerPort({
			adapter: {
				launch: async () => ({
					ready: Promise.resolve(),
					close() {
						throw new Error('close failed');
					},
				}),
				dispatch() {},
			},
			onSignal: signal => signals.push(signal),
		});
		await port.control(
			command({
				commandId: 'failed-close-launch',
				kind: 'launch',
				topology: { shardStart: 0, shardEnd: 1, totalShards: 1 },
				maxBufferedDispatches: 1,
			}),
		);
		await expect(port.control(command({ commandId: 'failed-close', kind: 'close' }))).rejects.toThrow('close failed');
		await expect(
			port.control({
				commandId: 'replacement',
				kind: 'launch',
				identity: { slot: id.slot, token: 'replacement' },
				topology: { shardStart: 0, shardEnd: 1, totalShards: 1 },
				maxBufferedDispatches: 1,
			}),
		).resolves.toMatchObject({ kind: 'rejected', reason: 'stale-token' });
		expect(signals).toContainEqual(
			expect.objectContaining({
				kind: 'fault',
				commandId: 'failed-close',
				error: expect.objectContaining({ message: 'close failed' }),
			}),
		);
	});

	test('bounds live slots and exact-retry evidence across repeated stable-slot handoffs', async () => {
		const port = new PhysicalWorkerPort({
			adapter: { launch: async () => ({ ready: Promise.resolve(), close() {} }), dispatch() {} },
		});
		let latestClose: PhysicalWorkerCommand | undefined;
		for (let index = 0; index < 320; index++) {
			const identity = { slot: 'stable-worker-0', token: `allocation-${index}` };
			const launch = {
				commandId: `launch-${index}`,
				kind: 'launch' as const,
				identity,
				topology: { shardStart: 0, shardEnd: 1, totalShards: 1 },
				maxBufferedDispatches: 4,
			};
			await expect(port.control(launch)).resolves.toMatchObject({ kind: 'accepted', state: 'standby' });
			latestClose = { commandId: `close-${index}`, kind: 'close', identity };
			const receipt = await port.control(latestClose);
			expect(await port.control(latestClose)).toEqual(receipt);
		}

		const state = port as unknown as {
			slots: ReadonlyMap<string, unknown>;
			recent: ReadonlyMap<string, unknown>;
			closedIdentities: ReadonlyMap<string, unknown>;
		};
		expect(state.slots.size).toBe(0);
		expect(state.recent.size).toBeLessThanOrEqual(256);
		expect(state.closedIdentities.size).toBeLessThanOrEqual(256);
		await expect(port.control(latestClose!)).resolves.toMatchObject({ kind: 'accepted', state: 'closed' });
		await expect(
			port.control({
				commandId: 'reuse-recent-token',
				kind: 'launch',
				identity: latestClose!.identity,
				topology: { shardStart: 0, shardEnd: 1, totalShards: 1 },
				maxBufferedDispatches: 4,
			}),
		).resolves.toMatchObject({ kind: 'rejected', reason: 'stale-token' });
		await expect(
			port.control({
				commandId: 'close-0',
				kind: 'close',
				identity: { slot: 'stable-worker-0', token: 'allocation-0' },
			}),
		).resolves.toMatchObject({ kind: 'rejected', reason: 'stale-token' });
	});

	test('close dominates replay across 128 seeded exclusive shard topologies', async () => {
		for (let seed = 0; seed < 128; seed++) {
			const totalShards = [1, 2, 8, 32][seed % 4]!;
			const shardStart = seed % totalShards;
			const shardEnd = shardStart + 1 + (seed % (totalShards - shardStart));
			const topology = { shardStart, shardEnd, totalShards };
			let emit!: (value: number) => void;
			let releaseDispatch!: () => void;
			let markStarted!: () => void;
			const blocked = new Promise<void>(resolve => (releaseDispatch = resolve));
			const started = new Promise<void>(resolve => (markStarted = resolve));
			let observedTopology: typeof topology | undefined;
			const port = new PhysicalWorkerPort<number>({
				adapter: {
					async launch(input) {
						observedTopology = { ...input.topology };
						emit = input.dispatch;
						return { ready: Promise.resolve(), close() {} };
					},
					async dispatch() {
						markStarted();
						await blocked;
					},
				},
			});

			await port.control(command({ commandId: 'launch', kind: 'launch', topology, maxBufferedDispatches: 2 }));
			expect(observedTopology, `seed ${seed}`).toEqual(topology);
			emit(seed);
			await port.control(command({ commandId: 'arm', kind: 'arm' }));
			const activating = port.control(command({ commandId: 'activate', kind: 'activate' }));
			await started;
			const closing = port.control(command({ commandId: 'close', kind: 'close' }));
			releaseDispatch();

			await expect(closing, `seed ${seed}`).resolves.toMatchObject({ kind: 'accepted', state: 'closed' });
			await expect(activating, `seed ${seed}`).resolves.toMatchObject({
				kind: 'rejected',
				reason: 'invalid-state',
			});
		}
	});
});
