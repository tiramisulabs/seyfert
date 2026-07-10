import { describe, expect, test, vi } from 'vitest';
import { WorkerClient } from '../src/client/workerclient';
import { createPlugin } from '../src/client/plugins';
import { GatewayOpcodes, type GatewayDispatchPayload } from '../src/types';
import { ShardSocketCloseCodes, type WorkerData, type WorkerGenerationContext } from '../src/websocket/discord/shared';
import type { WorkerMessages } from '../src/websocket/discord/worker';
import { WorkerManager } from '../src/websocket/discord/workermanager';

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

function createManager() {
	const sent: { workerId: number; body: Record<string, unknown>; context?: WorkerGenerationContext }[] = [];
	const spawn = vi.fn();
	const terminate = vi.fn();
	const handlePayload = vi.fn();
	const adapter = {
		terminations: [] as WorkerGenerationContext[],
		postMessage(workerId: number, body: unknown, context?: WorkerGenerationContext) {
			sent.push({ workerId, body: body as Record<string, unknown>, context });
		},
		spawn,
		terminate(workerId: number, context?: WorkerGenerationContext) {
			if (context) this.terminations.push(context);
			return terminate(workerId, context);
		},
	};
	const manager = new WorkerManager({
		mode: 'custom',
		adapter,
		compress: false,
		handlePayload,
		info: gatewayInfo(),
		intents: 0,
		resharding: { getInfo: async () => gatewayInfo(), interval: 0, percentage: 0 },
		shardEnd: 1,
		shardStart: 0,
		shardsPerWorker: 1,
		token: 'token',
		totalShards: 1,
		workers: 1,
	});
	manager.createWorker(workerData());
	return { handlePayload, manager, sent, spawn, terminate };
}

function lifecycle<Type extends WorkerMessages['type']>(context: WorkerGenerationContext, type: Type) {
	return { ...context, type };
}

async function readyCandidate(manager: WorkerManager, context: WorkerGenerationContext) {
	await manager.handleWorkerMessage({ ...lifecycle(context, 'WORKER_GENERATION_APP_READY'), intents: 0 });
	await manager.handleWorkerMessage(lifecycle(context, 'WORKER_GENERATION_SHARDS_READY'));
}

async function armCandidate(manager: WorkerManager, context: WorkerGenerationContext) {
	const cutover = manager.beginWorkerGenerationCutover(context);
	await manager.handleWorkerMessage(lifecycle(context, 'WORKER_GENERATION_CUTOVER_READY'));
	return cutover;
}

