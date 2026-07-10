import cluster, { type Worker as ClusterWorker } from 'node:cluster';
import { randomUUID, type UUID } from 'node:crypto';
import type { Worker as WorkerThreadsWorker } from 'node:worker_threads';
import { ApiHandler, type CustomWorkerManagerEvents, Logger, type UsingClient, type WorkerClient } from '../..';
import { type Adapter, MemoryAdapter } from '../../cache';
import { BaseClient, type InternalRuntimeConfig } from '../../client/base';
import {
	type Awaitable,
	BASE_HOST,
	type Identify,
	lazyLoadPackage,
	MergeOptions,
	type PickPartial,
	SeyfertError,
} from '../../common';
import type { GatewayPresenceUpdateData, GatewaySendPayload, RESTGetAPIGatewayBotResult } from '../../types';
import { properties, WorkerManagerDefaults } from '../constants';
import { DynamicBucket } from '../structures';
import { ConnectQueue } from '../structures/timeout';
import { Heartbeater, type WorkerHeartbeaterMessages } from './heartbeater';
import type {
	ResolvedWorkerShardTopology,
	ShardOptions,
	WorkerData,
	WorkerGenerationContext,
	WorkerGenerationReadiness,
	WorkerGenerationState,
	WorkerGenerationStatus,
	WorkerGenerationTarget,
	WorkerManagerOptions,
} from './shared';
import { WORKER_TIMEOUT_MS, type WorkerInfo, type WorkerMessages, type WorkerShardInfo } from './worker';

type WorkerManagerConstructorOptionalKeys = 'token' | 'intents' | 'info' | 'handlePayload' | 'handleWorkerMessage';
type WorkerManagerConstructorOptions = WorkerManagerOptions extends infer Options
	? Options extends WorkerManagerOptions
		? Omit<Options, WorkerManagerConstructorOptionalKeys | 'resharding'> &
				Partial<Pick<Options, WorkerManagerConstructorOptionalKeys>> & {
					resharding?: PickPartial<NonNullable<WorkerManagerOptions['resharding']>, 'getInfo'>;
				}
		: never
	: never;

type WorkerManagerNativeOptions = Exclude<WorkerManagerOptions, { mode: 'custom' }>;
type WorkerManagerCustomOptions = Extract<WorkerManagerOptions, { mode: 'custom' }>;
type WorkerManagerRuntimeOptionalKeys = 'adapter' | 'handleWorkerMessage' | 'handlePayload' | 'getRC';
type WorkerManagerCustomRuntimeOptionalKeys = 'handleWorkerMessage' | 'handlePayload' | 'getRC';
type WorkerManagerRuntimeOptions =
	| PickPartial<Required<WorkerManagerNativeOptions>, WorkerManagerRuntimeOptionalKeys>
	| (PickPartial<Required<Omit<WorkerManagerCustomOptions, 'path'>>, WorkerManagerCustomRuntimeOptionalKeys> & {
			path?: string;
	  });

type WorkerHandle = (ClusterWorker | WorkerThreadsWorker | { ready?: boolean }) & {
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
	worker: WorkerHandle;
	status: WorkerGenerationStatus;
	appReady: boolean;
	shardsReady: boolean;
	cutoverRequested: boolean;
	cutoverReady: boolean;
	shadow: boolean;
	externallyFenced: boolean;
	spawnPromise: Promise<void>;
	waiters: Set<WorkerGenerationWaiter>;
}

export class WorkerManager extends Map<number, WorkerHandle> {
	static prepareSpaces(
		options: {
			shardStart: number;
			shardEnd: number;
			shardsPerWorker: number;
		},
		logger?: Logger,
	) {
		logger?.info('Preparing buckets');

		const chunks = DynamicBucket.chunk<number>(
			new Array(options.shardEnd - options.shardStart),
			options.shardsPerWorker,
		);

		chunks.forEach((shards, index) => {
			for (let i = 0; i < shards.length; i++) {
				const id = i + (index > 0 ? index * options.shardsPerWorker : 0) + options.shardStart;
				chunks[index][i] = id;
			}
		});

		logger?.info(`${chunks.length} buckets created`);
		return chunks;
	}

	options: WorkerManagerRuntimeOptions;
	debugger?: Logger;
	connectQueue!: ConnectQueue;
	workerQueue: (() => Awaitable<void>)[] = [];
	cacheAdapter: Adapter;
	promises = new Map<string, { resolve: (value: any) => void; timeout: NodeJS.Timeout }>();
	rest!: ApiHandler;
	reshardingWorkerQueue: (() => Awaitable<void>)[] = [];
	private _info?: RESTGetAPIGatewayBotResult;
	private reshardingState: 'idle' | 'checking' | 'running' = 'idle';
	heartbeater: Heartbeater;
	private workerGenerations = new Map<string, WorkerGenerationRecord>();
	private activeWorkerGenerations = new Map<number, WorkerGenerationContext>();
	private previousWorkerGenerations = new Map<number, WorkerGenerationContext[]>();
	private generationFencing = new Set<number>();
	private generationRecoveries = new Set<number>();
	private generationMessageQueues = new Map<number, (ManagerMessages | WorkerHeartbeaterMessages)[]>();
	private latestWorkerGenerations = new Map<number, number>();
	private shardTopologyResolution?: Promise<ResolvedWorkerShardTopology>;
	private startPromise?: Promise<void>;

	constructor(options: WorkerManagerConstructorOptions) {
		super();
		// The constructor permits runtime config values that start() fills before use.
		this.options = { mode: 'threads', ...options } as WorkerManager['options'];
		this.cacheAdapter = new MemoryAdapter();

		this.heartbeater = new Heartbeater(
			(workerId, message) => this.postWorkerHeartbeat(workerId, message),
			options.heartbeaterInterval ?? 15e3,
		);
	}

	setCache(adapter: Adapter) {
		this.cacheAdapter = adapter;
	}

	setRest(rest: ApiHandler) {
		this.rest = rest;
	}

	get remaining() {
		return this.options.info.session_start_limit.remaining;
	}

	get concurrency() {
		return this.options.info.session_start_limit.max_concurrency;
	}

	get totalWorkers() {
		return this.options.workers;
	}

	get totalShards() {
		return this.options.totalShards ?? this.options.info.shards;
	}

	get shardStart() {
		return this.options.shardStart ?? 0;
	}

	get shardEnd() {
		return this.options.shardEnd ?? this.totalShards;
	}

	get shardsPerWorker() {
		return this.options.shardsPerWorker;
	}

	async syncLatency({
		shardId,
		workerId,
	}: { shardId: number; workerId?: number } | { shardId?: number; workerId: number }) {
		if (typeof shardId !== 'number' && typeof workerId !== 'number') {
			throw new SeyfertError('WORKER_AND_SHARD_ID_REQUIRED', {
				metadata: { ...{ shardId, workerId }, detail: 'Undefined workerId and shardId' },
			});
		}

		const id = workerId ?? this.calculateWorkerId(shardId!);

		if (!this.has(id)) {
			throw new SeyfertError('WORKER_NOT_FOUND', {
				metadata: { ...{ workerId: id }, detail: `Worker #${id} doesn't exist` },
			});
		}

		const data = await this.getWorkerInfo(id);
		if (!data.shards.length) return 0;

		return data.shards.reduce((acc, prv) => acc + prv.latency, 0) / data.shards.length;
	}

	calculateShardId(guildId: string) {
		return Number((BigInt(guildId) >> 22n) % BigInt(this.totalShards));
	}

	calculateWorkerId(shardId: number) {
		if (shardId < this.shardStart || shardId >= this.shardEnd) {
			throw new SeyfertError('INVALID_SHARD_ID', {
				metadata: {
					...{
						shardId,
						shardStart: this.shardStart,
						shardEnd: this.shardEnd,
						shardsPerWorker: this.shardsPerWorker,
						totalWorkers: this.totalWorkers,
					},
					detail: 'Invalid shardId',
				},
			});
		}
		const workerId = Math.floor((shardId - this.shardStart) / this.shardsPerWorker);
		if (workerId >= this.totalWorkers) {
			throw new SeyfertError('INVALID_SHARD_ID', {
				metadata: {
					...{
						shardId,
						shardStart: this.shardStart,
						shardsPerWorker: this.shardsPerWorker,
						totalWorkers: this.totalWorkers,
					},
					detail: 'Invalid shardId',
				},
			});
		}
		return workerId;
	}

