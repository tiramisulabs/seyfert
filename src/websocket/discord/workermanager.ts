import cluster, { type Worker as ClusterWorker } from 'node:cluster';
import { randomUUID, type UUID } from 'node:crypto';
import type { Worker as WorkerThreadsWorker } from 'node:worker_threads';
import type { ApiHandler, CustomWorkerManagerEvents, Logger, UsingClient, WorkerClient } from '../..';
import { type Adapter, MemoryAdapter } from '../../cache';
import { type Awaitable, type Identify, lazyLoadPackage, type PickPartial, SeyfertError } from '../../common';
import type { GatewayPresenceUpdateData, GatewaySendPayload, RESTGetAPIGatewayBotResult } from '../../types';
import { properties } from '../constants';
import { DynamicBucket } from '../structures';
import type { ConnectQueue } from '../structures/timeout';
import { Heartbeater, type WorkerHeartbeaterMessages } from './heartbeater';
import type { ResolvedWorkerShardTopology, ShardOptions, WorkerData, WorkerManagerOptions } from './shared';
import { WORKER_TIMEOUT_MS, type WorkerInfo, type WorkerMessages, type WorkerShardInfo } from './worker';
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

type WorkerHandle = (ClusterWorker | WorkerThreadsWorker | { ready?: boolean }) & {
	ready?: boolean;
	disconnected?: boolean;
	resharded?: boolean;
};

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
	private reshardId?: string;
	private reshardingInterval?: ReturnType<typeof setInterval>;
	private readonly spawnPromises = new Map<number, Promise<void>>();
	private readonly topology: WorkerTopologyResolver;
	private startPromise?: Promise<void>;
	heartbeater: Heartbeater;

	constructor(options: WorkerManagerConstructorOptions) {
		super();
		// The constructor permits runtime config values that start() fills before use.
		this.options = { mode: 'threads', ...options } as WorkerManager['options'];
		this.cacheAdapter = new MemoryAdapter();
		this.topology = new WorkerTopologyResolver(this);

		if (this.options.handleWorkerMessage) {
			const oldFn = this.handleWorkerMessage.bind(this);
			this.handleWorkerMessage = async message => {
				await this.options.handleWorkerMessage!(message);
				return oldFn(message);
			};
		}

		this.heartbeater = new Heartbeater(this.postMessage.bind(this), options.heartbeaterInterval ?? 15e3);
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

	postMessage(id: number, body: ManagerMessages | WorkerHeartbeaterMessages) {
		const worker = this.get(id);
		if (!worker) return this.debugger?.error(`Worker ${id} does not exists.`);
		switch (this.options.mode) {
			case 'clusters':
				if ((worker as ClusterWorker).isConnected()) (worker as ClusterWorker).send(body);
				break;
			case 'threads':
				(worker as import('worker_threads').Worker).postMessage(body);
				break;
			case 'custom':
				this.options.adapter.postMessage(id, body);
				break;
		}
	}

	prepareWorkers(shards: number[][], rawResharding = false) {
		for (let i = 0; i < shards.length; i++) {
			const registerWorker = (resharding: boolean, assignedShards = shards[i], totalWorkers = shards.length) => {
				const reshardId = resharding ? this.reshardId : undefined;
				if (resharding && (!this._info || !reshardId)) {
					throw new SeyfertError('INTERNAL_ERROR', {
						metadata: { detail: 'Cannot create a resharding worker without a current reshard attempt' },
					});
				}
				this.createWorker({
					path: this.options.path ?? '',
					debug: this.options.debug,
					token: this.options.token,
					shards: assignedShards,
					intents: this.options.intents,
					workerId: i,
					workerProxy: this.options.workerProxy,
					totalShards: resharding ? this._info!.shards : this.totalShards,
					mode: this.options.mode,
					resharding,
					totalWorkers,
					info: {
						...this.options.info,
						shards: this.totalShards,
					},
					compress: this.options.compress,
					...(reshardId ? { reshardId } : {}),
				});
				return this.spawnPromises.get(i) ?? Promise.resolve();
			};
			const registerWorkerHeartbeat = (workerId: number) => {
				this.heartbeater.register(workerId, async deadWorkerId => {
					this.heartbeater.unregister(deadWorkerId);
					this.delete(deadWorkerId);
					const resharding =
						this.reshardingState === 'running' && this._info !== undefined && this.reshardId !== undefined;
					const currentShards = WorkerManager.prepareSpaces(
						{
							shardsPerWorker: this.shardsPerWorker,
							shardStart: resharding ? 0 : this.shardStart,
							shardEnd: resharding ? this._info!.shards : this.shardEnd,
						},
						this.debugger,
					);
					await registerWorker(resharding, currentShards[deadWorkerId], currentShards.length);
					registerWorkerHeartbeat(deadWorkerId);
				});
			};
			const workerExists = this.has(i);
			if (rawResharding || !workerExists) {
				this[rawResharding ? 'reshardingWorkerQueue' : 'workerQueue'].push(async () => {
					await registerWorker(rawResharding);
					registerWorkerHeartbeat(i);
				});
			}
		}
	}

	createWorker(workerData: WorkerData) {
		if (this.has(workerData.workerId)) {
			if (workerData.resharding) {
				this.postMessage(workerData.workerId, {
					type: 'WORKER_ALREADY_EXISTS_RESHARDING',
					reshardId: workerData.reshardId!,
				} satisfies ManagerWorkerAlreadyExistsResharding);
			}
			const worker = this.get(workerData.workerId)!;
			return worker;
		}
		const env: Record<string, any> = {
			SEYFERT_SPAWNING: 'true',
		};
		if (workerData.resharding) env.SEYFERT_WORKER_RESHARDING = 'true';
		for (const i in workerData) {
			const data = workerData[i as keyof WorkerData];
			env[`SEYFERT_WORKER_${i.toUpperCase()}`] = typeof data === 'object' && data ? JSON.stringify(data) : data;
		}
		switch (this.options.mode) {
			case 'threads': {
				const worker_threads = lazyLoadPackage<typeof import('node:worker_threads')>('node:worker_threads');
				if (!worker_threads)
					throw new SeyfertError('WORKER_THREADS_REQUIRED', {
						metadata: { detail: 'Cannot create worker without worker_threads.' },
					});
				const worker = new worker_threads.Worker(workerData.path, {
					env,
				});
				worker.on('message', data => this.handleWorkerMessage(data));
				worker.on('error', err => {
					this.debugger?.error(`[Worker #${workerData.workerId}]`, err);
				});
				this.set(workerData.workerId, worker);
				return worker;
			}
			case 'clusters': {
				cluster.setupPrimary({
					exec: workerData.path,
				});
				const worker = cluster.fork(env);
				worker.on('message', data => this.handleWorkerMessage(data));
				this.set(workerData.workerId, worker);
				return worker;
			}
			case 'custom': {
				const adapter = this.options.adapter;
				const worker = {
					ready: false,
				};
				this.set(workerData.workerId, worker);
				const spawned = Promise.resolve()
					.then(() => adapter.spawn(workerData, env))
					.then(() => undefined)
					.catch(error => {
						if (this.get(workerData.workerId) === worker) this.delete(workerData.workerId);
						throw error;
					});
				this.spawnPromises.set(workerData.workerId, spawned);
				const cleanSpawn = () => {
					if (this.spawnPromises.get(workerData.workerId) === spawned) this.spawnPromises.delete(workerData.workerId);
				};
				void spawned.then(cleanSpawn, cleanSpawn);
				return worker;
			}
		}
	}

	spawn(workerId: number, shardId: number, reshardId?: string) {
		this.connectQueue.push(() => {
			const worker = this.has(workerId);
			if (!worker) {
				this.debugger?.fatal(`Trying ${reshardId ? 'reshard' : 'spawn'} with worker that doesn't exist`);
				return;
			}
			const presence = this.options.presence?.(shardId, workerId);
			if (reshardId) {
				this.postMessage(workerId, {
					type: 'ALLOW_CONNECT_RESHARDING',
					shardId,
					presence,
					reshardId,
				} satisfies ManagerAllowConnectResharding);
			} else {
				this.postMessage(workerId, { type: 'ALLOW_CONNECT', shardId, presence } satisfies ManagerAllowConnect);
			}
		});
	}

	async handleWorkerMessage(message: WorkerMessages) {
		switch (message.type) {
			case 'ACK_HEARTBEAT':
				this.heartbeater.acknowledge(message.workerId);
				break;
			case 'WORKER_READY_RESHARDING':
				{
					if (this.reshardingState !== 'running' || message.reshardId !== this.reshardId) break;
					const worker = this.get(message.workerId);
					if (!worker) break;
					if (worker.resharded) break;
					worker.resharded = true;
					if (!this.reshardingWorkerQueue.length && [...this.values()].every(w => w.resharded)) {
						for (const [id] of this.entries()) {
							this.postMessage(id, {
								type: 'DISCONNECT_ALL_SHARDS_RESHARDING',
								reshardId: message.reshardId,
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
					if (this.reshardingState !== 'running' || message.reshardId !== this.reshardId) break;
					const worker = this.get(message.workerId);
					if (!worker) break;
					if (worker.disconnected) break;
					worker.disconnected = true;
					if ([...this.values()].every(w => w.disconnected)) {
						const info = this._info;
						if (!info) break;
						this.options.totalShards = info.shards;
						this.options.shardEnd = this.options.totalShards = this.options.info.shards = info.shards;
						this.options.workers = this.size;
						delete this._info;
						for (const [id] of this.entries()) {
							this.postMessage(id, {
								type: 'CONNECT_ALL_SHARDS_RESHARDING',
								totalShards: this.options.totalShards,
								reshardId: message.reshardId,
							} satisfies ConnnectAllShardsResharding);
						}
						this.forEach(w => {
							delete w.disconnected;
						});
						this.reshardId = undefined;
						this.reshardingState = 'idle';
					}
				}
				break;
			case 'WORKER_START_RESHARDING':
				{
					const info = this._info;
					if (!info || this.reshardingState !== 'running' || message.reshardId !== this.reshardId) break;
					this.postMessage(message.workerId, {
						type: 'SPAWN_SHARDS_RESHARDING',
						reshardId: message.reshardId,
						compress: this.options.compress ?? false,
						info: {
							...this.options.info,
							shards: info.shards,
						},
						properties: {
							...properties,
							...this.options.properties,
						},
					} satisfies ManagerSpawnShardsResharding);
				}
				break;
			case 'WORKER_START':
				{
					this.postMessage(message.workerId, {
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
					} satisfies ManagerSpawnShards);
				}
				break;

			case 'CONNECT_QUEUE_RESHARDING':
				if (this.reshardingState === 'running' && message.reshardId === this.reshardId)
					this.spawn(message.workerId, message.shardId, message.reshardId);
				break;
			case 'CONNECT_QUEUE':
				this.spawn(message.workerId, message.shardId);
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
					this.postMessage(message.workerId, {
						type: 'CACHE_RESULT',
						nonce: message.nonce,
						result,
					} as ManagerSendCacheResult);
				}
				break;
			case 'RECEIVE_PAYLOAD':
				await this.options.handlePayload?.(message.shardId, message.workerId, message.payload);
				break;
			case 'RESULT_PAYLOAD':
				{
					const resultPayload = this.promises.get(message.nonce);
					if (!resultPayload) {
						return;
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
						return;
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
						return;
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
					this.postMessage(message.workerId, {
						nonce: message.nonce,
						response,
						type: 'API_RESPONSE',
					} satisfies ManagerSendApiResponse);
				}
				break;
			case 'EVAL_RESPONSE':
				{
					const { nonce, response } = message;
					const evalResponse = this.promises.get(nonce);
					if (!evalResponse) {
						return;
					}
					this.promises.delete(nonce);
					clearTimeout(evalResponse.timeout);
					evalResponse.resolve(response);
				}
				break;
			case 'EVAL_TO_WORKER':
				{
					const nonce = this.generateNonce();
					this.postMessage(message.toWorkerId, {
						nonce,
						func: message.func,
						type: 'EXECUTE_EVAL_TO_WORKER',
						toWorkerId: message.toWorkerId,
						vars: message.vars,
					} satisfies ManagerExecuteEvalToWorker);
					this.generateSendPromise(nonce, 'Eval timeout').then(val =>
						this.postMessage(message.workerId, {
							nonce: message.nonce,
							response: val,
							type: 'EVAL_RESPONSE',
						} satisfies ManagerSendEvalResponse),
					);
				}
				break;
		}
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
	 * Resolves runtime configuration and immutable Discord shard topology
	 * without creating physical workers.
	 */
	resolveShardTopology() {
		return this.topology.resolve();
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
				metadata: { detail: 'WorkerManager shard topology changed after it was resolved' },
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
			this.reshardId = randomUUID();
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
			const firstWorker = this.reshardingWorkerQueue.shift();
			if (!firstWorker)
				throw new SeyfertError('INTERNAL_ERROR', {
					metadata: { detail: 'WorkerManager could not prepare a resharding worker' },
				});
			await firstWorker();
		} catch (error) {
			this.reshardingWorkerQueue = [];
			delete this._info;
			this.reshardId = undefined;
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
		if (this.reshardingInterval) return;
		this.reshardingInterval = setInterval(() => {
			void this.checkForResharding().catch(error => {
				this.debugger?.error('WorkerManager resharding check failed', error);
			});
		}, this.options.resharding.interval);
	}
}

type CreateManagerMessage<T extends string, D extends object = object> = { type: T } & D;

export type ManagerAllowConnect = CreateManagerMessage<
	'ALLOW_CONNECT',
	{ shardId: number; presence?: GatewayPresenceUpdateData }
>;
export type ManagerAllowConnectResharding = CreateManagerMessage<
	'ALLOW_CONNECT_RESHARDING',
	{ shardId: number; presence?: GatewayPresenceUpdateData; reshardId: string }
>;
export type ManagerWorkerAlreadyExistsResharding = CreateManagerMessage<
	'WORKER_ALREADY_EXISTS_RESHARDING',
	{ reshardId: string }
>;
export type ManagerSpawnShards = CreateManagerMessage<
	'SPAWN_SHARDS',
	Pick<ShardOptions, 'info' | 'properties' | 'compress'>
>;
export type ManagerSpawnShardsResharding = CreateManagerMessage<
	'SPAWN_SHARDS_RESHARDING',
	Pick<ShardOptions, 'info' | 'properties' | 'compress'> & { reshardId: string }
>;
export type DisconnectAllShardsResharding = CreateManagerMessage<
	'DISCONNECT_ALL_SHARDS_RESHARDING',
	{ reshardId: string }
>;
export type ConnnectAllShardsResharding = CreateManagerMessage<
	'CONNECT_ALL_SHARDS_RESHARDING',
	{
		totalShards: number;
		reshardId: string;
	}
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
	| ManagerExecuteEval;

export type CustomManagerMessages = {
	[K in keyof CustomWorkerManagerEvents]: Identify<
		{
			type: K;
		} & Identify<CustomWorkerManagerEvents[K] extends never ? {} : CustomWorkerManagerEvents[K]>
	>;
};

export type ManagerMessages =
	| {
			[K in BaseManagerMessages['type']]: Identify<Extract<BaseManagerMessages, { type: K }>>;
	  }[BaseManagerMessages['type']]
	| CustomManagerMessages[keyof CustomManagerMessages];
