import type { Worker as ClusterWorker } from 'node:cluster';
import { randomUUID, type UUID } from 'node:crypto';
import type { ApiHandler, Logger, UsingClient, WorkerClient } from '../..';
import { type Adapter, MemoryAdapter } from '../../cache';
import { type Awaitable, lazyLoadPackage, type PickPartial, SeyfertError } from '../../common';
import type { GatewaySendPayload, RESTGetAPIGatewayBotResult } from '../../types';
import { properties } from '../constants';
import { DynamicBucket } from '../structures';
import type { ConnectQueue } from '../structures/timeout';
import { Heartbeater, type WorkerHeartbeaterMessages } from './heartbeater';
import type {
	ConnnectAllShardsResharding,
	DisconnectAllShardsResharding,
	ManagerAllowConnect,
	ManagerAllowConnectResharding,
	ManagerExecuteEval,
	ManagerExecuteEvalToWorker,
	ManagerMessages,
	ManagerRequestShardInfo,
	ManagerRequestWorkerInfo,
	ManagerSendApiResponse,
	ManagerSendBotReady,
	ManagerSendCacheResult,
	ManagerSendEvalResponse,
	ManagerSendPayload,
	ManagerSpawnShards,
	ManagerSpawnShardsResharding,
	ManagerWorkerAlreadyExistsResharding,
} from './manager-messages';
import type {
	ResolvedWorkerShardTopology,
	WorkerData,
	WorkerGenerationContext,
	WorkerGenerationReadiness,
	WorkerGenerationTarget,
	WorkerManagerOptions,
} from './shared';
import { WORKER_TIMEOUT_MS, type WorkerInfo, type WorkerMessages, type WorkerShardInfo } from './worker';
import { WorkerGenerationCoordinator, type WorkerGenerationHandle } from './worker-generation-coordinator';
import { WorkerTopologyResolver } from './worker-topology-resolver';

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