	private generationKey(context: WorkerGenerationContext) {
		return `${context.workerId}:${context.generation}:${context.allocationId}`;
	}

	private assertWorkerId(workerId: number) {
		if (!Number.isSafeInteger(workerId) || workerId < 0)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `Worker generation workerId must be a non-negative safe integer` },
			});
	}

	private assertWorkerGenerationContext(context: WorkerGenerationContext) {
		this.assertWorkerId(context.workerId);
		if (!Number.isSafeInteger(context.generation) || context.generation < 0)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `Worker generation must be a non-negative safe integer` },
			});
		if (typeof context.allocationId !== 'string' || context.allocationId.trim().length === 0)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `Worker generation allocationId must be a non-empty string` },
			});
	}

	private generationContext(workerData: WorkerData): WorkerGenerationContext {
		const latest = this.latestWorkerGenerations.get(workerData.workerId);
		const generation = workerData.generation ?? (latest === undefined ? 0 : latest + 1);
		const context = {
			workerId: workerData.workerId,
			generation,
			allocationId: workerData.allocationId ?? randomUUID(),
		};
		this.assertWorkerGenerationContext(context);
		this.latestWorkerGenerations.set(workerData.workerId, Math.max(latest ?? generation, generation));
		return context;
	}

	private getWorkerGenerationRecord(context: WorkerGenerationContext) {
		return this.workerGenerations.get(this.generationKey(context));
	}

	private snapshotWorkerGeneration(record: WorkerGenerationRecord): WorkerGenerationState {
		return {
			...record.context,
			status: record.status,
			appReady: record.appReady,
			shardsReady: record.shardsReady,
			cutoverReady: record.cutoverReady,
			shadow: record.shadow,
		};
	}

	getWorkerGeneration(context: WorkerGenerationContext): WorkerGenerationState | undefined {
		const record = this.getWorkerGenerationRecord(context);
		return record && this.snapshotWorkerGeneration(record);
	}

	getActiveWorkerGeneration(workerId: number): WorkerGenerationState | undefined {
		const context = this.activeWorkerGenerations.get(workerId);
		return context && this.getWorkerGeneration(context);
	}

	private readinessReached(record: WorkerGenerationRecord, readiness: WorkerGenerationReadiness) {
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

	private notifyWorkerGeneration(record: WorkerGenerationRecord) {
		if (record.status === 'preparing' && record.appReady && record.shardsReady) record.status = 'ready';
		for (const waiter of record.waiters) {
			if (!this.readinessReached(record, waiter.readiness)) continue;
			clearTimeout(waiter.timeout);
			record.waiters.delete(waiter);
			waiter.resolve(this.snapshotWorkerGeneration(record));
		}
	}

	private rejectWorkerGenerationWaiters(record: WorkerGenerationRecord, error: unknown) {
		for (const waiter of record.waiters) {
			clearTimeout(waiter.timeout);
			record.waiters.delete(waiter);
			waiter.reject(error);
		}
	}

	private assertWorkerGenerationTimeout(timeoutMs: number) {
		if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 2_147_483_647)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: {
					detail: `Worker generation timeout must be a positive safe integer no greater than 2147483647 milliseconds`,
				},
			});
	}

	private assertWorkerGenerationReadiness(readiness: WorkerGenerationReadiness) {
		if (!['app', 'shards', 'ready', 'cutover', 'active', 'drained', 'aborted'].includes(readiness))
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `Invalid worker generation readiness ${String(readiness)}` },
			});
	}

	waitForWorkerGeneration(
		context: WorkerGenerationContext,
		readiness: WorkerGenerationReadiness = 'ready',
		timeoutMs = WORKER_TIMEOUT_MS,
	): Promise<WorkerGenerationState> {
		try {
			this.assertWorkerGenerationContext(context);
			this.assertWorkerGenerationReadiness(readiness);
			this.assertWorkerGenerationTimeout(timeoutMs);
		} catch (error) {
			return Promise.reject(error);
		}
		const record = this.getWorkerGenerationRecord(context);
		if (!record)
			return Promise.reject(
				new SeyfertError('WORKER_NOT_FOUND', {
					metadata: { detail: `Worker generation ${this.generationKey(context)} doesn't exist` },
				}),
			);
		if (this.readinessReached(record, readiness)) return Promise.resolve(this.snapshotWorkerGeneration(record));

		return new Promise((resolve, reject) => {
			const waiter: WorkerGenerationWaiter = {
				readiness,
				resolve,
				reject,
				timeout: setTimeout(() => {
					record.waiters.delete(waiter);
					reject(
						new SeyfertError('WORKER_TIMEOUT', {
							metadata: { detail: `Worker generation ${this.generationKey(context)} did not reach ${readiness}` },
						}),
					);
				}, timeoutMs),
			};
			record.waiters.add(waiter);
		});
	}

	private resolveWorkerGenerationContext(workerId: number, target?: WorkerGenerationTarget) {
		return target ? { workerId, ...target } : this.activeWorkerGenerations.get(workerId);
	}

	private postWorkerHeartbeat(workerId: number, message: WorkerHeartbeaterMessages) {
		const active = this.activeWorkerGenerations.get(workerId);
		return this.postMessage(workerId, message, active);
	}

	postMessage(id: number, body: ManagerMessages | WorkerHeartbeaterMessages, target?: WorkerGenerationTarget) {
		const context = this.resolveWorkerGenerationContext(id, target);
		const record = context ? this.getWorkerGenerationRecord(context) : undefined;
		if (!target && record && record.status !== 'active') {
			const queue = this.generationMessageQueues.get(id) ?? [];
			const maximum = this.options.maxGenerationMessageQueueEvents ?? 10_000;
			if (!Number.isSafeInteger(maximum) || maximum <= 0)
				throw new SeyfertError('INTERNAL_ERROR', {
					metadata: { detail: `maxGenerationMessageQueueEvents must be a positive safe integer` },
				});
			if (queue.length >= maximum)
				throw new SeyfertError('INTERNAL_ERROR', {
					metadata: {
						detail: `Worker generation message queue for worker #${id} exceeded ${maximum} events`,
					},
				});
			queue.push(body);
			this.generationMessageQueues.set(id, queue);
			return;
		}
		const worker = target ? record?.worker : this.get(id);
		if (!worker) return this.debugger?.error(`Worker ${id} does not exists.`);
		const message = context ? { ...body, generation: context.generation, allocationId: context.allocationId } : body;
		switch (this.options.mode) {
			case 'clusters':
				if ((worker as ClusterWorker).isConnected()) (worker as ClusterWorker).send(message);
				break;
			case 'threads':
				(worker as import('worker_threads').Worker).postMessage(message);
				break;
			case 'custom':
				try {
					void Promise.resolve(this.options.adapter.postMessage(id, message, context)).catch(error => {
						this.debugger?.error(
							`[Worker #${id}] Failed to post to allocation ${context?.allocationId ?? 'legacy'}`,
							error,
						);
					});
				} catch (error) {
					this.debugger?.error(
						`[Worker #${id}] Failed to post to allocation ${context?.allocationId ?? 'legacy'}`,
						error,
					);
				}
				break;
		}
	}

	private flushWorkerGenerationMessages(workerId: number) {
		const queue = this.generationMessageQueues.get(workerId);
		if (!queue) return;
		this.generationMessageQueues.delete(workerId);
		for (const message of queue) this.postMessage(workerId, message);
	}

	private hasWorkerGenerationTransition(workerId?: number) {
		return [...this.workerGenerations.values()].some(
			record =>
				(workerId === undefined || record.context.workerId === workerId) &&
				(record.shadow || !['active', 'aborted'].includes(record.status)),
		);
	}

	private async recoverDeadWorkerGeneration(workerId: number, recreate: () => Awaitable<void>) {
		if (this.generationRecoveries.has(workerId)) return;
		const context = this.activeWorkerGenerations.get(workerId);
		const generation = context && this.getWorkerGenerationRecord(context);
		if (generation && this.hasWorkerGenerationTransition(workerId)) return;
		this.generationRecoveries.add(workerId);
		try {
			if (this.options.mode === 'custom' && this.generationFencing.has(workerId) && generation && context) {
				if (!this.options.adapter.terminate) return;
				try {
					// A successful supervisor termination acknowledgement is the fencing proof.
					// Never create a replacement while the previous allocation may still be alive.
					await this.options.adapter.terminate(workerId, context);
				} catch (error) {
					this.debugger?.error(
						`[Worker #${workerId}] Failed to fence unresponsive allocation ${context.allocationId}`,
						error,
					);
					return;
				}
			}
			this.heartbeater.unregister(workerId);
			if (context && generation) {
				this.rejectWorkerGenerationWaiters(
					generation,
					new SeyfertError('WORKER_NOT_FOUND', {
						metadata: { detail: `Worker generation ${this.generationKey(context)} stopped responding` },
					}),
				);
				this.workerGenerations.delete(this.generationKey(context));
			}
			this.activeWorkerGenerations.delete(workerId);
			this.delete(workerId);
			await recreate();
		} catch (error) {
			this.debugger?.error(`[Worker #${workerId}] Failed to recreate unresponsive worker generation`, error);
		} finally {
			this.generationRecoveries.delete(workerId);
		}
	}

	prepareWorkers(shards: number[][], rawResharding = false) {
		const worker_threads = lazyLoadPackage<typeof import('node:worker_threads')>('node:worker_threads');
		if (!worker_threads)
			throw new SeyfertError('WORKER_THREADS_REQUIRED', {
				metadata: { detail: 'Cannot prepare workers without worker_threads.' },
			});

		for (let i = 0; i < shards.length; i++) {
			const registerWorker = (resharding: boolean) => {
				const worker = this.createWorker({
					path: this.options.path ?? '',
					debug: this.options.debug,
					token: this.options.token,
					shards: shards[i],
					intents: this.options.intents,
					workerId: i,
					workerProxy: this.options.workerProxy,
					totalShards: resharding ? this._info!.shards : this.totalShards,
					mode: this.options.mode,
					resharding,
					totalWorkers: shards.length,
					info: {
						...this.options.info,
						shards: this.totalShards,
					},
					compress: this.options.compress,
					generationLifecycle: this.options.generationLifecycle,
					maxCutoverBufferEvents: this.options.maxCutoverBufferEvents,
					maxShadowHydrationEvents: this.options.maxShadowHydrationEvents,
				});
				this.set(i, worker);
				const context = this.activeWorkerGenerations.get(i);
				return {
					workerId: i,
					spawnPromise: context ? this.getWorkerGenerationRecord(context)?.spawnPromise : undefined,
				};
			};
			const registerWorkerHeartbeat = (workerId: number, resharding: boolean) => {
				this.heartbeater.register(workerId, deadWorkerId => {
					return this.recoverDeadWorkerGeneration(deadWorkerId, async () => {
						const replacement = registerWorker(resharding);
						registerWorkerHeartbeat(replacement.workerId, resharding);
						await replacement.spawnPromise;
					});
				});
			};
			const workerExists = this.has(i);
			if (rawResharding || !workerExists) {
				this[rawResharding ? 'reshardingWorkerQueue' : 'workerQueue'].push(async () => {
					const registered = registerWorker(rawResharding);
					registerWorkerHeartbeat(registered.workerId, rawResharding);
					await registered.spawnPromise;
				});
			}
		}
	}

	createWorker(workerData: WorkerData) {
		if (this.has(workerData.workerId) && !workerData.shadow) {
			if (workerData.resharding) {
				this.postMessage(workerData.workerId, {
					type: 'WORKER_ALREADY_EXISTS_RESHARDING',
				} satisfies ManagerWorkerAlreadyExistsResharding);
			}
			const worker = this.get(workerData.workerId)!;
			return worker;
		}

		const worker_threads = lazyLoadPackage<typeof import('node:worker_threads')>('node:worker_threads');
		if (!worker_threads)
			throw new SeyfertError('WORKER_THREADS_REQUIRED', {
				metadata: { detail: 'Cannot create worker without worker_threads.' },
			});

		const context = this.generationContext(workerData);
		const existing = this.getWorkerGenerationRecord(context);
		if (existing) return existing.worker;
		const normalizedWorkerData: WorkerData = {
			...workerData,
			generation: context.generation,
			allocationId: context.allocationId,
			shadow: workerData.shadow ?? false,
		};
		const env: Record<string, any> = {
			SEYFERT_SPAWNING: 'true',
		};
		if (normalizedWorkerData.resharding) env.SEYFERT_WORKER_RESHARDING = 'true';
		for (const i in normalizedWorkerData) {
			const data = normalizedWorkerData[i as keyof WorkerData];
			env[`SEYFERT_WORKER_${i.toUpperCase()}`] = typeof data === 'object' && data ? JSON.stringify(data) : data;
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
			shadow: Boolean(normalizedWorkerData.shadow),
			externallyFenced: false,
			spawnPromise: Promise.resolve(),
			waiters: new Set(),
		};
		this.workerGenerations.set(this.generationKey(context), record);
		if (this.options.mode === 'custom' && typeof this.options.adapter.terminate === 'function') {
			// Generation-aware custom adapters own liveness through external fencing from the first allocation.
			this.generationFencing.add(context.workerId);
		}
		if (!record.shadow) {
			this.activeWorkerGenerations.set(context.workerId, context);
			this.set(context.workerId, record.worker);
		}

		try {
			switch (this.options.mode) {
				case 'threads': {
					const worker = new worker_threads.Worker(normalizedWorkerData.path, { env });
					worker.on('message', data => this.handleWorkerMessage(data as WorkerMessages, context));
					worker.on('error', err => {
						this.debugger?.error(`[Worker #${normalizedWorkerData.workerId}]`, err);
					});
					record.worker = worker;
					break;
				}
				case 'clusters': {
					cluster.setupPrimary({ exec: normalizedWorkerData.path });
					const worker = cluster.fork(env);
					worker.on('message', data => this.handleWorkerMessage(data as WorkerMessages, context));
					record.worker = worker;
					break;
				}
				case 'custom': {
					const spawned = this.options.adapter.spawn(normalizedWorkerData, env, context);
					record.spawnPromise = Promise.resolve(spawned).then(
						() => undefined,
						error => {
							this.cleanupFailedWorkerSpawn(record, error);
							throw error;
						},
					);
					if (!record.shadow)
						void record.spawnPromise.catch(error => {
							this.debugger?.error(
								`[Worker #${context.workerId}] Failed to spawn allocation ${context.allocationId}`,
								error,
							);
						});
					break;
				}
			}
			if (!record.shadow) this.set(context.workerId, record.worker);
			return record.worker;
		} catch (error) {
			this.cleanupFailedWorkerSpawn(record, error);
			throw error;
		}
	}

	private cleanupFailedWorkerSpawn(record: WorkerGenerationRecord, error: unknown) {
		if (this.getWorkerGenerationRecord(record.context) !== record) return;
		this.rejectWorkerGenerationWaiters(record, error);
		this.workerGenerations.delete(this.generationKey(record.context));
		const active = this.activeWorkerGenerations.get(record.context.workerId);
		if (active?.generation === record.context.generation && active.allocationId === record.context.allocationId) {
			this.activeWorkerGenerations.delete(record.context.workerId);
			this.delete(record.context.workerId);
			this.heartbeater.unregister(record.context.workerId);
		}
	}

	async prepareWorkerGeneration(
		workerId: number,
		options: { generation?: number; allocationId?: string } = {},
	): Promise<WorkerGenerationContext> {
		this.assertWorkerId(workerId);
		if (this.reshardingState !== 'idle')
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `Cannot prepare a worker generation while resharding` },
			});
		if (this.options.mode === 'custom' && typeof this.options.adapter.terminate !== 'function')
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `Custom generation transitions require adapter.terminate()` },
			});
		const activeContext = this.activeWorkerGenerations.get(workerId);
		const active = activeContext && this.getWorkerGenerationRecord(activeContext);
		if (!active)
			throw new SeyfertError('WORKER_NOT_FOUND', {
				metadata: { detail: `Cannot prepare a generation for unavailable worker #${workerId}` },
			});
		const pendingCandidate = [...this.workerGenerations.values()].find(
			record =>
				record.context.workerId === workerId &&
				record !== active &&
				record.shadow &&
				!['aborted', 'drained'].includes(record.status),
		);
		if (pendingCandidate)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `Worker #${workerId} already has a candidate generation in ${pendingCandidate.status}` },
			});

		const generation =
			options.generation ?? (this.latestWorkerGenerations.get(workerId) ?? active.context.generation) + 1;
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
				metadata: { detail: `Worker generation allocationId must be a non-empty string` },
			});

		const context: WorkerGenerationContext = {
			workerId,
			generation,
			allocationId,
		};
		if (this.getWorkerGenerationRecord(context))
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `Worker generation ${this.generationKey(context)} already exists` },
			});

		this.generationFencing.add(workerId);
		// Shadow allocations deliberately stay out of the legacy workerId-keyed Heartbeater.
		// Distributed adapters own their allocation leases until activation, preventing ACK cross-talk.
		this.createWorker({
			...active.workerData,
			...context,
			resharding: false,
			shadow: true,
		});
		const prepared = this.getWorkerGenerationRecord(context)!;
		try {
			await prepared.spawnPromise;
			return context;
		} catch (error) {
			prepared.status = 'aborted';
			this.notifyWorkerGeneration(prepared);
			this.rejectWorkerGenerationWaiters(prepared, error);
			try {
				await this.terminateWorkerGeneration(prepared);
			} catch (terminateError) {
				this.debugger?.error(
					`Failed to clean up worker allocation ${context.allocationId} after spawn failure`,
					terminateError,
				);
			}
			this.workerGenerations.delete(this.generationKey(context));
			throw error;
		}
	}

	async beginWorkerGenerationCutover(context: WorkerGenerationContext, timeoutMs = WORKER_TIMEOUT_MS) {
		this.assertWorkerGenerationContext(context);
		this.assertWorkerGenerationTimeout(timeoutMs);
		const record = this.getWorkerGenerationRecord(context);
		if (!record)
			throw new SeyfertError('WORKER_NOT_FOUND', {
				metadata: { detail: `Worker generation ${this.generationKey(context)} doesn't exist` },
			});
		if (record.cutoverReady) return this.snapshotWorkerGeneration(record);
		if (!record.shadow || record.status !== 'ready' || !record.appReady || !record.shardsReady)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `Only a ready shadow worker generation can begin cutover` },
			});
		record.cutoverRequested = true;
		this.postMessage(context.workerId, { type: 'BEGIN_WORKER_GENERATION_CUTOVER' }, context);
		return this.waitForWorkerGeneration(context, 'cutover', timeoutMs);
	}

	async activateWorkerGeneration(context: WorkerGenerationContext, timeoutMs = WORKER_TIMEOUT_MS) {
		this.assertWorkerGenerationContext(context);
		this.assertWorkerGenerationTimeout(timeoutMs);
		const record = this.getWorkerGenerationRecord(context);
		if (!record)
			throw new SeyfertError('WORKER_NOT_FOUND', {
				metadata: { detail: `Worker generation ${this.generationKey(context)} doesn't exist` },
			});
		if (record.status === 'active') return this.snapshotWorkerGeneration(record);
		if (record.status === 'activating') {
			this.postMessage(context.workerId, { type: 'ACTIVATE_WORKER_GENERATION' }, context);
			return this.waitForWorkerGeneration(context, 'active', timeoutMs);
		}
		if (record.status !== 'ready')
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `Worker generation ${this.generationKey(context)} cannot activate from ${record.status}` },
			});
		if (!record.appReady || !record.shardsReady)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `Worker generation ${this.generationKey(context)} is not ready` },
			});
		if (record.shadow && !record.cutoverReady)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `Begin worker generation cutover before activation` },
			});

		const activeContext = this.activeWorkerGenerations.get(context.workerId);
		const active = activeContext && this.getWorkerGenerationRecord(activeContext);
		if (
			active &&
			(active.context.generation !== context.generation || active.context.allocationId !== context.allocationId) &&
			(active.status !== 'drained' || context.generation <= active.context.generation)
		)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: {
					detail:
						active.status !== 'drained'
							? `Drain active worker generation ${this.generationKey(active.context)} before activation`
							: `Generation ${context.generation} must be newer than drained generation ${active.context.generation}`,
				},
			});

		record.status = 'activating';
		this.postMessage(context.workerId, { type: 'ACTIVATE_WORKER_GENERATION' }, context);
		return this.waitForWorkerGeneration(context, 'active', timeoutMs);
	}

	async drainWorkerGeneration(context: WorkerGenerationContext, timeoutMs = WORKER_TIMEOUT_MS) {
		this.assertWorkerGenerationContext(context);
		this.assertWorkerGenerationTimeout(timeoutMs);
		const record = this.getWorkerGenerationRecord(context);
		if (!record)
			throw new SeyfertError('WORKER_NOT_FOUND', {
				metadata: { detail: `Worker generation ${this.generationKey(context)} doesn't exist` },
			});
		if (record.status === 'drained') return this.snapshotWorkerGeneration(record);
		if (record.status === 'draining') {
			this.postMessage(context.workerId, { type: 'DRAIN_WORKER_GENERATION' }, context);
			return this.waitForWorkerGeneration(context, 'drained', timeoutMs);
		}
		if (record.status !== 'active')
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `Only an active worker generation can be drained` },
			});
		const unarmedCandidate = [...this.workerGenerations.values()].find(
			candidate =>
				candidate.context.workerId === context.workerId &&
				candidate !== record &&
				candidate.shadow &&
				candidate.status === 'ready' &&
				!candidate.cutoverReady,
		);
		if (unarmedCandidate)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `Begin candidate cutover before draining the active worker generation` },
			});

		record.status = 'draining';
		this.postMessage(context.workerId, { type: 'DRAIN_WORKER_GENERATION' }, context);
		return this.waitForWorkerGeneration(context, 'drained', timeoutMs);
	}

	/**
	 * Fences an unreachable allocation without an acknowledgement.
	 * Active allocations become drained; inactive candidates become aborted and are forgotten.
	 * Only call this after the transport has externally fenced the allocation (for example, after its lease expires).
	 */
	fenceWorkerGeneration(context: WorkerGenerationContext) {
		this.assertWorkerGenerationContext(context);
		const record = this.getWorkerGenerationRecord(context);
		if (!record)
			throw new SeyfertError('WORKER_NOT_FOUND', {
				metadata: { detail: `Cannot fence unavailable worker generation ${this.generationKey(context)}` },
			});
		const active = this.activeWorkerGenerations.get(context.workerId);
		this.generationFencing.add(context.workerId);
		if (active?.generation !== context.generation || active.allocationId !== context.allocationId) {
			record.externallyFenced = true;
			record.status = 'aborted';
			const state = this.snapshotWorkerGeneration(record);
			this.notifyWorkerGeneration(record);
			this.rejectWorkerGenerationWaiters(
				record,
				new SeyfertError('WORKER_NOT_FOUND', {
					metadata: { detail: `Worker generation ${this.generationKey(context)} was externally fenced` },
				}),
			);
			this.workerGenerations.delete(this.generationKey(context));
			const previous = this.previousWorkerGenerations.get(context.workerId);
			if (previous) {
				const remaining = previous.filter(
					candidate => candidate.generation !== context.generation || candidate.allocationId !== context.allocationId,
				);
				if (remaining.length) this.previousWorkerGenerations.set(context.workerId, remaining);
				else this.previousWorkerGenerations.delete(context.workerId);
			}
			return state;
		}
		record.externallyFenced = true;
		record.status = 'drained';
		this.notifyWorkerGeneration(record);
		return this.snapshotWorkerGeneration(record);
	}

	async abortWorkerGeneration(context: WorkerGenerationContext, timeoutMs = WORKER_TIMEOUT_MS) {
		this.assertWorkerGenerationContext(context);
		this.assertWorkerGenerationTimeout(timeoutMs);
		const record = this.getWorkerGenerationRecord(context);
		if (!record)
			throw new SeyfertError('WORKER_NOT_FOUND', {
				metadata: { detail: `Worker generation ${this.generationKey(context)} doesn't exist` },
			});
		const active = this.activeWorkerGenerations.get(context.workerId);
		if (active?.generation === context.generation && active.allocationId === context.allocationId)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `Cannot abort the active worker generation` },
			});
		if (record.status === 'aborted') {
			const state = this.snapshotWorkerGeneration(record);
			await this.terminateWorkerGeneration(record);
			this.workerGenerations.delete(this.generationKey(context));
			return state;
		}

		record.status = 'aborting';
		this.postMessage(context.workerId, { type: 'ABORT_WORKER_GENERATION' }, context);
		let state: WorkerGenerationState;
		try {
			state = await this.waitForWorkerGeneration(context, 'aborted', timeoutMs);
		} catch (error) {
			try {
				await this.terminateWorkerGeneration(record);
				record.status = 'aborted';
				this.rejectWorkerGenerationWaiters(record, error);
				this.workerGenerations.delete(this.generationKey(context));
			} catch (terminateError) {
				throw new AggregateError([error, terminateError], `Failed to force-terminate aborted worker generation`);
			}
			throw error;
		}
		await this.terminateWorkerGeneration(record);
		this.workerGenerations.delete(this.generationKey(context));
		return state;
	}

	async commitWorkerGeneration(context: WorkerGenerationContext) {
		this.assertWorkerGenerationContext(context);
		const record = this.getWorkerGenerationRecord(context);
		if (!record || record.status !== 'active')
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `Only the active worker generation can be committed` },
			});
		const previousContexts = this.previousWorkerGenerations.get(context.workerId) ?? [];
		const previousGenerations = previousContexts
			.map(previousContext => this.getWorkerGenerationRecord(previousContext))
			.filter(previous => previous !== undefined);
		if (previousGenerations.some(previous => previous.status !== 'drained'))
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `Previous worker generations must be drained before commit` },
			});
		for (const previous of previousGenerations) {
			if (!previous.externallyFenced) await this.terminateWorkerGeneration(previous);
			this.workerGenerations.delete(this.generationKey(previous.context));
		}
		this.previousWorkerGenerations.delete(context.workerId);
		return this.snapshotWorkerGeneration(record);
	}

	private async terminateWorkerGeneration(record: WorkerGenerationRecord) {
		switch (this.options.mode) {
			case 'custom': {
				if (!this.options.adapter.terminate)
					throw new SeyfertError('INTERNAL_ERROR', {
						metadata: { detail: `Custom generation transitions require adapter.terminate()` },
					});
				await this.options.adapter.terminate(record.context.workerId, record.context);
				break;
			}
			case 'threads':
				await (record.worker as WorkerThreadsWorker).terminate();
				break;
			case 'clusters':
				(record.worker as ClusterWorker).kill();
				break;
		}
	}

	spawn(workerId: number, shardId: number, resharding = false, target?: WorkerGenerationTarget) {
		this.connectQueue.push(() => {
			const context = this.resolveWorkerGenerationContext(workerId, target);
			const worker = context ? this.getWorkerGenerationRecord(context) : this.has(workerId);
			if (!worker) {
				this.debugger?.fatal(`Trying ${resharding ? 'reshard' : 'spawn'} with worker that doesn't exist`);
				return;
			}
			this.postMessage(
				workerId,
				{
					type: resharding ? 'ALLOW_CONNECT_RESHARDING' : 'ALLOW_CONNECT',
					shardId,
					presence: this.options.presence?.(shardId, workerId),
				} satisfies ManagerAllowConnect | ManagerAllowConnectResharding,
				target,
			);
		});
	}

	private resolveIncomingWorkerGeneration(message: WorkerMessages, source?: WorkerGenerationContext) {
		const generation = message.generation;
		const allocationId = message.allocationId;
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
			const record = this.getWorkerGenerationRecord(context);
			if (!record) return;
			return { context, record };
		}
		if (this.generationFencing.has(message.workerId)) return;
		const active = this.activeWorkerGenerations.get(message.workerId);
		if (active) return { context: active, record: this.getWorkerGenerationRecord(active) };
		if (this.has(message.workerId)) return {};
		return;
	}

	private acceptsWorkerGenerationMessage(record: WorkerGenerationRecord | undefined, type: WorkerMessages['type']) {
		if (!record) return true;
		switch (type) {
			case 'WORKER_GENERATION_START':
				return record.status === 'preparing';
			case 'WORKER_GENERATION_APP_READY':
				return record.status === 'preparing' || record.status === 'ready' || record.status === 'active';
			case 'WORKER_GENERATION_SHARDS_READY':
				return record.status === 'preparing' || record.status === 'ready';
			case 'WORKER_GENERATION_CUTOVER_READY':
				return record.status === 'ready' && record.cutoverRequested;
			case 'WORKER_GENERATION_FAILED':
				return record.shadow && ['preparing', 'ready', 'activating', 'aborting'].includes(record.status);
			case 'WORKER_GENERATION_ACTIVATED':
				return record.status === 'activating';
			case 'WORKER_GENERATION_DRAINED':
				return record.status === 'draining';
			case 'WORKER_GENERATION_ABORTED':
				return record.status === 'aborting';
		}
		if (record.status === 'active') return true;
		if (record.status === 'draining') return true;
		if (record.status === 'activating') return true;
		if (record.status === 'preparing' || record.status === 'ready')
			return type === 'CONNECT_QUEUE' || type === 'WORKER_API_REQUEST' || type === 'CACHE_REQUEST';
		return false;
	}

	async handleWorkerMessage(message: WorkerMessages, source?: WorkerGenerationContext) {
		const incoming = this.resolveIncomingWorkerGeneration(message, source);
		if (!incoming || !this.acceptsWorkerGenerationMessage(incoming.record, message.type)) return false;
		await this.options.handleWorkerMessage?.(message);
		const target = incoming.context;
		switch (message.type) {
			case 'WORKER_GENERATION_START':
				this.postMessage(
					message.workerId,
					{
						type: 'SPAWN_SHARDS',
						compress: this.options.compress ?? false,
						info: { ...this.options.info, shards: this.totalShards },
						properties: { ...properties, ...this.options.properties },
					} satisfies ManagerSpawnShards,
					target,
				);
				break;
			case 'WORKER_GENERATION_APP_READY':
				if (incoming.record) {
					incoming.record.appReady = true;
					if (Number.isSafeInteger(message.intents) && message.intents >= 0)
						incoming.record.workerData.intents = message.intents;
					this.notifyWorkerGeneration(incoming.record);
				}
				break;
			case 'WORKER_GENERATION_SHARDS_READY':
				if (incoming.record) {
					incoming.record.shardsReady = true;
					this.notifyWorkerGeneration(incoming.record);
				}
				break;
			case 'WORKER_GENERATION_CUTOVER_READY':
				if (incoming.record) {
					incoming.record.cutoverReady = true;
					this.notifyWorkerGeneration(incoming.record);
				}
				break;
			case 'WORKER_GENERATION_FAILED':
				if (incoming.record) {
					const abortOwnsTermination = incoming.record.status === 'aborting';
					const failure = new SeyfertError('INTERNAL_ERROR', {
						metadata: {
							detail: `Worker generation ${this.generationKey(incoming.record.context)} failed: ${message.message}`,
						},
					});
					incoming.record.status = 'aborted';
					this.notifyWorkerGeneration(incoming.record);
					this.rejectWorkerGenerationWaiters(incoming.record, failure);
					if (!abortOwnsTermination) {
						await this.terminateWorkerGeneration(incoming.record);
						this.workerGenerations.delete(this.generationKey(incoming.record.context));
					}
				}
				break;
			case 'WORKER_GENERATION_ACTIVATED':
				if (incoming.record?.status === 'activating') {
					const previous = this.activeWorkerGenerations.get(message.workerId);
					if (
						previous &&
						(previous.generation !== incoming.record.context.generation ||
							previous.allocationId !== incoming.record.context.allocationId)
					) {
						const previousGenerations = this.previousWorkerGenerations.get(message.workerId) ?? [];
						if (
							!previousGenerations.some(
								context => context.generation === previous.generation && context.allocationId === previous.allocationId,
							)
						)
							previousGenerations.push(previous);
						this.previousWorkerGenerations.set(message.workerId, previousGenerations);
					}
					incoming.record.status = 'active';
					incoming.record.shadow = false;
					incoming.record.workerData.shadow = false;
					this.activeWorkerGenerations.set(message.workerId, incoming.record.context);
					this.set(message.workerId, incoming.record.worker);
					this.flushWorkerGenerationMessages(message.workerId);
					this.notifyWorkerGeneration(incoming.record);
				}
				break;
			case 'WORKER_GENERATION_DRAINED':
				if (incoming.record?.status === 'draining') {
					incoming.record.status = 'drained';
					this.notifyWorkerGeneration(incoming.record);
				}
				break;
			case 'WORKER_GENERATION_ABORTED':
				if (incoming.record?.status === 'aborting') {
					incoming.record.status = 'aborted';
					this.notifyWorkerGeneration(incoming.record);
					this.rejectWorkerGenerationWaiters(
						incoming.record,
						new SeyfertError('INTERNAL_ERROR', {
							metadata: { detail: `Worker generation ${this.generationKey(incoming.record.context)} was aborted` },
						}),
					);
				}
				break;
			case 'ACK_HEARTBEAT':
				this.heartbeater.acknowledge(message.workerId);
				break;
			case 'WORKER_READY_RESHARDING':
				{
					this.get(message.workerId)!.resharded = true;
					if (!this.reshardingWorkerQueue.length && [...this.values()].every(w => w.resharded)) {
						for (const [id] of this.entries()) {
							this.postMessage(id, {
								type: 'DISCONNECT_ALL_SHARDS_RESHARDING',
							} satisfies DisconnectAllShardsResharding);
						}
						this.forEach(w => {
							delete w.resharded;
						});
					} else {
						const nextWorker = this.reshardingWorkerQueue.shift();
						if (nextWorker) {
							this.debugger?.info('Spawning next worker to reshard');
							await nextWorker();
						} else {
							this.debugger?.info('No more workers to reshard left');
						}
					}
				}
				break;
			case 'DISCONNECTED_ALL_SHARDS_RESHARDING':
				{
					this.get(message.workerId)!.disconnected = true;
					if ([...this.values()].every(w => w.disconnected)) {
						this.options.totalShards = this._info!.shards;
						this.options.shardEnd = this.options.totalShards = this.options.info.shards = this._info!.shards;
						this.options.workers = this.size;
						for (const [id] of this.entries()) {
							this.postMessage(id, {
								type: 'CONNECT_ALL_SHARDS_RESHARDING',
								totalShards: this.options.totalShards,
							} satisfies ConnnectAllShardsResharding);
						}
						this.forEach(w => {
							delete w.disconnected;
						});
					}
				}
				break;
			case 'WORKER_RESHARDING_COMPLETE':
				{
					const worker = this.get(message.workerId);
					if (!worker || this.reshardingState !== 'running') break;
					worker.reshardingComplete = true;
					if ([...this.values()].every(candidate => candidate.reshardingComplete)) {
						this.forEach(candidate => {
							delete candidate.reshardingComplete;
						});
						delete this._info;
						this.reshardingState = 'idle';
					}
				}
				break;
			case 'WORKER_START_RESHARDING':
				{
					this.postMessage(
						message.workerId,
						{
							type: 'SPAWN_SHARDS_RESHARDING',
							compress: this.options.compress ?? false,
							info: {
								...this.options.info,
								shards: this._info!.shards,
							},
							properties: {
								...properties,
								...this.options.properties,
							},
						} satisfies ManagerSpawnShardsResharding,
						target,
					);
				}
				break;
			case 'WORKER_START':
				{
					this.postMessage(
						message.workerId,
						{
							type: 'SPAWN_SHARDS',
							compress: this.options.compress ?? false,
							info: {
								...this.options.info,
								shards: this.totalShards,
							},
							properties: {
								...properties,
								...this.options.properties,
							},
						} satisfies ManagerSpawnShards,
						target,
					);
				}
				break;

			case 'CONNECT_QUEUE_RESHARDING':
				this.spawn(message.workerId, message.shardId, true, target);
				break;
			case 'CONNECT_QUEUE':
				this.spawn(message.workerId, message.shardId, false, target);
				break;
			case 'CACHE_REQUEST':
				{
					const worker = this.has(message.workerId);
					if (!worker) {
						throw new SeyfertError('INVALID_WORKER_REQUEST', {
							metadata: { detail: 'Invalid request from unavailable worker' },
						});
					}
					// @ts-expect-error
					const result = await this.cacheAdapter[message.method](...message.args);
					this.postMessage(
						message.workerId,
						{
							type: 'CACHE_RESULT',
							nonce: message.nonce,
							result,
						} as ManagerSendCacheResult,
						target,
					);
				}
				break;
			case 'RECEIVE_PAYLOAD':
				await this.options.handlePayload?.(message.shardId, message.workerId, message.payload);
				break;
			case 'RESULT_PAYLOAD':
				{
					const resultPayload = this.promises.get(message.nonce);
					if (!resultPayload) {
						return true;
					}
					this.promises.delete(message.nonce);
					clearTimeout(resultPayload.timeout);
					resultPayload.resolve(true);
				}
				break;
			case 'SHARD_INFO':
				{
					const { nonce, type, ...data } = message;
					const shardInfo = this.promises.get(nonce);
					if (!shardInfo) {
						return true;
					}
					this.promises.delete(nonce);
					clearTimeout(shardInfo.timeout);
					shardInfo.resolve(data);
				}
				break;
			case 'WORKER_INFO':
				{
					const { nonce, type, ...data } = message;
					const workerInfo = this.promises.get(nonce);
					if (!workerInfo) {
						return true;
					}
					this.promises.delete(nonce);
					clearTimeout(workerInfo.timeout);
					workerInfo.resolve(data);
				}
				break;
			case 'WORKER_READY':
				{
					if (incoming.record) {
						incoming.record.shardsReady = true;
						this.notifyWorkerGeneration(incoming.record);
					}
					this.get(message.workerId)!.ready = true;
					if (this.size === this.totalWorkers && [...this.values()].every(w => w.ready)) {
						this.postMessage(this.keys().next().value!, {
							type: 'BOT_READY',
						} satisfies ManagerSendBotReady);
						this.forEach(w => {
							delete w.ready;
						});
					}
				}
				break;
			case 'WORKER_SHARDS_CONNECTED':
				{
					const nextWorker = this.workerQueue.shift();
					if (nextWorker) {
						this.debugger?.info('Spawning next worker');
						await nextWorker();
					} else {
						this.debugger?.info('No more workers to spawn left');
					}
				}
				break;
			case 'WORKER_API_REQUEST':
				{
					if (this.options.mode === 'clusters' && message.requestOptions.files?.length) {
						message.requestOptions.files.forEach(file => {
							//@ts-expect-error
							if (file.data.type === 'Buffer' && Array.isArray(file.data?.data))
								//@ts-expect-error
								file.data = new Uint8Array(file.data.data);
						});
					}
					const response = await this.rest.request(message.method, message.url, message.requestOptions);
					this.postMessage(
						message.workerId,
						{
							nonce: message.nonce,
							response,
							type: 'API_RESPONSE',
						} satisfies ManagerSendApiResponse,
						target,
					);
				}
				break;
			case 'EVAL_RESPONSE':
				{
					const { nonce, response } = message;
					const evalResponse = this.promises.get(nonce);
					if (!evalResponse) {
						return true;
					}
					this.promises.delete(nonce);
					clearTimeout(evalResponse.timeout);
					evalResponse.resolve(response);
				}
				break;
			case 'EVAL_TO_WORKER':
				{
					const nonce = this.generateNonce();
					this.postMessage(
						message.toWorkerId,
						{
							nonce,
							func: message.func,
							type: 'EXECUTE_EVAL_TO_WORKER',
							toWorkerId: message.toWorkerId,
							vars: message.vars,
						} satisfies ManagerExecuteEvalToWorker,
						message.toWorkerId === message.workerId ? target : undefined,
					);
					this.generateSendPromise(nonce, 'Eval timeout').then(val =>
						this.postMessage(
							message.workerId,
							{
								nonce: message.nonce,
								response: val,
								type: 'EVAL_RESPONSE',
							} satisfies ManagerSendEvalResponse,
							target,
						),
					);
				}
				break;
		}
		return true;
	}

	private generateNonce(): UUID {
		const uuid = randomUUID();
		if (this.promises.has(uuid)) return this.generateNonce();
		return uuid;
	}

	private generateSendPromise<T = unknown>(nonce: string, message = 'Timeout'): Promise<T> {
		return new Promise<T>((res, rej) => {
			const timeout = setTimeout(() => {
				this.promises.delete(nonce);
				rej(new SeyfertError('WORKER_TIMEOUT', { metadata: { ...{ nonce }, detail: message } }));
			}, WORKER_TIMEOUT_MS);
			this.promises.set(nonce, { resolve: res, timeout });
		});
	}

	async send(data: GatewaySendPayload, shardId: number) {
		const workerId = this.calculateWorkerId(shardId);
		const worker = this.has(workerId);

		if (!worker) {
			throw new SeyfertError('INTERNAL_ERROR', { metadata: { detail: `Worker #${workerId} doesn't exist` } });
		}

		const payload = await this.resolveSendPayload(shardId, data);
		if (!payload) return false;

		const nonce = this.generateNonce();

		this.postMessage(workerId, {
			type: 'SEND_PAYLOAD',
			shardId,
			nonce,
			...payload,
		} satisfies ManagerSendPayload);

		return this.generateSendPromise<true>(nonce, 'Shard send payload timeout');
	}

	private async resolveSendPayload(shardId: number, payload: GatewaySendPayload) {
		const result = await this.options.handleSendPayload?.(shardId, payload);
		if (result === null) return null;
		return result ?? payload;
	}

	async getShardInfo(shardId: number) {
		const workerId = this.calculateWorkerId(shardId);
		const worker = this.has(workerId);

		if (!worker) {
			throw new SeyfertError('INTERNAL_ERROR', { metadata: { detail: `Worker #${workerId} doesn't exist` } });
		}

		const nonce = this.generateNonce();

		this.postMessage(workerId, { shardId, nonce, type: 'SHARD_INFO' } satisfies ManagerRequestShardInfo);

		return this.generateSendPromise<WorkerShardInfo>(nonce, 'Get shard info timeout');
	}

	async getWorkerInfo(workerId: number) {
		const worker = this.has(workerId);

		if (!worker) {
			throw new SeyfertError('INTERNAL_ERROR', { metadata: { detail: `Worker #${workerId} doesn't exist` } });
		}

		const nonce = this.generateNonce();

		this.postMessage(workerId, { nonce, type: 'WORKER_INFO' } satisfies ManagerRequestWorkerInfo);

		return this.generateSendPromise<WorkerInfo>(nonce, 'Get worker info timeout');
	}

	tellWorker<R, V extends Record<string, unknown>>(
		workerId: number,
		func: (_: WorkerClient & UsingClient, vars: V) => R,
		vars: V,
	) {
		const nonce = this.generateNonce();
		this.postMessage(workerId, {
			type: 'EXECUTE_EVAL',
			func: func.toString(),
			nonce,
			vars: JSON.stringify(vars),
		} satisfies ManagerExecuteEval);
		return this.generateSendPromise<R>(nonce);
	}

	tellWorkers<R, V extends Record<string, unknown>>(func: (_: WorkerClient & UsingClient, vars: V) => R, vars: V) {
		const promises: Promise<R>[] = [];
		for (const i of this.keys()) {
			promises.push(this.tellWorker(i, func, vars));
		}
		return Promise.all(promises);
	}

	/**
	 * Resolves runtime configuration and the effective shard topology without creating workers.
	 * Discord's recommendation is fetched when gateway information was not supplied in the manager options.
	 * Concurrent and subsequent calls share the same successful resolution; failed attempts may be retried.
	 */
	resolveShardTopology(): Promise<ResolvedWorkerShardTopology> {
		if (this.shardTopologyResolution) return this.shardTopologyResolution;

		const resolution = Promise.resolve().then(() => this.resolveShardTopologyRuntime());
		this.shardTopologyResolution = resolution;
		void resolution.catch(() => {
			if (this.shardTopologyResolution === resolution) this.shardTopologyResolution = undefined;
		});
		return resolution;
	}

	private async resolveShardTopologyRuntime(): Promise<ResolvedWorkerShardTopology> {
		const rc =
			((await this.options.getRC?.()) as InternalRuntimeConfig | undefined) ??
			(await BaseClient.prototype.getRC<InternalRuntimeConfig>());

		this.options.debug ||= rc.debug ?? false;
		this.options.intents ??= rc.intents ?? 0;
		this.options.token ??= rc.token;
		this.rest ??= new ApiHandler({
			token: this.options.token,
			baseUrl: 'api/v10',
			domain: BASE_HOST,
			debug: this.options.debug,
		});
		const gatewayInfo = this.options.info ?? (await this.rest.proxy.gateway.bot.get());
		if (!Number.isSafeInteger(gatewayInfo.shards) || gatewayInfo.shards <= 0)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `info.shards must be a positive safe integer` },
			});
		this.options.info ??= gatewayInfo;
		this.options.shardEnd ??= this.options.totalShards ?? this.options.info.shards;
		this.options.totalShards ??= this.options.shardEnd;
		this.options = MergeOptions<WorkerManagerRuntimeOptions>(WorkerManagerDefaults, this.options);
		for (const [name, value] of [
			['totalShards', this.options.totalShards],
			['shardEnd', this.options.shardEnd],
			['shardsPerWorker', this.options.shardsPerWorker],
		] as const) {
			if (!Number.isSafeInteger(value) || value <= 0)
				throw new SeyfertError('INTERNAL_ERROR', {
					metadata: { detail: `${name} must be a positive safe integer` },
				});
		}
		if (!Number.isSafeInteger(this.options.shardStart) || this.options.shardStart < 0)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `shardStart must be a non-negative safe integer` },
			});
		if (this.options.shardEnd <= this.options.shardStart || this.options.shardEnd > this.options.totalShards)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `shardEnd must be greater than shardStart and no greater than totalShards` },
			});
		if (!['eager', 'deferred'].includes(this.options.generationLifecycle))
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `generationLifecycle must be eager or deferred` },
			});
		for (const [name, value] of [
			['maxCutoverBufferEvents', this.options.maxCutoverBufferEvents],
			['maxShadowHydrationEvents', this.options.maxShadowHydrationEvents],
			['maxGenerationMessageQueueEvents', this.options.maxGenerationMessageQueueEvents],
		] as const) {
			if (!Number.isSafeInteger(value) || value <= 0)
				throw new SeyfertError('INTERNAL_ERROR', {
					metadata: { detail: `${name} must be a positive safe integer` },
				});
		}
		this.options.resharding.getInfo ??= () => this.rest.proxy.gateway.bot.get();
		this.options.workers ??= Math.ceil(this.options.totalShards / this.options.shardsPerWorker);
		if (!Number.isSafeInteger(this.options.workers) || this.options.workers <= 0)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `workers must be a positive safe integer` },
			});
		this.connectQueue = new ConnectQueue(5.5e3, this.concurrency);

		if (this.options.debug) {
			this.debugger = new Logger({
				name: '[WorkerManager]',
			});
		}
		if (this.totalShards / this.shardsPerWorker > this.totalWorkers) {
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: {
					detail: `Cannot create enough shards in the specified workers, minimum: ${Math.ceil(
						this.totalShards / this.shardsPerWorker,
					)}`,
				},
			});
		}
		const info = Object.freeze({
			...this.options.info,
			session_start_limit: Object.freeze({ ...this.options.info.session_start_limit }),
		});
		return Object.freeze({
			info,
			totalShards: this.totalShards,
			shardStart: this.shardStart,
			shardEnd: this.shardEnd,
			shardsPerWorker: this.shardsPerWorker,
			workers: this.totalWorkers,
		});
	}

	private assertShardTopologyCurrent(topology: ResolvedWorkerShardTopology) {
		if (
			topology.info.shards !== this.options.info.shards ||
			topology.totalShards !== this.totalShards ||
			topology.shardStart !== this.shardStart ||
			topology.shardEnd !== this.shardEnd ||
			topology.shardsPerWorker !== this.shardsPerWorker ||
			topology.workers !== this.totalWorkers
		)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `WorkerManager shard topology changed after it was resolved` },
			});
	}

	start(): Promise<void> {
		if (this.startPromise) return this.startPromise;
		const start = this.startRuntime();
		this.startPromise = start;
		void start.catch(() => {
			if (this.startPromise === start) this.startPromise = undefined;
		});
		return start;
	}

	private async startRuntime() {
		const topology = await this.resolveShardTopology();
		this.assertShardTopologyCurrent(topology);

		const spaces = WorkerManager.prepareSpaces(
			{
				shardStart: topology.shardStart,
				shardEnd: topology.shardEnd,
				shardsPerWorker: topology.shardsPerWorker,
			},
			this.debugger,
		);
		this.workerQueue = [];
		this.prepareWorkers(spaces);
		// Start workers queue
		const firstWorker = this.workerQueue.shift();
		if (!firstWorker)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: 'WorkerManager could not prepare an initial worker' },
			});
		try {
			await firstWorker();
		} catch (error) {
			this.workerQueue = [];
			throw error;
		}
		await this.startResharding();
	}

	private async checkForResharding() {
		if (this.reshardingState !== 'idle') return;
		if (this.hasWorkerGenerationTransition())
			return this.debugger?.debug('Cannot reshard while worker generations are transitioning');
		this.reshardingState = 'checking';
		try {
			this.debugger?.debug('Checking if reshard is needed');
			const info = await this.options.resharding.getInfo();
			if (info.shards <= this.totalShards) return this.debugger?.debug('Resharding not needed');
			//https://github.com/discordeno/discordeno/blob/6a5f446c0651b9fad9f1550ff1857fe7a026426b/packages/gateway/src/manager.ts#L106C8-L106C94
			const percentage = (info.shards / ((this.totalShards * 2500) / 1000)) * 100;
			if (percentage < this.options.resharding.percentage)
				return this.debugger?.debug(
					`Percentage is not enough to reshard ${percentage}/${this.options.resharding.percentage}`,
				);

			this.debugger?.info(`Starting resharding process to ${info.shards}`);
			this.reshardingState = 'running';
			this._info = info;
			this.connectQueue.concurrency = info.session_start_limit.max_concurrency;
			this.options.info.session_start_limit.max_concurrency = info.session_start_limit.max_concurrency;

			const spaces = WorkerManager.prepareSpaces(
				{
					shardsPerWorker: this.shardsPerWorker,
					shardEnd: info.shards,
					shardStart: 0,
				},
				this.debugger,
			);
			this.prepareWorkers(spaces, true);
			await this.reshardingWorkerQueue.shift()!();
		} catch (error) {
			this.reshardingWorkerQueue = [];
			delete this._info;
			this.reshardingState = 'idle';
			throw error;
		} finally {
			if (this.reshardingState === 'checking') this.reshardingState = 'idle';
		}
	}

	async startResharding() {
		if (this.options.resharding.interval <= 0) return;
		if (this.shardStart !== 0 || this.shardEnd !== this.totalShards)
			return this.debugger?.debug('Cannot start resharder');
		setInterval(() => {
			void this.checkForResharding().catch(error => {
				this.debugger?.error('WorkerManager resharding check failed', error);
			});
		}, this.options.resharding.interval);
	}
}

