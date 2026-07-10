import cluster, { type Worker as ClusterWorker } from 'node:cluster';
import { randomUUID } from 'node:crypto';
import type { Worker as WorkerThreadsWorker } from 'node:worker_threads';
import type { Awaitable } from '../../common';
import { lazyLoadPackage, SeyfertError } from '../../common';
import type { WorkerHeartbeaterMessages } from './heartbeater';
import type { ManagerMessages } from './manager-messages';
import type {
	WorkerData,
	WorkerGenerationContext,
	WorkerGenerationReadiness,
	WorkerGenerationState,
	WorkerGenerationStatus,
	WorkerGenerationTarget,
} from './shared';
import { WORKER_TIMEOUT_MS, type WorkerMessages } from './worker';

const MESSAGE_QUEUE_LIMIT = 10_000;

export type WorkerGenerationHandle = (ClusterWorker | WorkerThreadsWorker | { ready?: boolean }) & {
	ready?: boolean;
	disconnected?: boolean;
	reshardingComplete?: boolean;
	resharded?: boolean;
};

interface WorkerGenerationWaiter {
	readiness: WorkerGenerationReadiness;
	resolve(state: WorkerGenerationState): void;
	reject(error: unknown): void;
	timeout: NodeJS.Timeout;
}

interface WorkerGenerationRecord {
	context: WorkerGenerationContext;
	workerData: WorkerData;
	worker: WorkerGenerationHandle;
	status: WorkerGenerationStatus;
	appReady: boolean;
	shardsReady: boolean;
	cutoverRequested: boolean;
	cutoverReady: boolean;
	externallyFenced: boolean;
	spawnPromise: Promise<void>;
	waiters: Set<WorkerGenerationWaiter>;
}

export interface WorkerGenerationCoordinatorHost {
	readonly mode: WorkerData['mode'];
	readonly canTerminateCustomWorker: boolean;
	readonly isResharding: boolean;
	hasActiveWorker(workerId: number): boolean;
	getActiveWorker(workerId: number): WorkerGenerationHandle | undefined;
	setActiveWorker(workerId: number, worker: WorkerGenerationHandle): void;
	deleteActiveWorker(workerId: number): void;
	unregisterHeartbeat(workerId: number): void;
	spawnCustomWorker(workerData: WorkerData, env: Record<string, unknown>): Awaitable<unknown>;
	terminateCustomWorker(workerId: number, context: WorkerGenerationContext): Awaitable<unknown>;
	sendWorkerMessage(
		workerId: number,
		worker: WorkerGenerationHandle,
		message: ManagerMessages | WorkerHeartbeaterMessages,
		context?: WorkerGenerationContext,
	): void;
	handleWorkerMessage(message: WorkerMessages, source: WorkerGenerationContext): Awaitable<unknown>;
	logError(message: string, error?: unknown): void;
}

export class WorkerGenerationCoordinator {
	private readonly records = new Map<string, WorkerGenerationRecord>();
	private readonly active = new Map<number, WorkerGenerationContext>();
	private readonly previous = new Map<number, WorkerGenerationContext[]>();
	private readonly fencedWorkers = new Set<number>();
	private readonly recoveries = new Set<number>();
	private readonly messageQueues = new Map<number, (ManagerMessages | WorkerHeartbeaterMessages)[]>();
	private readonly latest = new Map<number, number>();

	constructor(private readonly host: WorkerGenerationCoordinatorHost) {}

	get(context: WorkerGenerationContext): WorkerGenerationState | undefined {
		const record = this.record(context);
		return record && this.snapshot(record);
	}

	getActive(workerId: number): WorkerGenerationState | undefined {
		const context = this.active.get(workerId);
		return context && this.get(context);
	}

	getActiveContext(workerId: number) {
		return this.active.get(workerId);
	}

	getActiveSpawnPromise(workerId: number) {
		const context = this.active.get(workerId);
		return context ? this.record(context)?.spawnPromise : undefined;
	}

	hasTransition(workerId?: number) {
		return [...this.records.values()].some(
			record =>
				(workerId === undefined || record.context.workerId === workerId) &&
				(record.workerData.shadow || !['active', 'aborted'].includes(record.status)),
		);
	}