describe('WorkerManager generations', () => {
	test('preserves in-process resharding on the active physical worker', () => {
		const { manager, sent, spawn } = createManager();
		const active = manager.getActiveWorkerGeneration(0)!;

		manager.createWorker({ ...workerData(), resharding: true, totalShards: 2 });

		expect(spawn).toHaveBeenCalledOnce();
		expect(sent.at(-1)).toMatchObject({
			context: {
				workerId: active.workerId,
				generation: active.generation,
				allocationId: active.allocationId,
			},
			body: { type: 'WORKER_ALREADY_EXISTS_RESHARDING' },
		});
	});

	test('prepares, readies, drains, activates, commits, and targets physical allocations', async () => {
		const { handlePayload, manager, sent, spawn, terminate } = createManager();
		const active = manager.getActiveWorkerGeneration(0)!;
		expect(active).toMatchObject({ generation: 0, status: 'active', shadow: false });

		const candidate = await manager.prepareWorkerGeneration(0, {
			generation: 1,
			allocationId: 'candidate-1',
		});
		expect(spawn).toHaveBeenLastCalledWith(
			expect.objectContaining({ generation: 1, allocationId: 'candidate-1', shadow: true, shards: [0] }),
			expect.any(Object),
			candidate,
		);

		await manager.handleWorkerMessage(lifecycle(candidate, 'WORKER_GENERATION_START'));
		expect(sent.at(-1)).toMatchObject({
			context: candidate,
			body: { type: 'SPAWN_SHARDS', generation: 1, allocationId: 'candidate-1' },
		});

		const ready = manager.waitForWorkerGeneration(candidate);
		await manager.handleWorkerMessage({ ...lifecycle(candidate, 'WORKER_GENERATION_APP_READY'), intents: 0 });
		expect(manager.getWorkerGeneration(candidate)).toMatchObject({ appReady: true, shardsReady: false });
		await manager.handleWorkerMessage(lifecycle(candidate, 'WORKER_GENERATION_SHARDS_READY'));
		await expect(ready).resolves.toMatchObject({ status: 'ready', appReady: true, shardsReady: true });
		await expect(armCandidate(manager, candidate)).resolves.toMatchObject({ cutoverReady: true });
		await expect(manager.activateWorkerGeneration(candidate)).rejects.toMatchObject({
			metadata: expect.objectContaining({ detail: expect.stringMatching(/Drain active worker generation/) }),
		});

		const activeContext: WorkerGenerationContext = {
			workerId: active.workerId,
			generation: active.generation,
			allocationId: active.allocationId,
		};
		manager.setCache({ get: vi.fn(async () => 'cached-during-drain') } as never);
		const drained = manager.drainWorkerGeneration(activeContext);
		expect(sent.at(-1)).toMatchObject({ context: activeContext, body: { type: 'DRAIN_WORKER_GENERATION' } });
		await expect(
			manager.handleWorkerMessage({
				...activeContext,
				type: 'CACHE_REQUEST',
				method: 'get',
				args: ['key'],
				nonce: 'drain-cache',
			}),
		).resolves.toBe(true);
		expect(sent.at(-1)).toMatchObject({
			context: activeContext,
			body: { type: 'CACHE_RESULT', nonce: 'drain-cache', result: 'cached-during-drain' },
		});
		await manager.handleWorkerMessage(lifecycle(activeContext, 'WORKER_GENERATION_DRAINED'));
		await expect(drained).resolves.toMatchObject({ status: 'drained' });

		await expect(
			manager.handleWorkerMessage({
				...activeContext,
				type: 'RECEIVE_PAYLOAD',
				shardId: 0,
				payload: { op: 0, s: 1, t: 'MESSAGE_CREATE', d: {} } as GatewayDispatchPayload,
			}),
		).resolves.toBe(false);
		expect(handlePayload).not.toHaveBeenCalled();

		const sentBeforeGapPayload = sent.length;
		const gapPayload = manager.send({ op: GatewayOpcodes.Heartbeat, d: null }, 0);
		await Promise.resolve();
		expect(sent).toHaveLength(sentBeforeGapPayload);

		const activated = manager.activateWorkerGeneration(candidate);
		expect(sent.at(-1)).toMatchObject({ context: candidate, body: { type: 'ACTIVATE_WORKER_GENERATION' } });
		await manager.handleWorkerMessage(lifecycle(candidate, 'WORKER_GENERATION_ACTIVATED'));
		await expect(activated).resolves.toMatchObject({ status: 'active' });
		expect(manager.getActiveWorkerGeneration(0)).toMatchObject(candidate);
		const flushedPayload = sent.find(
			entry => entry.context?.allocationId === candidate.allocationId && entry.body.type === 'SEND_PAYLOAD',
		)!;
		expect(flushedPayload).toBeDefined();
		await manager.handleWorkerMessage({
			...candidate,
			type: 'RESULT_PAYLOAD',
			nonce: flushedPayload.body.nonce,
		} as never);
		await expect(gapPayload).resolves.toBe(true);

		await expect(manager.commitWorkerGeneration(candidate)).resolves.toMatchObject({
			...candidate,
			status: 'active',
			shadow: false,
		});
		expect(terminate).toHaveBeenCalledWith(0, {
			workerId: active.workerId,
			generation: active.generation,
			allocationId: active.allocationId,
		});

		manager.postMessage(0, { type: 'BOT_READY' });
		expect(sent.at(-1)).toMatchObject({ context: candidate, body: { generation: 1, allocationId: 'candidate-1' } });
	});

	test('rejects invalid generation identities and timeout values before mutating a transition', async () => {
		const { manager, spawn } = createManager();
		for (const generation of [Number.NaN, 1.5, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1]) {
			await expect(
				manager.prepareWorkerGeneration(0, { generation, allocationId: 'invalid-generation' }),
			).rejects.toMatchObject({
				metadata: expect.objectContaining({ detail: expect.stringMatching(/safe integer/) }),
			});
		}
		await expect(
			manager.prepareWorkerGeneration(0, { generation: 0, allocationId: 'stale-generation' }),
		).rejects.toMatchObject({
			metadata: expect.objectContaining({ detail: expect.stringMatching(/newer than active generation/) }),
		});
		for (const allocationId of ['', '   ']) {
			await expect(manager.prepareWorkerGeneration(0, { generation: 1, allocationId })).rejects.toMatchObject({
				metadata: expect.objectContaining({ detail: expect.stringMatching(/non-empty string/) }),
			});
		}
		expect(spawn).toHaveBeenCalledOnce();

		const candidate = await manager.prepareWorkerGeneration(0, { generation: 1, allocationId: 'valid-candidate' });
		await expect(
			manager.waitForWorkerGeneration({ ...candidate, allocationId: '   ' }),
		).rejects.toMatchObject({
			metadata: expect.objectContaining({ detail: expect.stringMatching(/allocationId must be a non-empty string/) }),
		});
		await expect(manager.waitForWorkerGeneration(candidate, 'invalid' as never)).rejects.toMatchObject({
			metadata: expect.objectContaining({ detail: expect.stringMatching(/Invalid worker generation readiness/) }),
		});
		for (const timeout of [Number.NaN, 0, -1, 1.5, Number.POSITIVE_INFINITY, 2_147_483_648]) {
			await expect(manager.waitForWorkerGeneration(candidate, 'ready', timeout)).rejects.toMatchObject({
				metadata: expect.objectContaining({ detail: expect.stringMatching(/timeout must be a positive safe integer/) }),
			});
		}
		await readyCandidate(manager, candidate);
		await expect(manager.handleWorkerMessage(lifecycle(candidate, 'WORKER_GENERATION_CUTOVER_READY'))).resolves.toBe(false);
		expect(manager.getWorkerGeneration(candidate)).toMatchObject({ cutoverReady: false });
		await expect(manager.beginWorkerGenerationCutover(candidate, 0)).rejects.toMatchObject({
			metadata: expect.objectContaining({ detail: expect.stringMatching(/timeout/) }),
		});
		await expect(manager.activateWorkerGeneration(candidate, Number.NaN)).rejects.toMatchObject({
			metadata: expect.objectContaining({ detail: expect.stringMatching(/timeout/) }),
		});
		await expect(manager.drainWorkerGeneration(manager.getActiveWorkerGeneration(0)!, Number.POSITIVE_INFINITY)).rejects.toMatchObject(
			{
				metadata: expect.objectContaining({ detail: expect.stringMatching(/timeout/) }),
			},
		);
		await expect(manager.abortWorkerGeneration(candidate, 1.5)).rejects.toMatchObject({
			metadata: expect.objectContaining({ detail: expect.stringMatching(/timeout/) }),
		});
		expect(manager.getWorkerGeneration(candidate)).toMatchObject({ status: 'ready', cutoverReady: false });
	});

	test('bounds manager messages during the cutover gap and fails the next operation immediately', async () => {
		const { manager, sent } = createManager();
		manager.options.maxGenerationMessageQueueEvents = 1;
		const source = manager.getActiveWorkerGeneration(0)!;
		const candidate = await manager.prepareWorkerGeneration(0, { generation: 1, allocationId: 'queue-bound-1' });
		await readyCandidate(manager, candidate);
		await armCandidate(manager, candidate);
		const drained = manager.drainWorkerGeneration(source);

		manager.postMessage(0, { type: 'BOT_READY' });
		let overflow: unknown;
		try {
			manager.postMessage(0, { type: 'BOT_READY' });
		} catch (error) {
			overflow = error;
		}
		expect(overflow).toMatchObject({
			metadata: expect.objectContaining({ detail: expect.stringMatching(/message queue.*exceeded 1 events/) }),
		});
		await manager.handleWorkerMessage(lifecycle(source, 'WORKER_GENERATION_DRAINED'));
		await drained;
		const activated = manager.activateWorkerGeneration(candidate);
		await manager.handleWorkerMessage(lifecycle(candidate, 'WORKER_GENERATION_ACTIVATED'));
		await activated;

		expect(sent.filter(entry => entry.context?.allocationId === candidate.allocationId && entry.body.type === 'BOT_READY')).toHaveLength(
			1,
		);
	});

	test('routes self-eval traffic back to an activating candidate allocation', async () => {
		const { manager, sent } = createManager();
		const source = manager.getActiveWorkerGeneration(0)!;
		const candidate = await manager.prepareWorkerGeneration(0, { generation: 1, allocationId: 'activation-eval-1' });
		await readyCandidate(manager, candidate);
		await armCandidate(manager, candidate);
		const drained = manager.drainWorkerGeneration(source);
		await manager.handleWorkerMessage(lifecycle(source, 'WORKER_GENERATION_DRAINED'));
		await drained;
		const activated = manager.activateWorkerGeneration(candidate);

		await manager.handleWorkerMessage({
			...candidate,
			type: 'EVAL_TO_WORKER',
			toWorkerId: 0,
			nonce: 'origin-eval',
			func: '() => true',
			vars: '{}',
		});
		const request = sent.find(entry => entry.body.type === 'EXECUTE_EVAL_TO_WORKER')!;
		expect(request.context).toMatchObject(candidate);
		await manager.handleWorkerMessage({
			...candidate,
			type: 'EVAL_RESPONSE',
			nonce: request.body.nonce as string,
			response: 'ok',
		});
		await vi.waitFor(() =>
			expect(
				sent.some(
					entry =>
						entry.context?.allocationId === candidate.allocationId &&
						entry.body.type === 'EVAL_RESPONSE' &&
						entry.body.nonce === 'origin-eval',
				),
			).toBe(true),
		);

		await manager.handleWorkerMessage(lifecycle(candidate, 'WORKER_GENERATION_ACTIVATED'));
		await activated;
	});

	test('externally fencing an expired allocation rejects its stale traffic without an ACK', async () => {
		const { handlePayload, manager } = createManager();
		const active = manager.getActiveWorkerGeneration(0)!;
		const candidate = await manager.prepareWorkerGeneration(0, { generation: 1, allocationId: 'failover-1' });
		await readyCandidate(manager, candidate);
		await armCandidate(manager, candidate);

		expect(manager.fenceWorkerGeneration(active)).toMatchObject({ status: 'drained' });
		await expect(
			manager.handleWorkerMessage({
				...active,
				type: 'RECEIVE_PAYLOAD',
				shardId: 0,
				payload: { op: 0, s: 1, t: 'MESSAGE_CREATE', d: {} } as GatewayDispatchPayload,
			}),
		).resolves.toBe(false);
		await expect(
			manager.handleWorkerMessage({
				type: 'RECEIVE_PAYLOAD',
				workerId: 0,
				shardId: 0,
				payload: { op: 0, s: 1, t: 'MESSAGE_CREATE', d: {} } as GatewayDispatchPayload,
			}),
		).resolves.toBe(false);
		expect(handlePayload).not.toHaveBeenCalled();

		const activated = manager.activateWorkerGeneration(candidate);
		await manager.handleWorkerMessage(lifecycle(candidate, 'WORKER_GENERATION_ACTIVATED'));
		await expect(activated).resolves.toMatchObject({ status: 'active' });
	});

	test('externally fencing a shadow candidate aborts it and rejects readiness without another ACK', async () => {
		const { manager, terminate } = createManager();
		const candidate = await manager.prepareWorkerGeneration(0, { generation: 1, allocationId: 'expired-shadow-1' });
		const ready = manager.waitForWorkerGeneration(candidate);

		expect(manager.fenceWorkerGeneration(candidate)).toMatchObject({
			...candidate,
			status: 'aborted',
		});
		await expect(ready).rejects.toMatchObject({
			metadata: expect.objectContaining({ detail: expect.stringMatching(/externally fenced/) }),
		});
		expect(manager.getWorkerGeneration(candidate)).toBeUndefined();
		expect(manager.getActiveWorkerGeneration(0)).toMatchObject({ status: 'active' });
		expect(terminate).not.toHaveBeenCalled();
	});

	test('commits every drained predecessor after consecutive pre-commit failovers', async () => {
		const { manager, terminate } = createManager();
		const generation0 = manager.getActiveWorkerGeneration(0)!;
		const generation1 = await manager.prepareWorkerGeneration(0, { generation: 1, allocationId: 'generation-1' });
		await readyCandidate(manager, generation1);
		await armCandidate(manager, generation1);
		manager.fenceWorkerGeneration(generation0);
		const active1 = manager.activateWorkerGeneration(generation1);
		await manager.handleWorkerMessage(lifecycle(generation1, 'WORKER_GENERATION_ACTIVATED'));
		await active1;

		manager.fenceWorkerGeneration(generation1);
		const generation2 = await manager.prepareWorkerGeneration(0, { generation: 2, allocationId: 'generation-2' });
		await readyCandidate(manager, generation2);
		await armCandidate(manager, generation2);
		const active2 = manager.activateWorkerGeneration(generation2);
		await manager.handleWorkerMessage(lifecycle(generation2, 'WORKER_GENERATION_ACTIVATED'));
		await active2;
		await manager.commitWorkerGeneration(generation2);

		expect(terminate).not.toHaveBeenCalled();
	});

	test('clears shadow truth at activation even when predecessor cleanup fails', async () => {
		const { manager, terminate } = createManager();
		const source = manager.getActiveWorkerGeneration(0)!;
		const candidate = await manager.prepareWorkerGeneration(0, { generation: 1, allocationId: 'commit-retry-1' });
		await readyCandidate(manager, candidate);
		await armCandidate(manager, candidate);
		const drained = manager.drainWorkerGeneration(source);
		await manager.handleWorkerMessage(lifecycle(source, 'WORKER_GENERATION_DRAINED'));
		await drained;
		const activated = manager.activateWorkerGeneration(candidate);
		await manager.handleWorkerMessage(lifecycle(candidate, 'WORKER_GENERATION_ACTIVATED'));
		await activated;

		expect(manager.getActiveWorkerGeneration(0)).toMatchObject({ ...candidate, status: 'active', shadow: false });
		terminate.mockRejectedValueOnce(new Error('supervisor unavailable'));
		await expect(manager.commitWorkerGeneration(candidate)).rejects.toThrow('supervisor unavailable');
		expect(manager.fenceWorkerGeneration(source)).toMatchObject({ status: 'aborted' });

		const internals = manager as unknown as { hasWorkerGenerationTransition(workerId: number): boolean };
		expect(internals.hasWorkerGenerationTransition(0)).toBe(false);
		expect(manager.getActiveWorkerGeneration(0)).toMatchObject({ ...candidate, status: 'active', shadow: false });
	});

	test('keeps shadow generations out of the legacy logical-worker heartbeater', async () => {
		const { manager } = createManager();
		const active = manager.getActiveWorkerGeneration(0)!;
		const candidate = await manager.prepareWorkerGeneration(0, { generation: 1, allocationId: 'lease-owned-1' });
		const acknowledge = vi.spyOn(manager.heartbeater, 'acknowledge');

		await expect(manager.handleWorkerMessage(lifecycle(candidate, 'ACK_HEARTBEAT'))).resolves.toBe(false);
		expect(acknowledge).not.toHaveBeenCalled();
		await expect(manager.handleWorkerMessage(lifecycle(active, 'ACK_HEARTBEAT'))).resolves.toBe(true);
		expect(acknowledge).toHaveBeenCalledOnce();

		const recreate = vi.fn();
		const internals = manager as unknown as {
			recoverDeadWorkerGeneration(workerId: number, recreateWorker: () => void): Promise<void>;
		};
		await internals.recoverDeadWorkerGeneration(0, recreate);
		expect(recreate).not.toHaveBeenCalled();
		expect(manager.getActiveWorkerGeneration(0)).toMatchObject({ status: 'active' });
	});

	test('fences an unresponsive custom allocation before spawning its replacement', async () => {
		const { manager, spawn, terminate } = createManager();
		const original = manager.getActiveWorkerGeneration(0)!;
		const recreate = vi.fn(() => {
			manager.createWorker(workerData());
		});
		const internals = manager as unknown as {
			recoverDeadWorkerGeneration(workerId: number, recreateWorker: () => void): Promise<void>;
		};

		await internals.recoverDeadWorkerGeneration(0, recreate);

		expect(terminate).toHaveBeenCalledWith(0, {
			workerId: original.workerId,
			generation: original.generation,
			allocationId: original.allocationId,
		});
		expect(recreate).toHaveBeenCalledOnce();
		expect(spawn).toHaveBeenCalledTimes(2);
		expect(terminate.mock.invocationCallOrder[0]).toBeLessThan(spawn.mock.invocationCallOrder[1]);
		expect(manager.getActiveWorkerGeneration(0)).toMatchObject({ generation: 1, status: 'active' });
	});

	test('preserves an unresponsive custom allocation when supervisor fencing fails', async () => {
		const { manager, spawn, terminate } = createManager();
		const original = manager.getActiveWorkerGeneration(0)!;
		terminate.mockRejectedValueOnce(new Error('lease still owned'));
		const recreate = vi.fn();
		const internals = manager as unknown as {
			recoverDeadWorkerGeneration(workerId: number, recreateWorker: () => void): Promise<void>;
		};

		await internals.recoverDeadWorkerGeneration(0, recreate);

		expect(recreate).not.toHaveBeenCalled();
		expect(spawn).toHaveBeenCalledOnce();
		expect(manager.getActiveWorkerGeneration(0)).toMatchObject(original);
	});

	test('suspends native worker recreation during a generation transition and restores it afterwards', async () => {
		const { manager } = createManager();
		await manager.prepareWorkerGeneration(0, { generation: 1, allocationId: 'native-shadow-1' });
		(manager.options as { mode: string }).mode = 'threads';
		const recreate = vi.fn();
		const internals = manager as unknown as {
			recoverDeadWorkerGeneration(workerId: number, recreateWorker: () => void): Promise<void>;
		};

		await internals.recoverDeadWorkerGeneration(0, recreate);
		expect(recreate).not.toHaveBeenCalled();
		manager.fenceWorkerGeneration({ workerId: 0, generation: 1, allocationId: 'native-shadow-1' });
		await internals.recoverDeadWorkerGeneration(0, recreate);
		expect(recreate).toHaveBeenCalledOnce();
	});

	test('aborts candidates and surfaces asynchronous custom spawn failures', async () => {
		const { manager, sent, spawn, terminate } = createManager();
		const candidate = await manager.prepareWorkerGeneration(0, { generation: 1, allocationId: 'abort-1' });
		const aborted = manager.abortWorkerGeneration(candidate);
		expect(sent.at(-1)).toMatchObject({ context: candidate, body: { type: 'ABORT_WORKER_GENERATION' } });
		await manager.handleWorkerMessage(lifecycle(candidate, 'WORKER_GENERATION_ABORTED'));
		await expect(aborted).resolves.toMatchObject({ status: 'aborted' });
		expect(terminate).toHaveBeenCalledWith(0, candidate);
		expect(manager.getWorkerGeneration(candidate)).toBeUndefined();

		spawn.mockRejectedValueOnce(new Error('remote spawn failed'));
		const failed = { workerId: 0, generation: 2, allocationId: 'failed-2' };
		await expect(manager.prepareWorkerGeneration(0, failed)).rejects.toThrow('remote spawn failed');
		expect(manager.getWorkerGeneration(failed)).toBeUndefined();
	});

	test('terminates and forgets a candidate that reports an activation failure', async () => {
		const { manager, terminate } = createManager();
		const candidate = await manager.prepareWorkerGeneration(0, { generation: 1, allocationId: 'activation-failed-1' });
		await readyCandidate(manager, candidate);
		const activated = manager.waitForWorkerGeneration(candidate, 'active');

		await manager.handleWorkerMessage({
			...lifecycle(candidate, 'WORKER_GENERATION_FAILED'),
			message: 'plugin startup failed',
		});

		await expect(activated).rejects.toMatchObject({
			metadata: expect.objectContaining({ detail: expect.stringMatching(/plugin startup failed/) }),
		});
		expect(terminate).toHaveBeenCalledWith(0, candidate);
		expect(manager.getWorkerGeneration(candidate)).toBeUndefined();
	});

	test('lets an in-flight abort own termination when the candidate concurrently reports failure', async () => {
		const { manager, terminate } = createManager();
		const candidate = await manager.prepareWorkerGeneration(0, { generation: 1, allocationId: 'abort-failed-1' });
		const aborted = manager.abortWorkerGeneration(candidate);

		await manager.handleWorkerMessage({
			...lifecycle(candidate, 'WORKER_GENERATION_FAILED'),
			message: 'failed while aborting',
		});

		await expect(aborted).resolves.toMatchObject({ status: 'aborted' });
		expect(terminate).toHaveBeenCalledOnce();
		expect(terminate).toHaveBeenCalledWith(0, candidate);
		expect(manager.getWorkerGeneration(candidate)).toBeUndefined();
	});

	test('requires remote termination capability before preparing a custom generation', async () => {
		const { manager, spawn } = createManager();
		delete (manager.options.adapter as { terminate?: unknown }).terminate;

		await expect(manager.prepareWorkerGeneration(0)).rejects.toMatchObject({
			metadata: expect.objectContaining({ detail: expect.stringMatching(/adapter\.terminate/) }),
		});
		expect(spawn).toHaveBeenCalledOnce();
	});

	test('force-terminates and forgets a candidate when abort acknowledgement times out', async () => {
		vi.useFakeTimers();
		try {
			const { manager, terminate } = createManager();
			const candidate = await manager.prepareWorkerGeneration(0, { generation: 1, allocationId: 'abort-timeout-1' });
			const aborted = manager.abortWorkerGeneration(candidate, 10);
			const rejected = expect(aborted).rejects.toMatchObject({ code: 'WORKER_TIMEOUT' });
			await vi.advanceTimersByTimeAsync(10);

			await rejected;
			expect(terminate).toHaveBeenCalledWith(0, candidate);
			expect(manager.getWorkerGeneration(candidate)).toBeUndefined();
		} finally {
			vi.useRealTimers();
		}
	});

	test('does not double-terminate after an acknowledged abort cleanup fails', async () => {
		const { manager, terminate } = createManager();
		const candidate = await manager.prepareWorkerGeneration(0, { generation: 1, allocationId: 'abort-cleanup-1' });
		terminate.mockRejectedValueOnce(new Error('termination acknowledgement lost'));
		const aborted = manager.abortWorkerGeneration(candidate);
		await manager.handleWorkerMessage(lifecycle(candidate, 'WORKER_GENERATION_ABORTED'));

		await expect(aborted).rejects.toThrow('termination acknowledgement lost');
		expect(terminate).toHaveBeenCalledOnce();
		expect(manager.getWorkerGeneration(candidate)).toMatchObject({ status: 'aborted' });
		expect(manager.fenceWorkerGeneration(candidate)).toMatchObject({ status: 'aborted' });
		expect(manager.getWorkerGeneration(candidate)).toBeUndefined();
	});

	test('targets native heartbeats to the source while it is draining', async () => {
		const { manager, sent } = createManager();
		const source = manager.getActiveWorkerGeneration(0)!;
		const candidate = await manager.prepareWorkerGeneration(0, { generation: 1, allocationId: 'heartbeat-target-1' });
		await readyCandidate(manager, candidate);
		await armCandidate(manager, candidate);
		const drained = manager.drainWorkerGeneration(source);

		(manager as unknown as { postWorkerHeartbeat(workerId: number, message: { type: 'HEARTBEAT' }): void }).postWorkerHeartbeat(
			0,
			{ type: 'HEARTBEAT' },
		);
		expect(sent.at(-1)).toMatchObject({
			context: { workerId: source.workerId, generation: source.generation, allocationId: source.allocationId },
			body: { type: 'HEARTBEAT' },
		});
		await manager.handleWorkerMessage(lifecycle(source, 'WORKER_GENERATION_DRAINED'));
		await drained;
	});

	test('blocks generation preparation for the complete resharding check and promotion lifetime', async () => {
		const { manager } = createManager();
		let resolveInfo!: (info: ReturnType<typeof gatewayInfo>) => void;
		manager.options.resharding.getInfo = () => new Promise(resolve => (resolveInfo = resolve));
		const internals = manager as unknown as {
			checkForResharding(): Promise<unknown>;
			reshardingState: 'idle' | 'checking' | 'running';
			_info?: ReturnType<typeof gatewayInfo>;
		};
		const check = internals.checkForResharding();
		await Promise.resolve();
		await expect(manager.prepareWorkerGeneration(0)).rejects.toMatchObject({
			metadata: expect.objectContaining({ detail: expect.stringMatching(/while resharding/) }),
		});
		resolveInfo(gatewayInfo());
		await check;

		internals.reshardingState = 'running';
		internals._info = { ...gatewayInfo(), shards: 2 };
		const active = manager.getActiveWorkerGeneration(0)!;
		await manager.handleWorkerMessage(lifecycle(active, 'DISCONNECTED_ALL_SHARDS_RESHARDING'));
		await expect(manager.prepareWorkerGeneration(0)).rejects.toMatchObject({
			metadata: expect.objectContaining({ detail: expect.stringMatching(/while resharding/) }),
		});
		await manager.handleWorkerMessage(lifecycle(active, 'WORKER_RESHARDING_COMPLETE'));
		await expect(manager.prepareWorkerGeneration(0, { allocationId: 'after-reshard' })).resolves.toMatchObject({
			allocationId: 'after-reshard',
		});
	});
	});