type CreateManagerMessage<T extends string, D extends object = object> = { type: T } & D &
	Partial<WorkerGenerationTarget>;

export type ManagerAllowConnect = CreateManagerMessage<
	'ALLOW_CONNECT',
	{ shardId: number; presence?: GatewayPresenceUpdateData }
>;
export type ManagerAllowConnectResharding = CreateManagerMessage<
	'ALLOW_CONNECT_RESHARDING',
	{ shardId: number; presence?: GatewayPresenceUpdateData }
>;
export type ManagerWorkerAlreadyExistsResharding = CreateManagerMessage<'WORKER_ALREADY_EXISTS_RESHARDING'>;
export type ManagerSpawnShards = CreateManagerMessage<
	'SPAWN_SHARDS',
	Pick<ShardOptions, 'info' | 'properties' | 'compress'>
>;
export type ManagerSpawnShardsResharding = CreateManagerMessage<
	'SPAWN_SHARDS_RESHARDING',
	Pick<ShardOptions, 'info' | 'properties' | 'compress'>
>;
export type DisconnectAllShardsResharding = CreateManagerMessage<'DISCONNECT_ALL_SHARDS_RESHARDING'>;
export type ConnnectAllShardsResharding = CreateManagerMessage<
	'CONNECT_ALL_SHARDS_RESHARDING',
	{
		totalShards: number;
	}