	postMessage(workerId: number, body: ManagerMessages | WorkerHeartbeaterMessages, target?: WorkerGenerationTarget) {
		const context = this.resolveContext(workerId, target);
		const record = context ? this.record(context) : undefined;
		if (!target && record && record.status !== 'active') {
			const queue = this.messageQueues.get(workerId) ?? [];
			if (queue.length >= MESSAGE_QUEUE_LIMIT)
				throw new SeyfertError('INTERNAL_ERROR', {
					metadata: {
						detail: `Worker generation message queue for worker #${workerId} exceeded ${MESSAGE_QUEUE_LIMIT} events`,
					},
				});
			queue.push(body);
			this.messageQueues.set(workerId, queue);
			return;
		}
		const worker = target ? record?.worker : this.host.getActiveWorker(workerId);
		if (!worker) {
			this.host.logError(`Worker ${workerId} does not exists.`);
			return;
		}
		const message = context ? { ...body, generation: context.generation, allocationId: context.allocationId } : body;
		this.host.sendWorkerMessage(workerId, worker, message, context);
	}

	create(workerData: WorkerData) {
		const workerThreads = lazyLoadPackage<typeof import('node:worker_threads')>('node:worker_threads');
		if (!workerThreads)
			throw new SeyfertError('WORKER_THREADS_REQUIRED', {
				metadata: { detail: 'Cannot create worker without worker_threads.' },
			});

		const context = this.nextContext(workerData);
		const existing = this.record(context);
		if (existing) return existing.worker;
		const normalizedWorkerData: WorkerData = {
			...workerData,
			...context,
			shadow: workerData.shadow ?? false,
		};
		const env: Record<string, unknown> = { SEYFERT_SPAWNING: 'true' };
		if (normalizedWorkerData.resharding) env.SEYFERT_WORKER_RESHARDING = 'true';
		for (const name in normalizedWorkerData) {
			const data = normalizedWorkerData[name as keyof WorkerData];
			env[`SEYFERT_WORKER_${name.toUpperCase()}`] = typeof data === 'object' && data ? JSON.stringify(data) : data;
		}

		const record: WorkerGenerationRecord = {
			context,
			workerData: normalizedWorkerData,
			worker: { ready: false },
			status: normalizedWorkerData.shadow ? 'preparing' : 'active',
			appReady: false,
			shardsReady: false,
			cutoverRequested: false,
			cutoverReady: false,
			externallyFenced: false,
			spawnPromise: Promise.resolve(),
			waiters: new Set(),
		};
		this.records.set(this.key(context), record);
		if (this.host.mode === 'custom' && this.host.canTerminateCustomWorker) this.fencedWorkers.add(context.workerId);
		if (!record.workerData.shadow) this.activateRecord(record);

		try {
			switch (this.host.mode) {
				case 'threads': {
					const worker = new workerThreads.Worker(normalizedWorkerData.path, { env: env as NodeJS.ProcessEnv });
					worker.on('message', data => this.host.handleWorkerMessage(data as WorkerMessages, context));
					worker.on('error', error => this.host.logError(`[Worker #${context.workerId}]`, error));
					record.worker = worker;
					break;
				}
				case 'clusters': {
					cluster.setupPrimary({ exec: normalizedWorkerData.path });
					const worker = cluster.fork(env as NodeJS.ProcessEnv);
					worker.on('message', data => this.host.handleWorkerMessage(data as WorkerMessages, context));
					record.worker = worker;
					break;
				}
				case 'custom':
					record.spawnPromise = Promise.resolve(this.host.spawnCustomWorker(normalizedWorkerData, env)).then(
						() => undefined,
						error => {
							this.cleanupFailedSpawn(record, error);
							throw error;
						},
					);
					if (!record.workerData.shadow)
						void record.spawnPromise.catch(error =>
							this.host.logError(
								`[Worker #${context.workerId}] Failed to spawn allocation ${context.allocationId}`,
								error,
							),
						);
					break;
			}
			if (!record.workerData.shadow) this.host.setActiveWorker(context.workerId, record.worker);
			return record.worker;
		} catch (error) {
			this.cleanupFailedSpawn(record, error);
			throw error;
		}
	}