describe('WorkerClient generation gate', () => {
	test('rejects invalid generation buffer configuration before accepting worker data', () => {
		const client = new WorkerClient();
		let error: unknown;
		try {
			client.setWorkerData({
				...workerData(),
				generation: 1,
				allocationId: 'invalid-bounds',
				shadow: true,
				maxCutoverBufferEvents: Number.NaN,
			});
		} catch (thrown) {
			error = thrown;
		}
		expect(error).toMatchObject({
			metadata: expect.objectContaining({ detail: expect.stringMatching(/maxCutoverBufferEvents/) }),
		});
	});

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
		(client as unknown as { generationApplicationStarted: boolean }).generationApplicationStarted = true;
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
			generationLifecycle: 'eager',
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

	test('rejects deferred shadows with dispatch interceptors before connecting', async () => {
		const plugin = createPlugin({
			name: 'deferred-shadow-dispatch-interceptor',
			register(api) {
				api.gateway.onDispatch((packet, next) => next(packet));
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
			allocationId: 'deferred-interceptor',
			shadow: true,
			generationLifecycle: 'deferred',
		});

		await expect(client.start()).rejects.toMatchObject({
			metadata: { detail: expect.stringMatching(/cannot use gateway dispatch interceptors/i) },
		});
		expect(messages).toHaveLength(0);
	});

	test('fails deferred activation if plugin setup adds a dispatch interceptor', async () => {
		const plugin = createPlugin({
			name: 'deferred-shadow-setup-interceptor',
			setup(_client, api) {
				api!.gateway.onDispatch((packet, next) => next(packet));
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
			allocationId: 'deferred-setup-interceptor',
			shadow: true,
			generationLifecycle: 'deferred',
		});
		const start = client.start();
		await vi.waitFor(() => expect(messages.some(message => message.type === 'WORKER_GENERATION_APP_READY')).toBe(true));
		(client as unknown as { generationShardsReady: boolean }).generationShardsReady = true;

		await client.handleManagerMessages({
			type: 'BEGIN_WORKER_GENERATION_CUTOVER',
			generation: 1,
			allocationId: 'deferred-setup-interceptor',
		});
		await client.handleManagerMessages({
			type: 'ACTIVATE_WORKER_GENERATION',
			generation: 1,
			allocationId: 'deferred-setup-interceptor',
		});

		await expect(start).rejects.toMatchObject({
			metadata: { detail: expect.stringMatching(/cannot use gateway dispatch interceptors/i) },
		});
		expect(messages.at(-1)).toMatchObject({
			type: 'WORKER_GENERATION_FAILED',
			generation: 1,
			allocationId: 'deferred-setup-interceptor',
		});
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
		const internals = client as unknown as {
			generationApplicationStarted: boolean;
			generationShardsReady: boolean;
			waitForGenerationDispatches(): Promise<void>;
		};
		internals.generationApplicationStarted = true;
		internals.generationShardsReady = true;
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
		internals.waitForGenerationDispatches = async () => {
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

	test('serializes duplicate activation commands through one application activation', async () => {
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
		const activateShadowApplication = vi.fn(() => blocked);
		const internals = client as unknown as {
			generationShardsReady: boolean;
			activateShadowApplication: typeof activateShadowApplication;
		};
		internals.generationShardsReady = true;
		internals.activateShadowApplication = activateShadowApplication;
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
		expect(activateShadowApplication).toHaveBeenCalledOnce();
		release();
		await Promise.all([first, second]);
		expect(messages.filter(message => message.type === 'WORKER_GENERATION_ACTIVATED')).toHaveLength(1);
	});

	test('fails a candidate instead of growing the cutover buffer past its configured bound', async () => {
		const messages: Record<string, unknown>[] = [];
		const client = new WorkerClient({ postMessage: body => messages.push(body as Record<string, unknown>) });
		client.logger.fatal = vi.fn();
		client.setWorkerData({
			...workerData(),
			generation: 1,
			allocationId: 'bounded-1',
			shadow: true,
			maxCutoverBufferEvents: 1,
		});
		const internals = client as unknown as {
			generationApplicationStarted: boolean;
			generationShardsReady: boolean;
		};
		internals.generationApplicationStarted = true;
		internals.generationShardsReady = true;
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
		const packet = {
			op: 0,
			s: 1,
			t: 'GUILD_DELETE',
			d: { id: 'guild-id', unavailable: true },
		} as GatewayDispatchPayload;
		await shard.options.handlePayload(0, packet);
		await shard.options.handlePayload(0, { ...packet, s: 2 });
		await shard.options.handlePayload(0, { ...packet, s: 3 });

		expect(messages.at(-1)).toMatchObject({
			type: 'WORKER_GENERATION_FAILED',
			message: expect.stringMatching(/cutover buffer exceeded 1 events/),
		});
		expect(messages.filter(message => message.type === 'WORKER_GENERATION_FAILED')).toHaveLength(1);
		await client.handleManagerMessages({
			type: 'ACTIVATE_WORKER_GENERATION',
			generation: 1,
			allocationId: 'bounded-1',
		});
		expect(messages.some(message => message.type === 'WORKER_GENERATION_ACTIVATED')).toBe(false);
	});

	test('keeps deferred start pending until lifecycle and hydration journal replay complete', async () => {
		const messages: Record<string, unknown>[] = [];
		const client = new WorkerClient({ postMessage: body => messages.push(body as Record<string, unknown>) });
		client.setWorkerData({
			...workerData(),
			generation: 1,
			allocationId: 'deferred-1',
			shadow: true,
			generationLifecycle: 'deferred',
		});
		const prepareStart = vi.fn();
		const startCacheAdapter = vi.fn();
		const startApplication = vi.fn();
		const loadEvents = vi.fn();
		const hydratePacket = vi.spyOn(client.cache, 'hydratePacket').mockResolvedValue(undefined);
		const hydratePluginPacket = vi.spyOn(client.cache, 'hydratePluginPacket').mockResolvedValue(undefined);
		const internals = client as unknown as {
			prepareStart: typeof prepareStart;
			startCacheAdapter: typeof startCacheAdapter;
			startApplication: typeof startApplication;
			loadEvents: typeof loadEvents;
			generationShardsReady: boolean;
			handleShadowPacket(shardId: number, packet: GatewayDispatchPayload): Promise<void>;
		};
		internals.prepareStart = prepareStart;
		internals.startCacheAdapter = startCacheAdapter;
		internals.startApplication = startApplication;
		internals.loadEvents = loadEvents;
		let started = false;
		const start = client.start().then(() => {
			started = true;
		});
		await vi.waitFor(() => expect(messages.some(message => message.type === 'WORKER_GENERATION_APP_READY')).toBe(true));
		expect(startApplication).not.toHaveBeenCalled();
		expect(started).toBe(false);

		const prewarmPacket = { op: 0, s: 1, t: 'CUSTOM_CACHE_EVENT', d: {} } as unknown as GatewayDispatchPayload;
		await internals.handleShadowPacket(0, prewarmPacket);
		expect(hydratePacket).toHaveBeenCalledWith(prewarmPacket);
		internals.generationShardsReady = true;
		await client.handleManagerMessages({
			type: 'BEGIN_WORKER_GENERATION_CUTOVER',
			generation: 1,
			allocationId: 'deferred-1',
		});
		await client.handleManagerMessages({
			type: 'ACTIVATE_WORKER_GENERATION',
			generation: 1,
			allocationId: 'deferred-1',
		});
		await start;
		expect(startApplication).toHaveBeenCalledOnce();
		expect(loadEvents).toHaveBeenCalledOnce();
		expect(hydratePluginPacket).toHaveBeenCalledWith(prewarmPacket);
		expect(started).toBe(true);
	});

	test('fails closed before startup when required supervisor IPC is already disconnected', () => {
		const client = new WorkerClient();
		client.setWorkerData({
			...workerData(),
			requireSupervisor: true,
		});
		const shard = client.createShard(0, {
			compress: false,
			info: gatewayInfo(),
			properties: { browser: 'test', device: 'test', os: 'test' },
		});
		client.shards.set(0, shard);
		const disconnect = vi.spyOn(shard, 'disconnect');
		const exitProcess = vi.fn();
		const install = (
			client as unknown as {
				installSupervisorFence(supervisor: unknown, exitProcess: (code: number) => void): boolean;
			}
		).installSupervisorFence;

		expect(
			install.call(client, { connected: false, once: vi.fn(), send: vi.fn() }, exitProcess),
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
				requireSupervisor: true,
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
			const internals = client as unknown as {
				supervisorMonotonicNow: () => number;
				installSupervisorFence(supervisor: unknown, exitProcess: (code: number) => void): boolean;
			};
			internals.supervisorMonotonicNow = () => monotonicNow;
			const supervisor = { connected: true, once: vi.fn(), send: vi.fn() };
			expect(internals.installSupervisorFence(supervisor, exitProcess)).toBe(true);

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
			const internals = client as unknown as {
				supervisorMonotonicNow: () => number;
				installSupervisorFence(supervisor: unknown, exitProcess: (code: number) => void): boolean;
			};
			internals.supervisorMonotonicNow = () => monotonicNow;
			internals.installSupervisorFence({ connected: true, once: vi.fn(), send: vi.fn() }, exitProcess);
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