export class WorkerManager extends Map<number, WorkerGenerationHandle> {
	static prepareSpaces(
		options: {
			shardStart: number;
			shardEndExclusive: number;
			shardsPerWorker: number;
		},
		logger?: Logger,
	) {
		logger?.info('Preparing buckets');

		const chunks = DynamicBucket.chunk<number>(
			new Array(options.shardEndExclusive - options.shardStart),
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
	private readonly generations: WorkerGenerationCoordinator;
	private readonly topology: WorkerTopologyResolver;
	private startPromise?: Promise<void>;

	constructor(options: WorkerManagerConstructorOptions) {
		super();
		if (
			options.mode === 'custom' &&
			options.adapter.managesWorkerGenerations &&
			options.resharding?.interval !== undefined &&
			options.resharding.interval !== 0
		) {
			throw new TypeError('Generation-aware custom adapters cannot enable WorkerManager native resharding');
		}
		// The constructor permits runtime config values that start() fills before use.
		this.options = { mode: 'threads', ...options } as WorkerManager['options'];
		if (this.options.mode === 'custom' && this.options.adapter.managesWorkerGenerations) {
			this.options.resharding = { ...this.options.resharding, interval: 0 } as WorkerManager['options']['resharding'];
		}
		this.cacheAdapter = new MemoryAdapter();
		const manager = this;
		this.generations = new WorkerGenerationCoordinator({
			get mode() {
				return manager.options.mode;
			},
			get canTerminateCustomWorker() {
				return manager.options.mode === 'custom' && typeof manager.options.adapter.terminate === 'function';
			},
			get isResharding() {
				return manager.reshardingState !== 'idle';
			},
			hasActiveWorker: workerId => this.has(workerId),
			getActiveWorker: workerId => this.get(workerId),
			setActiveWorker: (workerId, worker) => this.set(workerId, worker),
			deleteActiveWorker: workerId => void this.delete(workerId),
			unregisterHeartbeat: workerId => this.heartbeater.unregister(workerId),
			spawnCustomWorker: (workerData, env) => {
				if (this.options.mode !== 'custom') throw new Error('Custom worker spawning requires custom mode');
				return this.options.adapter.spawn(workerData, env);
			},
			terminateCustomWorker: (workerId, context) => {
				if (this.options.mode !== 'custom' || !this.options.adapter.terminate)
					throw new Error('Custom worker termination requires adapter.terminate()');
				return this.options.adapter.terminate(workerId, context);
			},
			sendWorkerMessage: (workerId, worker, message, context) =>
				this.sendWorkerMessage(workerId, worker, message, context),
			handleWorkerMessage: (message, source) => this.handleWorkerMessage(message, source),
			logError: (message, error) => this.debugger?.error(message, error),
		});
		this.topology = new WorkerTopologyResolver(this);

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

	get shardEndExclusive() {
		return this.options.shardEndExclusive ?? this.totalShards;
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
		if (shardId < this.shardStart || shardId >= this.shardEndExclusive) {
			throw new SeyfertError('INVALID_SHARD_ID', {
				metadata: {
					...{
						shardId,
						shardStart: this.shardStart,
						shardEndExclusive: this.shardEndExclusive,
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

	waitForWorkerGeneration(
		context: WorkerGenerationContext,
		readiness: WorkerGenerationReadiness = 'ready',
		timeoutMs = WORKER_TIMEOUT_MS,
	) {
		return this.generations.wait(context, readiness, timeoutMs);
	}

	getWorkerGeneration(context: WorkerGenerationContext) {
		return this.generations.get(context);
	}

	getActiveWorkerGeneration(workerId: number) {
		return this.generations.getActive(workerId);
	}

	postMessage(id: number, body: ManagerMessages | WorkerHeartbeaterMessages, target?: WorkerGenerationTarget) {
		return this.generations.postMessage(id, body, target);
	}

	private postWorkerHeartbeat(workerId: number, message: WorkerHeartbeaterMessages) {
		const active = this.generations.getActiveContext(workerId);
		return this.generations.postMessage(workerId, message, active);
	}

	private sendWorkerMessage(
		id: number,
		worker: WorkerGenerationHandle,
		message: ManagerMessages | WorkerHeartbeaterMessages,
		context?: WorkerGenerationContext,
	) {
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
				});
				this.set(i, worker);
				return {
					workerId: i,
					spawnPromise: this.generations.getActiveSpawnPromise(i),
				};
			};
			const registerWorkerHeartbeat = (workerId: number, resharding: boolean) => {
				this.heartbeater.register(workerId, deadWorkerId => {
					return this.generations.recoverDead(deadWorkerId, async () => {
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
			return this.get(workerData.workerId)!;
		}
		return this.generations.create(workerData);
	}

	prepareWorkerGeneration(workerId: number, options: { generation?: number; allocationId?: string } = {}) {
		return this.generations.prepare(workerId, options);
	}

	beginWorkerGenerationCutover(context: WorkerGenerationContext, timeoutMs = WORKER_TIMEOUT_MS) {
		return this.generations.beginCutover(context, timeoutMs);
	}

	activateWorkerGeneration(context: WorkerGenerationContext, timeoutMs = WORKER_TIMEOUT_MS) {
		return this.generations.activate(context, timeoutMs);
	}

	drainWorkerGeneration(context: WorkerGenerationContext, timeoutMs = WORKER_TIMEOUT_MS) {
		return this.generations.drain(context, timeoutMs);
	}

	/**
	 * Fences an unreachable allocation without an acknowledgement.
	 * Only call this after the transport has externally fenced the allocation.
	 */
	fenceWorkerGeneration(context: WorkerGenerationContext) {
		return this.generations.fence(context);
	}

	abortWorkerGeneration(context: WorkerGenerationContext, timeoutMs = WORKER_TIMEOUT_MS) {
		return this.generations.abort(context, timeoutMs);
	}

	commitWorkerGeneration(context: WorkerGenerationContext) {
		return this.generations.commit(context);
	}

	spawn(workerId: number, shardId: number, resharding = false, target?: WorkerGenerationTarget) {
		this.connectQueue.push(() => {
			const worker = target ? this.generations.get({ workerId, ...target }) : this.has(workerId);
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

	async handleWorkerMessage(message: WorkerMessages, source?: WorkerGenerationContext) {
		const incoming = await this.generations.interceptMessage(message, source, () =>
			this.options.handleWorkerMessage?.(message),
		);
		if (!incoming.accepted) return false;
		if (incoming.handled) return true;
		const target = incoming.target;
		switch (message.type) {
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
						this.options.shardEndExclusive = this.options.totalShards = this.options.info.shards = this._info!.shards;
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
	resolveShardTopology() {
		return this.topology.resolve();
	}

	private assertShardTopologyCurrent(topology: ResolvedWorkerShardTopology) {
		if (
			topology.info.shards !== this.options.info.shards ||
			topology.totalShards !== this.totalShards ||
			topology.shardStart !== this.shardStart ||
			topology.shardEndExclusive !== this.shardEndExclusive ||
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
				shardEndExclusive: topology.shardEndExclusive,
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
		if (this.generations.hasTransition())
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
					shardEndExclusive: info.shards,
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
		if (this.shardStart !== 0 || this.shardEndExclusive !== this.totalShards)
			return this.debugger?.debug('Cannot start resharder');
		setInterval(() => {
			void this.checkForResharding().catch(error => {
				this.debugger?.error('WorkerManager resharding check failed', error);
			});
		}, this.options.resharding.interval);
	}
}

export * from './manager-messages';