>;
export type ManagerActivateWorkerGeneration = CreateManagerMessage<'ACTIVATE_WORKER_GENERATION'>;
export type ManagerBeginWorkerGenerationCutover = CreateManagerMessage<'BEGIN_WORKER_GENERATION_CUTOVER'>;
export type ManagerDrainWorkerGeneration = CreateManagerMessage<'DRAIN_WORKER_GENERATION'>;
export type ManagerAbortWorkerGeneration = CreateManagerMessage<'ABORT_WORKER_GENERATION'>;
export type ManagerRenewWorkerSupervisorLease = CreateManagerMessage<
	'RENEW_WORKER_SUPERVISOR_LEASE',
	{ expiresInMs: number; issuedAtMonotonicMs: number; sequence: number }
>;
export type ManagerSendPayload = CreateManagerMessage<
	'SEND_PAYLOAD',
	GatewaySendPayload & { shardId: number; nonce: string }
>;
export type ManagerRequestShardInfo = CreateManagerMessage<'SHARD_INFO', { nonce: string; shardId: number }>;
export type ManagerRequestWorkerInfo = CreateManagerMessage<'WORKER_INFO', { nonce: string }>;
export type ManagerSendCacheResult = CreateManagerMessage<'CACHE_RESULT', { nonce: string; result: any }>;
export type ManagerSendBotReady = CreateManagerMessage<'BOT_READY'>;
export type ManagerSendApiResponse = CreateManagerMessage<
	'API_RESPONSE',
	{
		response: any;
		error?: any;
		nonce: string;
	}