	async prepare(workerId: number, options: { generation?: number; allocationId?: string } = {}) {
		this.assertWorkerId(workerId);
		if (this.host.isResharding)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: 'Cannot prepare a worker generation while resharding' },
			});
		if (this.host.mode === 'custom' && !this.host.canTerminateCustomWorker)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: 'Custom generation transitions require adapter.terminate()' },
			});
		const activeContext = this.active.get(workerId);
		const active = activeContext && this.record(activeContext);
		if (!active)
			throw new SeyfertError('WORKER_NOT_FOUND', {
				metadata: { detail: `Cannot prepare a generation for unavailable worker #${workerId}` },
			});
		const pending = [...this.records.values()].find(
			record =>
				record.context.workerId === workerId &&
				record !== active &&
				record.workerData.shadow &&
				!['aborted', 'drained'].includes(record.status),
		);
		if (pending)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `Worker #${workerId} already has a candidate generation in ${pending.status}` },
			});

		const generation = options.generation ?? (this.latest.get(workerId) ?? active.context.generation) + 1;
		if (!Number.isSafeInteger(generation))
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `Generation ${String(generation)} must be a safe integer` },
			});
		if (generation <= active.context.generation)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: {
					detail: `Generation ${generation} must be newer than active generation ${active.context.generation}`,
				},
			});
		const allocationId = options.allocationId ?? randomUUID();
		if (typeof allocationId !== 'string' || allocationId.trim().length === 0)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: 'Worker generation allocationId must be a non-empty string' },
			});
		const context = { workerId, generation, allocationId };
		if (this.record(context))
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `Worker generation ${this.key(context)} already exists` },
			});

		this.fencedWorkers.add(workerId);
		this.create({ ...active.workerData, ...context, resharding: false, shadow: true });
		const prepared = this.record(context)!;
		try {
			await prepared.spawnPromise;
			return context;
		} catch (error) {
			prepared.status = 'aborted';
			this.notify(prepared);
			this.rejectWaiters(prepared, error);
			try {
				await this.terminate(prepared);
			} catch (terminateError) {
				this.host.logError(`Failed to clean up worker allocation ${allocationId} after spawn failure`, terminateError);
			}
			this.records.delete(this.key(context));
			throw error;
		}
	}

	wait(
		context: WorkerGenerationContext,
		readiness: WorkerGenerationReadiness = 'ready',
		timeoutMs = WORKER_TIMEOUT_MS,
	): Promise<WorkerGenerationState> {
		try {
			this.assertContext(context);
			this.assertReadiness(readiness);
			this.assertTimeout(timeoutMs);
		} catch (error) {
			return Promise.reject(error);
		}
		const record = this.record(context);
		if (!record)
			return Promise.reject(
				new SeyfertError('WORKER_NOT_FOUND', {
					metadata: { detail: `Worker generation ${this.key(context)} doesn't exist` },
				}),
			);
		if (this.reached(record, readiness)) return Promise.resolve(this.snapshot(record));
		return new Promise((resolve, reject) => {
			const waiter: WorkerGenerationWaiter = {
				readiness,
				resolve,
				reject,
				timeout: setTimeout(() => {
					record.waiters.delete(waiter);
					reject(
						new SeyfertError('WORKER_TIMEOUT', {
							metadata: { detail: `Worker generation ${this.key(context)} did not reach ${readiness}` },
						}),
					);
				}, timeoutMs),
			};
			record.waiters.add(waiter);
		});
	}

	async beginCutover(context: WorkerGenerationContext, timeoutMs = WORKER_TIMEOUT_MS) {
		const record = this.requireRecord(context, timeoutMs);
		if (record.cutoverReady) return this.snapshot(record);
		if (!record.workerData.shadow || record.status !== 'ready' || !record.appReady || !record.shardsReady)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: 'Only a ready shadow worker generation can begin cutover' },
			});
		record.cutoverRequested = true;
		this.postMessage(context.workerId, { type: 'BEGIN_WORKER_GENERATION_CUTOVER' }, context);
		return this.wait(context, 'cutover', timeoutMs);
	}

	async activate(context: WorkerGenerationContext, timeoutMs = WORKER_TIMEOUT_MS) {
		const record = this.requireRecord(context, timeoutMs);
		if (record.status === 'active') return this.snapshot(record);
		if (record.status === 'activating') {
			this.postMessage(context.workerId, { type: 'ACTIVATE_WORKER_GENERATION' }, context);
			return this.wait(context, 'active', timeoutMs);
		}
		if (record.status !== 'ready' || !record.appReady || !record.shardsReady)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `Worker generation ${this.key(context)} cannot activate before it is ready` },
			});
		if (record.workerData.shadow && !record.cutoverReady)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: 'Begin worker generation cutover before activation' },
			});
		const activeContext = this.active.get(context.workerId);
		const active = activeContext && this.record(activeContext);
		if (
			active &&
			(active.context.generation !== context.generation || active.context.allocationId !== context.allocationId) &&
			(active.status !== 'drained' || context.generation <= active.context.generation)
		)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: {
					detail:
						active.status !== 'drained'
							? `Drain active worker generation ${this.key(active.context)} before activation`
							: `Generation ${context.generation} must be newer than drained generation ${active.context.generation}`,
				},
			});
		record.status = 'activating';
		this.postMessage(context.workerId, { type: 'ACTIVATE_WORKER_GENERATION' }, context);
		return this.wait(context, 'active', timeoutMs);
	}

	async drain(context: WorkerGenerationContext, timeoutMs = WORKER_TIMEOUT_MS) {
		const record = this.requireRecord(context, timeoutMs);
		if (record.status === 'drained') return this.snapshot(record);
		if (record.status === 'draining') {
			this.postMessage(context.workerId, { type: 'DRAIN_WORKER_GENERATION' }, context);
			return this.wait(context, 'drained', timeoutMs);
		}
		if (record.status !== 'active')
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: 'Only an active worker generation can be drained' },
			});
		const unarmed = [...this.records.values()].find(
			candidate =>
				candidate.context.workerId === context.workerId &&
				candidate !== record &&
				candidate.workerData.shadow &&
				candidate.status === 'ready' &&
				!candidate.cutoverReady,
		);
		if (unarmed)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: 'Begin candidate cutover before draining the active worker generation' },
			});
		record.status = 'draining';
		this.postMessage(context.workerId, { type: 'DRAIN_WORKER_GENERATION' }, context);
		return this.wait(context, 'drained', timeoutMs);
	}

	fence(context: WorkerGenerationContext) {
		this.assertContext(context);
		const record = this.record(context);
		if (!record)
			throw new SeyfertError('WORKER_NOT_FOUND', {
				metadata: { detail: `Cannot fence unavailable worker generation ${this.key(context)}` },
			});
		const active = this.active.get(context.workerId);
		this.fencedWorkers.add(context.workerId);
		if (active?.generation !== context.generation || active.allocationId !== context.allocationId) {
			record.externallyFenced = true;
			record.status = 'aborted';
			const state = this.snapshot(record);
			this.notify(record);
			this.rejectWaiters(
				record,
				new SeyfertError('WORKER_NOT_FOUND', {
					metadata: { detail: `Worker generation ${this.key(context)} was externally fenced` },
				}),
			);
			this.records.delete(this.key(context));
			const previous = this.previous
				.get(context.workerId)
				?.filter(
					candidate => candidate.generation !== context.generation || candidate.allocationId !== context.allocationId,
				);
			if (previous?.length) this.previous.set(context.workerId, previous);
			else this.previous.delete(context.workerId);
			return state;
		}
		record.externallyFenced = true;
		record.status = 'drained';
		this.notify(record);
		return this.snapshot(record);
	}

	async abort(context: WorkerGenerationContext, timeoutMs = WORKER_TIMEOUT_MS) {
		const record = this.requireRecord(context, timeoutMs);
		const active = this.active.get(context.workerId);
		if (active?.generation === context.generation && active.allocationId === context.allocationId)
			throw new SeyfertError('INTERNAL_ERROR', { metadata: { detail: 'Cannot abort the active worker generation' } });
		if (record.status === 'aborted') {
			const state = this.snapshot(record);
			await this.terminate(record);
			this.records.delete(this.key(context));
			return state;
		}
		record.status = 'aborting';
		this.postMessage(context.workerId, { type: 'ABORT_WORKER_GENERATION' }, context);
		let state: WorkerGenerationState;
		try {
			state = await this.wait(context, 'aborted', timeoutMs);
		} catch (error) {
			try {
				await this.terminate(record);
				record.status = 'aborted';
				this.rejectWaiters(record, error);
				this.records.delete(this.key(context));
			} catch (terminateError) {
				throw new AggregateError([error, terminateError], 'Failed to force-terminate aborted worker generation');
			}
			throw error;
		}
		await this.terminate(record);
		this.records.delete(this.key(context));
		return state;
	}

	async commit(context: WorkerGenerationContext) {
		this.assertContext(context);
		const record = this.record(context);
		if (!record || record.status !== 'active')
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: 'Only the active worker generation can be committed' },
			});
		const previous = (this.previous.get(context.workerId) ?? [])
			.map(previousContext => this.record(previousContext))
			.filter(candidate => candidate !== undefined);
		if (previous.some(candidate => candidate.status !== 'drained'))
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: 'Previous worker generations must be drained before commit' },
			});
		for (const candidate of previous) {
			if (!candidate.externallyFenced) await this.terminate(candidate);
			this.records.delete(this.key(candidate.context));
		}
		this.previous.delete(context.workerId);
		return this.snapshot(record);
	}

	async recoverDead(workerId: number, recreate: () => Awaitable<void>) {
		if (this.recoveries.has(workerId)) return;
		const context = this.active.get(workerId);
		const generation = context && this.record(context);
		if (generation && this.hasTransition(workerId)) return;
		this.recoveries.add(workerId);
		try {
			const canTerminate = this.host.mode !== 'custom' || this.fencedWorkers.has(workerId);
			if (generation && context && canTerminate) {
				try {
					await this.terminate(generation);
				} catch (error) {
					this.host.logError(
						`[Worker #${workerId}] Failed to terminate unresponsive allocation ${context.allocationId}`,
						error,
					);
					return;
				}
			}
			this.host.unregisterHeartbeat(workerId);
			if (context && generation) {
				this.rejectWaiters(
					generation,
					new SeyfertError('WORKER_NOT_FOUND', {
						metadata: { detail: `Worker generation ${this.key(context)} stopped responding` },
					}),
				);
				this.records.delete(this.key(context));
			}
			this.active.delete(workerId);
			this.host.deleteActiveWorker(workerId);
			await recreate();
		} catch (error) {
			this.host.logError(`[Worker #${workerId}] Failed to recreate unresponsive worker generation`, error);
		} finally {
			this.recoveries.delete(workerId);
		}
	}

	async interceptMessage(
		message: WorkerMessages,
		source: WorkerGenerationContext | undefined,
		onAccepted: () => Awaitable<unknown>,
	): Promise<{ accepted: boolean; handled: boolean; target?: WorkerGenerationContext }> {
		const incoming = this.resolveIncoming(message, source);
		if (!incoming || !this.accepts(incoming.record, message.type)) return { accepted: false, handled: false };
		await onAccepted();
		const record = incoming.record;
		switch (message.type) {
			case 'WORKER_READY':
				if (record) {
					record.shardsReady = true;
					this.notify(record);
				}
				return { accepted: true, handled: false, target: incoming.context };
			case 'WORKER_GENERATION_APP_READY':
				if (record) {
					record.appReady = true;
					if (Number.isSafeInteger(message.intents) && message.intents >= 0)
						record.workerData.intents = message.intents;
					this.notify(record);
				}
				return { accepted: true, handled: true, target: incoming.context };
			case 'WORKER_GENERATION_SHARDS_READY':
				if (record) {
					record.shardsReady = true;
					this.notify(record);
				}
				return { accepted: true, handled: true, target: incoming.context };
			case 'WORKER_GENERATION_CUTOVER_READY':
				if (record) {
					record.cutoverReady = true;
					this.notify(record);
				}
				return { accepted: true, handled: true, target: incoming.context };
			case 'WORKER_GENERATION_FAILED':
				if (record) {
					const abortOwnsTermination = record.status === 'aborting';
					const failure = new SeyfertError('INTERNAL_ERROR', {
						metadata: { detail: `Worker generation ${this.key(record.context)} failed: ${message.message}` },
					});
					record.status = 'aborted';
					this.notify(record);
					this.rejectWaiters(record, failure);
					if (!abortOwnsTermination) {
						await this.terminate(record);
						this.records.delete(this.key(record.context));
					}
				}
				return { accepted: true, handled: true, target: incoming.context };
			case 'WORKER_GENERATION_ACTIVATED':
				if (record?.status === 'activating') {
					const previous = this.active.get(message.workerId);
					if (
						previous &&
						(previous.generation !== record.context.generation || previous.allocationId !== record.context.allocationId)
					) {
						const generations = this.previous.get(message.workerId) ?? [];
						if (
							!generations.some(
								context => context.generation === previous.generation && context.allocationId === previous.allocationId,
							)
						)
							generations.push(previous);
						this.previous.set(message.workerId, generations);
					}
					record.status = 'active';
					record.workerData.shadow = false;
					this.active.set(message.workerId, record.context);
					this.host.setActiveWorker(message.workerId, record.worker);
					this.flushMessages(message.workerId);
					this.notify(record);
				}
				return { accepted: true, handled: true, target: incoming.context };
			case 'WORKER_GENERATION_DRAINED':
				if (record?.status === 'draining') {
					record.status = 'drained';
					this.notify(record);
				}
				return { accepted: true, handled: true, target: incoming.context };
			case 'WORKER_GENERATION_ABORTED':
				if (record?.status === 'aborting') {
					record.status = 'aborted';
					this.notify(record);
					this.rejectWaiters(
						record,
						new SeyfertError('INTERNAL_ERROR', {
							metadata: { detail: `Worker generation ${this.key(record.context)} was aborted` },
						}),
					);
				}
				return { accepted: true, handled: true, target: incoming.context };
			default:
				return { accepted: true, handled: false, target: incoming.context };
		}
	}

	private resolveContext(workerId: number, target?: WorkerGenerationTarget) {
		return target ? { workerId, ...target } : this.active.get(workerId);
	}

	private resolveIncoming(message: WorkerMessages, source?: WorkerGenerationContext) {
		const { generation, allocationId } = message;
		if (source && source.workerId !== message.workerId) return;
		if (source && generation !== undefined && generation !== source.generation) return;
		if (source && allocationId !== undefined && allocationId !== source.allocationId) return;
		if ((generation === undefined) !== (allocationId === undefined)) return;
		const context =
			source ??
			(generation !== undefined && allocationId !== undefined
				? { workerId: message.workerId, generation, allocationId }
				: undefined);
		if (context) {
			const record = this.record(context);
			if (!record) return;
			return { context, record };
		}
		if (this.fencedWorkers.has(message.workerId)) return;
		const active = this.active.get(message.workerId);
		if (active) return { context: active, record: this.record(active) };
		if (this.host.hasActiveWorker(message.workerId)) return {};
		return;
	}

	private accepts(record: WorkerGenerationRecord | undefined, type: WorkerMessages['type']) {
		if (!record) return true;
		switch (type) {
			case 'WORKER_START':
				return record.status === 'preparing' || record.status === 'active';
			case 'WORKER_GENERATION_APP_READY':
				return record.status === 'preparing' || record.status === 'ready' || record.status === 'active';
			case 'WORKER_GENERATION_SHARDS_READY':
				return record.status === 'preparing' || record.status === 'ready';
			case 'WORKER_GENERATION_CUTOVER_READY':
				return record.status === 'ready' && record.cutoverRequested;
			case 'WORKER_GENERATION_FAILED':
				return record.workerData.shadow && ['preparing', 'ready', 'activating', 'aborting'].includes(record.status);
			case 'WORKER_GENERATION_ACTIVATED':
				return record.status === 'activating';
			case 'WORKER_GENERATION_DRAINED':
				return record.status === 'draining';
			case 'WORKER_GENERATION_ABORTED':
				return record.status === 'aborting';
		}
		if (record.status === 'active' || record.status === 'draining' || record.status === 'activating') return true;
		if (record.status === 'preparing' || record.status === 'ready')
			return type === 'CONNECT_QUEUE' || type === 'WORKER_API_REQUEST' || type === 'CACHE_REQUEST';
		return false;
	}

	private nextContext(workerData: WorkerData) {
		const latest = this.latest.get(workerData.workerId);
		const generation = workerData.generation ?? (latest === undefined ? 0 : latest + 1);
		const context = {
			workerId: workerData.workerId,
			generation,
			allocationId: workerData.allocationId ?? randomUUID(),
		};
		this.assertContext(context);
		this.latest.set(workerData.workerId, Math.max(latest ?? generation, generation));
		return context;
	}

	private activateRecord(record: WorkerGenerationRecord) {
		this.active.set(record.context.workerId, record.context);
		this.host.setActiveWorker(record.context.workerId, record.worker);
	}

	private cleanupFailedSpawn(record: WorkerGenerationRecord, error: unknown) {
		if (this.record(record.context) !== record) return;
		this.rejectWaiters(record, error);
		this.records.delete(this.key(record.context));
		const active = this.active.get(record.context.workerId);
		if (active?.generation === record.context.generation && active.allocationId === record.context.allocationId) {
			this.active.delete(record.context.workerId);
			this.host.deleteActiveWorker(record.context.workerId);
			this.host.unregisterHeartbeat(record.context.workerId);
		}
	}

	private async terminate(record: WorkerGenerationRecord) {
		switch (this.host.mode) {
			case 'custom':
				if (!this.host.canTerminateCustomWorker)
					throw new SeyfertError('INTERNAL_ERROR', {
						metadata: { detail: 'Custom generation transitions require adapter.terminate()' },
					});
				await this.host.terminateCustomWorker(record.context.workerId, record.context);
				break;
			case 'threads':
				await (record.worker as WorkerThreadsWorker).terminate();
				break;
			case 'clusters': {
				const worker = record.worker as ClusterWorker;
				if (worker.isDead()) break;
				await new Promise<void>((resolve, reject) => {
					const cleanup = () => {
						worker.off('exit', onExit);
						worker.off('error', onError);
					};
					const onExit = () => {
						cleanup();
						resolve();
					};
					const onError = (error: Error) => {
						cleanup();
						reject(error);
					};
					worker.once('exit', onExit);
					worker.once('error', onError);
					try {
						worker.kill('SIGKILL');
					} catch (error) {
						onError(error instanceof Error ? error : new Error(String(error)));
					}
				});
				break;
			}
		}
	}

	private flushMessages(workerId: number) {
		const queue = this.messageQueues.get(workerId);
		if (!queue) return;
		this.messageQueues.delete(workerId);
		for (const message of queue) this.postMessage(workerId, message);
	}

	private requireRecord(context: WorkerGenerationContext, timeoutMs: number) {
		this.assertContext(context);
		this.assertTimeout(timeoutMs);
		const record = this.record(context);
		if (!record)
			throw new SeyfertError('WORKER_NOT_FOUND', {
				metadata: { detail: `Worker generation ${this.key(context)} doesn't exist` },
			});
		return record;
	}

	private reached(record: WorkerGenerationRecord, readiness: WorkerGenerationReadiness) {
		switch (readiness) {
			case 'app':
				return record.appReady;
			case 'shards':
				return record.shardsReady;
			case 'ready':
				return record.appReady && record.shardsReady;
			case 'cutover':
				return record.cutoverReady;
			case 'active':
				return record.status === 'active';
			case 'drained':
				return record.status === 'drained';
			case 'aborted':
				return record.status === 'aborted';
		}
	}

	private notify(record: WorkerGenerationRecord) {
		if (record.status === 'preparing' && record.appReady && record.shardsReady) record.status = 'ready';
		for (const waiter of record.waiters) {
			if (!this.reached(record, waiter.readiness)) continue;
			clearTimeout(waiter.timeout);
			record.waiters.delete(waiter);
			waiter.resolve(this.snapshot(record));
		}
	}

	private rejectWaiters(record: WorkerGenerationRecord, error: unknown) {
		for (const waiter of record.waiters) {
			clearTimeout(waiter.timeout);
			record.waiters.delete(waiter);
			waiter.reject(error);
		}
	}

	private snapshot(record: WorkerGenerationRecord): WorkerGenerationState {
		return {
			...record.context,
			status: record.status,
			appReady: record.appReady,
			shardsReady: record.shardsReady,
			cutoverReady: record.cutoverReady,
			shadow: Boolean(record.workerData.shadow),
		};
	}

	private record(context: WorkerGenerationContext) {
		return this.records.get(this.key(context));
	}

	private key(context: WorkerGenerationContext) {
		return `${context.workerId}:${context.generation}:${context.allocationId}`;
	}

	private assertContext(context: WorkerGenerationContext) {
		this.assertWorkerId(context.workerId);
		if (!Number.isSafeInteger(context.generation) || context.generation < 0)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: 'Worker generation must be a non-negative safe integer' },
			});
		if (typeof context.allocationId !== 'string' || context.allocationId.trim().length === 0)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: 'Worker generation allocationId must be a non-empty string' },
			});
	}

	private assertWorkerId(workerId: number) {
		if (!Number.isSafeInteger(workerId) || workerId < 0)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: 'Worker generation workerId must be a non-negative safe integer' },
			});
	}

	private assertTimeout(timeoutMs: number) {
		if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 2_147_483_647)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: {
					detail: 'Worker generation timeout must be a positive safe integer no greater than 2147483647 milliseconds',
				},
			});
	}

	private assertReadiness(readiness: WorkerGenerationReadiness) {
		if (!['app', 'shards', 'ready', 'cutover', 'active', 'drained', 'aborted'].includes(readiness))
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `Invalid worker generation readiness ${String(readiness)}` },
			});
	}
}