>;
export type ManagerExecuteEvalToWorker = CreateManagerMessage<
	'EXECUTE_EVAL_TO_WORKER',
	{
		func: string;
		nonce: string;
		vars: string;
		toWorkerId: number;
	}
>;

export type ManagerExecuteEval = CreateManagerMessage<
	'EXECUTE_EVAL',
	{
		func: string;
		vars: string;
		nonce: string;
	}
>;

export type ManagerSendEvalResponse = CreateManagerMessage<
	'EVAL_RESPONSE',
	{
		response: any;
		nonce: string;
	}
>;

export type BaseManagerMessages =
	| ManagerAllowConnect
	| ManagerSpawnShards
	| ManagerSendPayload
	| ManagerRequestShardInfo
	| ManagerRequestWorkerInfo
	| ManagerSendCacheResult
	| ManagerSendBotReady
	| ManagerSendApiResponse
	| ManagerSendEvalResponse
	| ManagerExecuteEvalToWorker
	| ManagerWorkerAlreadyExistsResharding
	| ManagerSpawnShardsResharding
	| ManagerAllowConnectResharding
	| DisconnectAllShardsResharding
	| ConnnectAllShardsResharding
	| ManagerActivateWorkerGeneration
	| ManagerBeginWorkerGenerationCutover
	| ManagerDrainWorkerGeneration
	| ManagerAbortWorkerGeneration
	| ManagerRenewWorkerSupervisorLease
	| ManagerExecuteEval;

export type CustomManagerMessages = {
	[K in keyof CustomWorkerManagerEvents]: Identify<
		{
			type: K;
		} & Partial<WorkerGenerationTarget> &
			Identify<CustomWorkerManagerEvents[K] extends never ? {} : CustomWorkerManagerEvents[K]>
	>;
};

export type ManagerMessages =
	| {
			[K in BaseManagerMessages['type']]: Identify<Extract<BaseManagerMessages, { type: K }>>;
	  }[BaseManagerMessages['type']]
	| CustomManagerMessages[keyof CustomManagerMessages];
