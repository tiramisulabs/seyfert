import cluster, { type Worker as ClusterWorker } from 'node:cluster';
import { randomUUID, type UUID } from 'node:crypto';
import type { Worker as WorkerThreadsWorker } from 'node:worker_threads';
import {
	ApiHandler,
	type CustomWorkerManagerEvents,
	Logger,
	LogLevels,
	type UsingClient,
	type WorkerClient,
} from '../..';
import { type Adapter, MemoryAdapter } from '../../cache';
import { BaseClient, type InternalRuntimeConfig } from '../../client/base';
import {
	type Awaitable,
	BASE_HOST,
	type Identify,
	isPromiseLike,
	lazyLoadPackage,
	type MakeRequired,
	MergeOptions,
	type PickPartial,
	SeyfertError,
} from '../../common';
import type { GatewayPresenceUpdateData, GatewaySendPayload, RESTGetAPIGatewayBotResult } from '../../types';
import { properties, WorkerManagerDefaults } from '../constants';
import { DynamicBucket } from '../structures';
import { ConnectQueue } from '../structures/timeout';
import { Heartbeater, type WorkerHeartbeaterMessages } from './heartbeater';
import type { ShardData, ShardOptions, WorkerData, WorkerManagerOptions } from './shared';
import {
	WORKER_TIMEOUT_MS,
	type WorkerHotReloadAck,
	type WorkerHotReloadRequestOptions,
	type WorkerInfo,
	type WorkerMessages,
	type WorkerRequestHotReload,
	type WorkerShardInfo,
} from './worker';
import { deserializeWorkerError, serializeWorkerError } from './worker-errors';

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
type WorkerManagerRuntimeOptionalKeys = 'adapter' | 'handleWorkerMessage' | 'handlePayload' | 'getRC' | 'workerEnv';
type WorkerManagerCustomRuntimeOptionalKeys = 'handleWorkerMessage' | 'handlePayload' | 'getRC' | 'workerEnv';
type WorkerManagerRuntimeOptions =
	| PickPartial<Required<WorkerManagerNativeOptions>, WorkerManagerRuntimeOptionalKeys>
	| (PickPartial<Required<Omit<WorkerManagerCustomOptions, 'path'>>, WorkerManagerCustomRuntimeOptionalKeys> & {
			path?: string;
	  });
type WorkerState = {
	ready?: boolean;
	disconnected?: boolean;
	resharded?: boolean;
};
type CustomWorker = { ready?: boolean } & WorkerState;
type ManagedWorker = (ClusterWorker | WorkerThreadsWorker | { ready?: boolean }) & WorkerState;
type PendingReplacement = {
	ready: Promise<void>;
	exited: Promise<never>;
	started(): void;
	markReady(): void;
	fail(error: unknown): void;
};
type HotReloadRequester = { workerId: number; generation: number; nonce: string; answered: boolean };

/** Extra time a draining worker gets to close its shards and answer after `drainTimeout`. */
const HOT_RELOAD_DRAIN_GRACE_MS = 5_000;
/** Stopping and activating are one round trip each; nobody handles events while they wait. */
const HOT_RELOAD_SWITCH_TIMEOUT_MS = 5_000;

function instanceKey(workerId: number, generation: number) {
	return `${workerId}:${generation}`;
}

export class WorkerManager extends Map<number, ManagedWorker> {
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
	heartbeater: Heartbeater;
	/** The instance each worker id currently routes to; unset means generation 0. */
	private generations = new Map<number, number>();
	/** Replacements still connecting and workers draining after a hot reload, by `workerId:generation`. */
	private standbyWorkers = new Map<string, ManagedWorker>();
	private pendingReplacements = new Map<string, PendingReplacement>();
	private lastGeneration = 0;
	private hotReloading = false;
	/** The worker being switched by a hot reload; heartbeat respawns leave it alone meanwhile. */
	private switchingWorkerId?: number;
	/** Set once BOT_READY was sent; hot reload waits for it. */
	private allWorkersReady = false;

	constructor(options: WorkerManagerConstructorOptions) {
		super();
		// The constructor permits runtime config values that start() fills before use.
		this.options = { mode: 'threads', ...options } as WorkerManager['options'];
		this.cacheAdapter = new MemoryAdapter();

		if (this.options.handleWorkerMessage) {
			const oldFn = this.handleWorkerMessage.bind(this);
			this.handleWorkerMessage = async (message, generation = this.activeGeneration(message.workerId)) => {
				await this.options.handleWorkerMessage!(message);
				return oldFn(message, generation);
			};
		}

		this.heartbeater = new Heartbeater((workerId, message) => {
			this.observe(() => this.postMessage(workerId, message), `[Worker #${workerId}] heartbeat sending failed`);
		}, options.heartbeaterInterval ?? 15e3);
	}

	private reportError(message: string, error: unknown) {
		// Keep the fallback logger local so one failure doesn't turn on debug output for the whole manager.
		(this.debugger ?? new Logger({ name: '[WorkerManager]', logLevel: LogLevels.Info })).error(message, error);
	}

	private observe(operation: () => Awaitable<unknown>, message: string) {
		try {
			void Promise.resolve(operation()).catch(error => {
				this.reportError(message, error);
			});
		} catch (error) {
			this.reportError(message, error);
		}
	}

	/** Configure the backend before starting workers; optional cache capabilities are negotiated at worker startup. */
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
			throw this.createWorkerNotFoundError(id);
		}

		const data = await this.getWorkerInfo(id);
		if (!data.shards.length) return 0;

		return data.shards.reduce((acc, prv) => acc + prv.latency, 0) / data.shards.length;
	}

	calculateShardId(guildId: string) {
		return Number((BigInt(guildId) >> 22n) % BigInt(this.totalShards));
	}

	private createWorkerNotFoundError(workerId: number) {
		return new SeyfertError('WORKER_NOT_FOUND', {
			metadata: { workerId, detail: `Worker #${workerId} doesn't exist` },
		});
	}

	calculateWorkerId(shardId: number) {
		const minimumShardId = this.shardStart;
		const maximumShardId = this.shardEnd - 1;

		if (shardId < minimumShardId || shardId > maximumShardId) {
			throw new SeyfertError('INVALID_SHARD_ID', {
				metadata: {
					shardId,
					minimumShardId,
					maximumShardId,
					detail: `Invalid shardId ${shardId}: expected ${minimumShardId}..${maximumShardId}.`,
				},
			});
		}

		return Math.floor((shardId - minimumShardId) / this.shardsPerWorker);
	}

	async postMessage(id: number, body: ManagerMessages | WorkerHeartbeaterMessages): Promise<void> {
		return this.postToInstance(id, this.activeGeneration(id), body);
	}

	private activeGeneration(workerId: number) {
		return this.generations.get(workerId) ?? 0;
	}

	private findInstance(workerId: number, generation: number) {
		if (generation === this.activeGeneration(workerId)) return this.get(workerId);
		return this.standbyWorkers.get(instanceKey(workerId, generation));
	}

	private async postToInstance(
		id: number,
		generation: number,
		body: ManagerMessages | WorkerHeartbeaterMessages,
	): Promise<void> {
		const worker = this.findInstance(id, generation);
		if (!worker) throw this.createWorkerNotFoundError(id);
		switch (this.options.mode) {
			case 'clusters': {
				const clusterWorker = worker as ClusterWorker;
				if (!clusterWorker.isConnected()) {
					throw new SeyfertError('INTERNAL_ERROR', {
						metadata: {
							workerId: id,
							mode: this.options.mode,
							detail: `Cannot send to disconnected worker #${id}.`,
						},
					});
				}
				await new Promise<void>((resolve, reject) => {
					clusterWorker.send(body, error => {
						if (error) reject(error);
						else resolve();
					});
				});
				return;
			}
			case 'threads':
				(worker as import('worker_threads').Worker).postMessage(body);
				return;
			case 'custom':
				await this.options.adapter.postMessage(id, body, generation);
		}
	}

	prepareWorkers(shards: number[][], rawResharding = false) {
		const worker_threads = lazyLoadPackage<typeof import('node:worker_threads')>('node:worker_threads');
		if (!worker_threads)
			throw new SeyfertError('WORKER_THREADS_REQUIRED', {
				metadata: { detail: 'Cannot prepare workers without worker_threads.' },
			});

		for (let i = 0; i < shards.length; i++) {
			const registerWorker = async (resharding: boolean) => {
				const worker = await this.createWorkerAsync(this.createWorkerData(i, shards[i], shards.length, resharding));
				this.set(i, worker);
				// A respawned worker starts as generation 0 again, even after a hot reload.
				this.generations.delete(i);
				return i;
			};
			const registerWorkerHeartbeat = (workerId: number, resharding: boolean) => {
				this.heartbeater.register(workerId, deadWorkerId => {
					// A hot reload is swapping this worker's entry right now and settles it itself.
					if (this.switchingWorkerId === deadWorkerId) return;
					this.heartbeater.unregister(deadWorkerId);
					this.delete(deadWorkerId);
					this.observe(
						() => registerWorker(resharding).then(newWorkerId => registerWorkerHeartbeat(newWorkerId, resharding)),
						`[Worker #${deadWorkerId}] replacement failed`,
					);
				});
			};
			const workerExists = this.has(i);
			if (rawResharding || !workerExists) {
				this[rawResharding ? 'reshardingWorkerQueue' : 'workerQueue'].push(async () => {
					registerWorkerHeartbeat(await registerWorker(rawResharding), rawResharding);
				});
			}
		}
	}

	private createWorkerData(workerId: number, shards: number[], totalWorkers: number, resharding: boolean): WorkerData {
		return {
			path: this.options.path ?? '',
			debug: this.options.debug,
			token: this.options.token,
			shards,
			intents: this.options.intents,
			workerId,
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
		};
	}

	createWorker(workerData: WorkerData & { mode: 'threads' }): WorkerThreadsWorker;
	createWorker(workerData: WorkerData & { mode: 'clusters' }): ClusterWorker;
	createWorker(workerData: WorkerData & { mode: 'custom' }): Awaitable<CustomWorker>;
	createWorker(workerData: WorkerData): Awaitable<ManagedWorker>;
	createWorker(workerData: WorkerData): Awaitable<ManagedWorker> {
		return this.createWorkerInternal(workerData);
	}

	private createWorkerAsync(workerData: WorkerData): Promise<ManagedWorker> {
		return Promise.resolve(this.createWorkerInternal(workerData));
	}

	private createWorkerInternal(workerData: WorkerData): ManagedWorker | Promise<ManagedWorker> {
		if (workerData.mode !== this.options.mode) {
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: {
					workerId: workerData.workerId,
					detail: `Worker mode ${workerData.mode} does not match manager mode ${this.options.mode}.`,
				},
			});
		}
		if (this.has(workerData.workerId)) {
			const worker = this.get(workerData.workerId)!;
			if (workerData.resharding) {
				this.observe(
					() =>
						this.postMessage(workerData.workerId, {
							type: 'WORKER_ALREADY_EXISTS_RESHARDING',
						} satisfies ManagerWorkerAlreadyExistsResharding),
					`[Worker #${workerData.workerId}] resharding restart message sending failed`,
				);
			}
			return worker;
		}
		return this.launchWorker(workerData, {
			add: worker => this.set(workerData.workerId, worker),
			remove: worker => {
				if (this.get(workerData.workerId) === worker) this.delete(workerData.workerId);
			},
		});
	}

	/**
	 * Starts a worker process for `workerData` without registering it as the active worker. Custom workers are
	 * tracked before their adapter spawns them, so messages sent while spawning already find their entry.
	 */
	private launchWorker(
		workerData: WorkerData,
		tracking: { add(worker: ManagedWorker): void; remove(worker: ManagedWorker): void },
	): ManagedWorker | Promise<ManagedWorker> {
		const worker_threads = lazyLoadPackage<typeof import('node:worker_threads')>('node:worker_threads');
		if (!worker_threads)
			throw new SeyfertError('WORKER_THREADS_REQUIRED', {
				metadata: { detail: 'Cannot create worker without worker_threads.' },
			});
		const generation = workerData.generation ?? 0;
		const env: Record<string, any> = {
			...this.options.workerEnv,
			SEYFERT_SPAWNING: 'true',
		};
		if (workerData.resharding) env.SEYFERT_WORKER_RESHARDING = 'true';
		for (const i in workerData) {
			const data = workerData[i as keyof WorkerData];
			env[`SEYFERT_WORKER_${i.toUpperCase()}`] = typeof data === 'object' && data ? JSON.stringify(data) : data;
		}
		switch (this.options.mode) {
			case 'threads': {
				const worker = new worker_threads.Worker(workerData.path, {
					env: { ...process.env, ...env },
				});
				worker.on('message', data =>
					this.observe(
						() => this.handleWorkerMessage(data, generation),
						`[Worker #${workerData.workerId}] message handling failed`,
					),
				);
				worker.on('error', err => {
					this.debugger?.error(`[Worker #${workerData.workerId}]`, err);
				});
				return worker;
			}
			case 'clusters': {
				cluster.setupPrimary({
					exec: workerData.path,
				});
				const worker = cluster.fork(env);
				worker.on('message', data =>
					this.observe(
						() => this.handleWorkerMessage(data, generation),
						`[Worker #${workerData.workerId}] message handling failed`,
					),
				);
				return worker;
			}
			case 'custom': {
				const worker = {
					ready: false,
				};
				tracking.add(worker);
				try {
					const spawnResult = this.options.adapter.spawn(workerData, env);
					if (!isPromiseLike(spawnResult)) return worker;
					return Promise.resolve(spawnResult).then(
						() => worker,
						error => {
							tracking.remove(worker);
							throw error;
						},
					);
				} catch (error) {
					tracking.remove(worker);
					throw error;
				}
			}
		}
	}

	/**
	 * Queues a shard connection for a worker. `generation` targets a specific worker instance, such as a hot
	 * reload replacement; it defaults to the instance active when the connection is queued.
	 */
	spawn(
		workerId: number,
		shardId: number,
		resharding = false,
		generation = this.activeGeneration(workerId),
	): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.connectQueue.push(() => {
				if (!this.findInstance(workerId, generation)) {
					const error = this.createWorkerNotFoundError(workerId);
					this.debugger?.fatal(`Trying ${resharding ? 'reshard' : 'spawn'} with worker that doesn't exist`);
					reject(error);
					return;
				}
				void this.postToInstance(workerId, generation, {
					type: resharding ? 'ALLOW_CONNECT_RESHARDING' : 'ALLOW_CONNECT',
					shardId,
					presence: this.options.presence?.(shardId, workerId),
				} satisfies ManagerAllowConnect | ManagerAllowConnectResharding).then(resolve, reject);
			});
		});
	}

	/**
	 * Handles a message from a worker. `generation` identifies the instance that sent it (see
	 * {@link CustomManagerAdapter.postMessage}); when omitted the message is treated as coming from the active
	 * instance. Replies go back to the instance that sent the request.
	 */
	async handleWorkerMessage(message: WorkerMessages, generation = this.activeGeneration(message.workerId)) {
		// A hot reload replacement still connecting, or a worker draining after one.
		const standby = generation !== this.activeGeneration(message.workerId);
		const standbyKey = standby ? instanceKey(message.workerId, generation) : '';
		// Replies go to the instance that asked, even if a hot reload swaps it out while the request runs.
		const reply = (body: ManagerMessages) => this.postToInstance(message.workerId, generation, body);
		switch (message.type) {
			case 'ACK_HEARTBEAT':
				if (!standby) this.heartbeater.acknowledge(message.workerId);
				break;
			case 'WORKER_READY_RESHARDING':
				if (standby) break;
				{
					this.get(message.workerId)!.resharded = true;
					if (!this.reshardingWorkerQueue.length && [...this.values()].every(w => w.resharded)) {
						for (const [id] of this.entries()) {
							await this.postMessage(id, {
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
							this.observe(nextWorker, 'Resharding worker spawn failed');
						} else {
							this.debugger?.info('No more workers to reshard left');
						}
					}
				}
				break;
			case 'DISCONNECTED_ALL_SHARDS_RESHARDING':
				if (standby) break;
				{
					this.get(message.workerId)!.disconnected = true;
					if ([...this.values()].every(w => w.disconnected)) {
						this.options.totalShards = this._info!.shards;
						this.options.shardEnd = this.options.totalShards = this.options.info.shards = this._info!.shards;
						this.options.workers = this.size;
						delete this._info;
						for (const [id] of this.entries()) {
							await this.postMessage(id, {
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
			case 'WORKER_START_RESHARDING':
				if (standby) break;
				{
					await this.postMessage(message.workerId, {
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
					} satisfies ManagerSpawnShardsResharding);
				}
				break;
			case 'WORKER_START':
				{
					// A replacement that reached this point loaded its code and finished setup.
					if (standby) this.pendingReplacements.get(standbyKey)?.started();
					await reply({
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
				if (standby) break;
				this.observe(
					() => this.spawn(message.workerId, message.shardId, true),
					`[Worker #${message.workerId}] resharding shard connection failed`,
				);
				break;
			case 'CONNECT_QUEUE':
				await this.spawn(message.workerId, message.shardId, false, generation);
				break;
			case 'CACHE_REQUEST':
				{
					const worker = standby ? this.standbyWorkers.has(standbyKey) : this.has(message.workerId);
					if (!worker) {
						throw new SeyfertError('INVALID_WORKER_REQUEST', {
							metadata: { detail: 'Invalid request from unavailable worker' },
						});
					}
					let response: ManagerSendCacheResult;
					try {
						const result =
							message.method === 'capabilities'
								? { increment: typeof this.cacheAdapter.increment === 'function' }
								: // @ts-expect-error The request's method determines its argument tuple.
									await this.cacheAdapter[message.method](...message.args);
						response = { type: 'CACHE_RESULT', nonce: message.nonce, result };
					} catch (error) {
						response = { type: 'CACHE_RESULT', nonce: message.nonce, error: serializeWorkerError(error) };
					}
					await reply(response);
				}
				break;
			case 'RECEIVE_PAYLOAD':
				await this.options.handlePayload?.(message.shardId, message.workerId, message.payload);
				break;
			case 'RESULT_PAYLOAD':
			case 'HOT_RELOAD_ACK':
				{
					const resultPayload = this.promises.get(message.nonce);
					if (!resultPayload) {
						return;
					}
					this.promises.delete(message.nonce);
					clearTimeout(resultPayload.timeout);
					resultPayload.resolve(message.type === 'HOT_RELOAD_ACK' ? message : true);
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
				if (standby) {
					this.pendingReplacements.get(standbyKey)?.markReady();
					break;
				}
				{
					this.get(message.workerId)!.ready = true;
					if (this.size === this.totalWorkers && [...this.values()].every(w => w.ready)) {
						await this.postMessage(this.keys().next().value!, {
							type: 'BOT_READY',
						} satisfies ManagerSendBotReady);
						this.allWorkersReady = true;
						this.forEach(w => {
							delete w.ready;
						});
					}
				}
				break;
			case 'WORKER_SHARDS_CONNECTED':
				if (standby) break;
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
					const encodedResponse = response instanceof ArrayBuffer ? Array.from(new Uint8Array(response)) : response;
					const responseType = response instanceof ArrayBuffer ? 'arrayBuffer' : undefined;
					await reply({
						nonce: message.nonce,
						response: encodedResponse,
						responseType,
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
					const target = {
						nonce,
						func: message.func,
						type: 'EXECUTE_EVAL_TO_WORKER',
						toWorkerId: message.toWorkerId,
						vars: message.vars,
					} satisfies ManagerExecuteEvalToWorker;
					// A replacement can evaluate itself from a readiness handler before it is promoted.
					const evaluateSelf =
						standby && this.switchingWorkerId === message.workerId && message.toWorkerId === message.workerId;
					const response = await this.sendRequest(nonce, 'Worker evaluation', () =>
						evaluateSelf
							? this.postToInstance(message.toWorkerId, generation, target)
							: this.postMessage(message.toWorkerId, target),
					);
					await reply({
						nonce: message.nonce,
						response,
						type: 'EVAL_RESPONSE',
					} satisfies ManagerSendEvalResponse);
				}
				break;
			case 'HOT_RELOAD_REQUEST':
				// The reload outlives this message, and the requester may be replaced while it runs.
				this.observe(
					() => this.answerHotReloadRequest(message, generation),
					`[Worker #${message.workerId}] hot reload request failed`,
				);
				break;
		}
	}

	private generateNonce(): UUID {
		const uuid = randomUUID();
		if (this.promises.has(uuid)) return this.generateNonce();
		return uuid;
	}

	private generateSendPromise<T = unknown>(
		nonce: string,
		operation = 'Worker request',
		timeoutMs = WORKER_TIMEOUT_MS,
	): Promise<T> {
		return new Promise<T>((res, rej) => {
			const timeout = setTimeout(() => {
				this.promises.delete(nonce);
				rej(
					new SeyfertError('WORKER_TIMEOUT', {
						metadata: { nonce, operation, detail: `${operation} timed out (nonce: ${nonce}).` },
					}),
				);
			}, timeoutMs);
			this.promises.set(nonce, { resolve: res, timeout });
		});
	}

	private async sendRequest<T>(
		nonce: string,
		operation: string,
		send: () => Awaitable<unknown>,
		timeoutMs?: number,
		interrupted?: Promise<never>,
	): Promise<T> {
		const response = this.generateSendPromise<T>(nonce, operation, timeoutMs);
		try {
			const request = Promise.all([response, send()]);
			const [result] = await (interrupted ? Promise.race([request, interrupted]) : request);
			return result;
		} catch (error) {
			const pending = this.promises.get(nonce);
			if (pending) {
				this.promises.delete(nonce);
				clearTimeout(pending.timeout);
			}
			throw error;
		}
	}

	async send(data: GatewaySendPayload, shardId: number) {
		const workerId = this.calculateWorkerId(shardId);
		const worker = this.has(workerId);

		if (!worker) {
			throw this.createWorkerNotFoundError(workerId);
		}

		const payload = await this.resolveSendPayload(shardId, data);
		if (!payload) return false;

		const nonce = this.generateNonce();

		return this.sendRequest<true>(nonce, 'Shard payload send', () =>
			this.postMessage(workerId, {
				type: 'SEND_PAYLOAD',
				shardId,
				nonce,
				...payload,
			} satisfies ManagerSendPayload),
		);
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
			throw this.createWorkerNotFoundError(workerId);
		}

		const nonce = this.generateNonce();

		return this.sendRequest<WorkerShardInfo>(nonce, 'Shard info request', () =>
			this.postMessage(workerId, { shardId, nonce, type: 'SHARD_INFO' } satisfies ManagerRequestShardInfo),
		);
	}

	async getWorkerInfo(workerId: number) {
		const worker = this.has(workerId);

		if (!worker) {
			throw this.createWorkerNotFoundError(workerId);
		}

		const nonce = this.generateNonce();

		return this.sendRequest<WorkerInfo>(nonce, 'Worker info request', () =>
			this.postMessage(workerId, { nonce, type: 'WORKER_INFO' } satisfies ManagerRequestWorkerInfo),
		);
	}

	async tellWorker<R, V extends Record<string, unknown>>(
		workerId: number,
		func: (_: WorkerClient & UsingClient, vars: V) => R,
		vars: V,
	) {
		const nonce = this.generateNonce();
		return this.sendRequest<R>(nonce, 'Worker request', () =>
			this.postMessage(workerId, {
				type: 'EXECUTE_EVAL',
				func: func.toString(),
				nonce,
				vars: JSON.stringify(vars),
			} satisfies ManagerExecuteEval),
		);
	}

	tellWorkers<R, V extends Record<string, unknown>>(func: (_: WorkerClient & UsingClient, vars: V) => R, vars: V) {
		const promises: Promise<R>[] = [];
		for (const i of this.keys()) {
			promises.push(this.tellWorker(i, func, vars));
		}
		return Promise.all(promises);
	}

	/**
	 * Replaces running workers with freshly spawned ones that load all code from disk again, one worker at a time,
	 * while each replacement prepares. The manager process itself is not reloaded.
	 *
	 * For each worker, a replacement with the same id and shards identifies new gateway sessions (through the
	 * connect queue, with the configured presence) and builds its cache while the old worker keeps handling
	 * everything. Once all of its shards are ready, the old worker stops handling events and the replacement
	 * starts; its skipped `ready`, `workerShardsConnected`, `workerReady` and, on the first worker, `botReady`
	 * handlers run then. The old worker finishes in-flight work for up to `drainTimeout`, requests normal
	 * (1000) shard closure and exits.
	 *
	 * This is a best-effort rolling restart. Independent gateway sessions can lose or duplicate events around
	 * the switch, including cache updates. It provides no lossless or exactly-once delivery guarantee, as with
	 * resharding. Applications that require those guarantees must not rely on hot reload for them.
	 * If a replacement crashes, fails to load or is not ready within `readyTimeout`, it is stopped and the old worker
	 * keeps running untouched; the reload then stops unless `continueOnError` is set.
	 *
	 * The replacement is built from the manager's configuration: it identifies with the configured presence, so a
	 * presence set at runtime is reset, and it connects the worker's configured shards, not ones added at runtime.
	 * Collectors, cooldowns and other application state in the old process are not transferred. Each replacement
	 * identifies new sessions and consumes the gateway session-start allowance.
	 *
	 * A memory cache belongs to its worker, so the replacement builds its own. Any other adapter is treated as shared
	 * and is left to the active worker: the replacement doesn't write to it until it takes over, and the old worker
	 * stops admitting new dispatches once it is replaced; already accepted work may still finish while draining.
	 * Plugin setup, dispatch interceptors and cache adapter startup run during preparation. Event handlers,
	 * collectors and the user handlePayload hook wait for activation. Plugin teardown is attempted after draining
	 * before normal shard close requests and termination; the manager's retirement deadline still applies.
	 * Custom mode needs an adapter that implements
	 * {@link CustomManagerAdapter.terminate} and routes messages by generation.
	 *
	 * The replacement is a whole new process or thread, so it also runs the app's own startup while it prepares
	 * next to the old worker: services, timers, database or Redis subscribers, anything started before or around
	 * `client.start()`. Work that must not run twice, like answering requests or background jobs, should check
	 * `client.hotReloadState` or `client.isHotReloadReplacement`, or start and stop in the `hotReload` client hooks
	 * (`onStandby`, `onActivate`, `onStop`, `onDrain`; see `WorkerHotReloadHooks`). The old and replacement
	 * workers can run their hooks concurrently. Jobs that require one owner across workers need app-level coordination.
	 *
	 * In `'clusters'` mode a drained worker ends with `worker.kill()`, which disconnects it and sends SIGTERM; the
	 * process often exits on the disconnect before a SIGTERM handler runs, and on Windows it is terminated outright.
	 * Shutdown work for a hot reload, such as final saves, belongs in `onDrain`. An app's own SIGTERM or exit
	 * handlers that announce a restart should check `client.hotReloadState === 'stopped'` and skip that, since the
	 * bot isn't going down.
	 *
	 * With `trackMemberCount`, a replacement with its own memory cache takes each guild's member count from the
	 * GUILD_CREATE it receives when it connects; a shared cache keeps the counts the active worker maintains.
	 *
	 * @example
	 * ```ts
	 * const client = new WorkerClient({
	 * 	hotReload: {
	 * 		// The replacement starts its jobs once it handles events, and so does an old worker taking them back.
	 * 		onActivate: () => jobs.start(),
	 * 		onStop: () => jobs.stop(),
	 * 		// Awaited up to drainTimeout while REST still works.
	 * 		onDrain: () => players.saveAll(),
	 * 	},
	 * });
	 * // A worker started normally runs its jobs right away; a replacement waits for onActivate.
	 * if (!client.isHotReloadReplacement) jobs.start();
	 * process.on('SIGTERM', async () => {
	 * 	// Retired by a hot reload, not a real shutdown: its saves already ran in onDrain.
	 * 	if (client.hotReloadState !== 'stopped') await announceRestart();
	 * 	process.exit(0);
	 * });
	 * ```
	 *
	 * @throws {SeyfertError} `HOT_RELOAD_IN_PROGRESS` while another reload runs, `HOT_RELOAD_UNSUPPORTED` before
	 * every worker is ready (BOT_READY), during resharding, or in custom mode without `terminate`, and `WORKER_NOT_FOUND` for an
	 * unknown worker id.
	 */
	hotReload(options: HotReloadOptions = {}): Promise<HotReloadResult> {
		return this.runHotReload(options);
	}

	/**
	 * Reports that a worker instance exited. A hot reload replacement that exits before it takes over fails its
	 * reload. Thread and cluster workers are watched automatically; custom adapters call this themselves.
	 */
	handleWorkerExit(workerId: number, generation: number, error?: unknown) {
		this.pendingReplacements
			.get(instanceKey(workerId, generation))
			?.fail(error ?? new Error(`Worker #${workerId} exited before it was ready`));
	}

	private async runHotReload(options: HotReloadOptions, requester?: HotReloadRequester): Promise<HotReloadResult> {
		if (this.hotReloading) {
			throw new SeyfertError('HOT_RELOAD_IN_PROGRESS', {
				metadata: { detail: 'Wait for the running hot reload to finish before starting another one.' },
			});
		}
		// Swapping a worker before startup completes would lose its readiness and with it BOT_READY.
		const unsupported =
			options.resumeSession && (requester || this.options.mode === 'custom' || this.shardsPerWorker !== 1)
				? 'Session handoff requires a manager request and one shard per native worker.'
				: !this.allWorkersReady
					? 'Wait until every worker is ready (BOT_READY) before hot reloading.'
					: this._info
						? 'Cannot hot reload workers while resharding.'
						: this.options.mode === 'custom' && !this.options.adapter.terminate
							? 'Custom mode needs an adapter that implements terminate().'
							: undefined;
		if (unsupported) throw new SeyfertError('HOT_RELOAD_UNSUPPORTED', { metadata: { detail: unsupported } });

		const workerIds = options.workerIds ?? [...this.keys()].sort((a, b) => a - b);
		for (const workerId of workerIds) {
			if (!this.has(workerId)) throw this.createWorkerNotFoundError(workerId);
		}

		this.hotReloading = true;
		const result: HotReloadResult = { workers: [] };
		try {
			for (const workerId of workerIds) {
				const entry = await this.hotReloadWorker(workerId, options, result, requester);
				if (!entry.ok && !options.continueOnError) break;
			}
			return result;
		} finally {
			this.hotReloading = false;
		}
	}

	private async hotReloadWorker(
		workerId: number,
		options: HotReloadOptions,
		result: HotReloadResult,
		requester?: HotReloadRequester,
	): Promise<HotReloadWorkerResult> {
		const startedAt = Date.now();
		const generation = ++this.lastGeneration;
		const key = instanceKey(workerId, generation);
		const report = (stage: HotReloadStage, error?: string) => {
			try {
				options.onProgress?.(error === undefined ? { workerId, stage } : { workerId, stage, error });
			} catch (callbackError) {
				this.reportError(`[Worker #${workerId}] hot reload progress callback failed`, callbackError);
			}
		};
		const finish = (error?: unknown): HotReloadWorkerResult => {
			const entry: HotReloadWorkerResult = { workerId, ok: error === undefined, ms: Date.now() - startedAt };
			if (error !== undefined) {
				entry.error = error instanceof Error ? error.message : String(error);
				report('failed', entry.error);
			}
			result.workers.push(entry);
			return entry;
		};
		const discard = async () => {
			this.pendingReplacements.delete(key);
			const replacement = this.standbyWorkers.get(key);
			this.standbyWorkers.delete(key);
			if (replacement && options.resumeSession && this.options.mode === 'clusters') {
				// A candidate that replayed before losing its ACK must be gone before the original resumes.
				const clusterWorker = replacement as ClusterWorker;
				if (!clusterWorker.isDead()) {
					await new Promise<void>((resolve, reject) => {
						const onExit = () => resolve();
						clusterWorker.once('exit', onExit);
						try {
							clusterWorker.kill('SIGKILL');
						} catch (error) {
							clusterWorker.off('exit', onExit);
							reject(error);
						}
					});
				}
			} else if (replacement) {
				await Promise.resolve(this.terminateInstance(workerId, generation, replacement)).catch(error =>
					this.reportError(`[Worker #${workerId}] failed to stop the hot reload replacement`, error),
				);
			}
		};

		report('spawning');
		const pending = this.createPendingReplacement(key, () => report('connecting'));
		const shards = WorkerManager.prepareSpaces({
			shardStart: this.shardStart,
			shardEnd: this.shardEnd,
			shardsPerWorker: this.shardsPerWorker,
		})[workerId];
		// The connect queue lets `concurrency` shards identify every 5.5s, so a worker with many shards needs longer.
		const readyTimeout = options.readyTimeout ?? 60_000 + Math.ceil(shards.length / this.concurrency) * 5_500;
		let timer: NodeJS.Timeout | undefined;
		try {
			const workerData = {
				...this.createWorkerData(workerId, shards, this.totalWorkers, false),
				hotReload: true,
				generation,
			};
			// The deadline covers spawning too, so an adapter whose spawn never settles cannot hold the reload.
			await Promise.race([
				pending.exited,
				(async () => {
					const tracking = {
						add: (worker: ManagedWorker) => this.standbyWorkers.set(key, worker),
						remove: (worker: ManagedWorker) => {
							if (this.standbyWorkers.get(key) === worker) this.standbyWorkers.delete(key);
						},
					};
					const replacement = await this.launchWorker(workerData, tracking);
					if (!this.pendingReplacements.has(key)) {
						// The deadline passed while spawning; the reload already moved on.
						tracking.remove(replacement);
						await this.terminateInstance(workerId, generation, replacement);
						return;
					}
					this.standbyWorkers.set(key, replacement);
					this.watchExit(replacement, workerId, generation);
					await pending.ready;
				})(),
				new Promise<never>((_, reject) => {
					timer = setTimeout(
						() =>
							reject(
								new SeyfertError('WORKER_TIMEOUT', {
									metadata: {
										workerId,
										detail: `Worker #${workerId} replacement was not ready within ${readyTimeout}ms.`,
									},
								}),
							),
						readyTimeout,
					);
				}),
			]);
			report('ready');
		} catch (error) {
			await discard();
			return finish(error);
		} finally {
			clearTimeout(timer);
		}

		// Stop admitting work on the old worker before activating its replacement. Independent gateway
		// sessions can still deliver duplicate events or miss events around this switch.
		report('switching');
		// Until the entry is swapped, a heartbeat respawn would replace the worker this switch is stopping.
		const previous = this.get(workerId);
		if (!previous) {
			// A heartbeat respawn is still replacing the old worker; this replacement would race it.
			await discard();
			return finish(this.createWorkerNotFoundError(workerId));
		}
		this.switchingWorkerId = workerId;
		const drainTimeout = options.drainTimeout ?? 10_000;
		const previousGeneration = this.activeGeneration(workerId);
		let activationError: unknown;
		// The old worker keeps or regains dispatch. Sent after a STOP on the same channel, it also undoes a late one.
		const resumePrevious = () =>
			this.requestHotReloadStep(
				workerId,
				previousGeneration,
				{
					type: 'HOT_RELOAD_ACTIVATE',
					botReady: false,
					...(options.resumeSession ? { cancelSessionHandoff: generation } : {}),
				},
				'Hot reload rollback',
				HOT_RELOAD_SWITCH_TIMEOUT_MS,
			);
		try {
			try {
				const stopped = await this.requestHotReloadStep(
					workerId,
					previousGeneration,
					options.resumeSession
						? { type: 'HOT_RELOAD_STOP', sessionHandoff: { generation, drainTimeout } }
						: { type: 'HOT_RELOAD_STOP' },
					'Hot reload stop',
					options.resumeSession ? drainTimeout + HOT_RELOAD_SWITCH_TIMEOUT_MS : HOT_RELOAD_SWITCH_TIMEOUT_MS,
					options.resumeSession ? pending.exited : undefined,
				);
				if (options.resumeSession) {
					if (!stopped.session) throw new Error('Old worker did not provide a session checkpoint.');
					await this.requestHotReloadStep(
						workerId,
						generation,
						{ type: 'HOT_RELOAD_RESUME', session: stopped.session },
						'Hot reload session resume',
						readyTimeout,
						pending.exited,
					);
				}
			} catch (error) {
				// Without a confirmed stop, starting the replacement could let both workers handle events.
				if (options.resumeSession) await discard();
				await resumePrevious().catch(rollbackError =>
					this.reportError(`[Worker #${workerId}] could not resume the old worker`, rollbackError),
				);
				if (!options.resumeSession) await discard();
				return finish(error);
			}
			try {
				await this.requestHotReloadStep(
					workerId,
					generation,
					{ type: 'HOT_RELOAD_ACTIVATE', botReady: this.keys().next().value === workerId },
					'Hot reload activation',
					options.resumeSession ? readyTimeout : HOT_RELOAD_SWITCH_TIMEOUT_MS,
					pending.exited,
				);
			} catch (error) {
				activationError = error;
				try {
					// If the ACK was lost after replay, rolling back can replay those events again.
					if (options.resumeSession) await discard();
					await resumePrevious();
					if (!options.resumeSession) await discard();
					return finish(error);
				} catch (rollbackError) {
					this.reportError(`[Worker #${workerId}] could not resume the old worker`, rollbackError);
					if (options.resumeSession) return finish(error);
				}
			}
			const replacement = this.standbyWorkers.get(key)!;
			this.standbyWorkers.delete(key);
			this.standbyWorkers.set(instanceKey(workerId, previousGeneration), previous);
			this.set(workerId, replacement);
			this.generations.set(workerId, generation);
			// The old worker answered the last heartbeat; don't let the switch read as a missed one.
			this.heartbeater.acknowledge(workerId);
		} finally {
			this.pendingReplacements.delete(key);
			this.switchingWorkerId = undefined;
		}

		const entry = finish(activationError);
		if (
			requester &&
			!requester.answered &&
			requester.workerId === workerId &&
			requester.generation === previousGeneration
		) {
			// The requester is about to drain, so it gets its answer now, while it can still act on it.
			await this.sendHotReloadResult(requester, { result: { workers: [...result.workers] } });
		}

		report('draining');
		try {
			await this.requestHotReloadStep(
				workerId,
				previousGeneration,
				{ type: 'HOT_RELOAD_DRAIN', drainTimeout },
				'Hot reload drain',
				drainTimeout + HOT_RELOAD_DRAIN_GRACE_MS,
			);
		} catch (error) {
			this.reportError(`[Worker #${workerId}] replaced worker did not finish draining`, error);
		}
		await Promise.resolve(this.terminateInstance(workerId, previousGeneration, previous)).catch(error =>
			this.reportError(`[Worker #${workerId}] failed to stop the replaced worker`, error),
		);
		this.standbyWorkers.delete(instanceKey(workerId, previousGeneration));
		report('done');
		return entry;
	}

	private createPendingReplacement(key: string, onStarted: () => void): PendingReplacement {
		let resolve!: () => void;
		let reject!: (error: unknown) => void;
		let started = false;
		const ready = new Promise<void>(started => {
			resolve = started;
		});
		const exited = new Promise<never>((_, failed) => {
			reject = failed;
		});
		const pending: PendingReplacement = {
			ready,
			exited,
			started: () => {
				if (started) return;
				started = true;
				onStarted();
			},
			markReady: resolve,
			fail: reject,
		};
		this.pendingReplacements.set(key, pending);
		return pending;
	}

	private watchExit(worker: ManagedWorker, workerId: number, generation: number) {
		switch (this.options.mode) {
			case 'threads': {
				const thread = worker as WorkerThreadsWorker;
				thread.once('error', error => this.handleWorkerExit(workerId, generation, error));
				thread.once('exit', code =>
					this.handleWorkerExit(workerId, generation, new Error(`Worker #${workerId} exited with code ${code}`)),
				);
				break;
			}
			case 'clusters':
				(worker as ClusterWorker).once('exit', (code, signal) =>
					this.handleWorkerExit(
						workerId,
						generation,
						new Error(`Worker #${workerId} exited with ${signal ? `signal ${signal}` : `code ${code}`}`),
					),
				);
				break;
		}
	}

	private terminateInstance(workerId: number, generation: number, worker: ManagedWorker): Awaitable<unknown> {
		switch (this.options.mode) {
			case 'threads':
				return (worker as WorkerThreadsWorker).terminate();
			case 'clusters':
				return (worker as ClusterWorker).kill();
			case 'custom':
				return this.options.adapter.terminate?.(workerId, generation);
		}
	}

	private async requestHotReloadStep(
		workerId: number,
		generation: number,
		body:
			| Omit<ManagerHotReloadActivate, 'nonce'>
			| Omit<ManagerHotReloadResume, 'nonce'>
			| Omit<ManagerHotReloadStop, 'nonce'>
			| Omit<ManagerHotReloadDrain, 'nonce'>,
		operation: string,
		timeoutMs?: number,
		interrupted?: Promise<never>,
	) {
		const nonce = this.generateNonce();
		const ack = await this.sendRequest<WorkerHotReloadAck>(
			nonce,
			operation,
			() => this.postToInstance(workerId, generation, { ...body, nonce } as ManagerMessages),
			timeoutMs,
			interrupted,
		);
		if (ack.error) throw deserializeWorkerError(ack.error);
		return ack;
	}

	private async answerHotReloadRequest(message: WorkerRequestHotReload, generation: number) {
		const requester: HotReloadRequester = {
			workerId: message.workerId,
			generation,
			nonce: message.nonce,
			answered: false,
		};
		try {
			const result = await this.runHotReload(
				{
					...message.options,
					onProgress: progress => {
						// Best effort: the requester may already be gone after its own replacement.
						void this.postToInstance(requester.workerId, requester.generation, {
							type: 'HOT_RELOAD_PROGRESS',
							nonce: requester.nonce,
							progress,
						} satisfies ManagerHotReloadProgress).catch(error =>
							this.debugger?.debug(`[Worker #${requester.workerId}] hot reload progress not delivered`, error),
						);
					},
				},
				requester,
			);
			if (!requester.answered) await this.sendHotReloadResult(requester, { result });
		} catch (error) {
			if (!requester.answered) await this.sendHotReloadResult(requester, { error: serializeWorkerError(error) });
		}
	}

	private async sendHotReloadResult(
		requester: HotReloadRequester,
		outcome: { result: HotReloadResult } | { error: SerializedWorkerError },
	) {
		requester.answered = true;
		try {
			await this.postToInstance(requester.workerId, requester.generation, {
				type: 'HOT_RELOAD_RESULT',
				nonce: requester.nonce,
				...outcome,
			} as ManagerHotReloadResult);
		} catch (error) {
			this.reportError(`[Worker #${requester.workerId}] hot reload result not delivered`, error);
		}
	}

	async start() {
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
		this.options.info ??= await this.rest.proxy.gateway.bot.get();
		this.options.shardEnd ??= this.options.totalShards ?? this.options.info.shards;
		this.options.totalShards ??= this.options.shardEnd;
		this.options = MergeOptions<WorkerManagerRuntimeOptions>(WorkerManagerDefaults, this.options);
		this.options.resharding.getInfo ??= () => this.rest.proxy.gateway.bot.get();
		this.options.workers ??= Math.ceil(this.options.totalShards / this.options.shardsPerWorker);
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

		const spaces = WorkerManager.prepareSpaces(
			{
				shardStart: this.shardStart,
				shardEnd: this.shardEnd,
				shardsPerWorker: this.shardsPerWorker,
			},
			this.debugger,
		);
		this.prepareWorkers(spaces);
		// Start workers queue
		await this.workerQueue.shift()!();
		await this.startResharding();
	}

	async startResharding() {
		if (this.options.resharding.interval <= 0) return;
		if (this.shardStart !== 0 || this.shardEnd !== this.totalShards)
			return this.debugger?.debug('Cannot start resharder');
		setInterval(
			() =>
				this.observe(async () => {
					if (this.hotReloading) return this.debugger?.debug('Skipping reshard check during a hot reload');
					this.debugger?.debug('Checking if reshard is needed');
					const info = await this.options.resharding.getInfo();
					// A hot reload may have started while the gateway info was loading.
					if (this.hotReloading) return this.debugger?.debug('Skipping reshard check during a hot reload');
					if (info.shards <= this.totalShards) return this.debugger?.debug('Resharding not needed');
					//https://github.com/discordeno/discordeno/blob/6a5f446c0651b9fad9f1550ff1857fe7a026426b/packages/gateway/src/manager.ts#L106C8-L106C94
					const percentage = (info.shards / ((this.totalShards * 2500) / 1000)) * 100;
					if (percentage < this.options.resharding.percentage)
						return this.debugger?.debug(
							`Percentage is not enough to reshard ${percentage}/${this.options.resharding.percentage}`,
						);

					this.debugger?.info(`Starting resharding process to ${info.shards}`);

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
					if (firstWorker) this.observe(firstWorker, 'Resharding worker spawn failed');
				}, 'Resharding check failed'),
			this.options.resharding.interval,
		).unref();
	}
}

type CreateManagerMessage<T extends string, D extends object = object> = { type: T } & D;

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
export type ManagerSendPayload = CreateManagerMessage<
	'SEND_PAYLOAD',
	GatewaySendPayload & { shardId: number; nonce: string }
>;
export type ManagerRequestShardInfo = CreateManagerMessage<'SHARD_INFO', { nonce: string; shardId: number }>;
export type ManagerRequestWorkerInfo = CreateManagerMessage<'WORKER_INFO', { nonce: string }>;
export type SerializedWorkerValue =
	| null
	| boolean
	| number
	| string
	| SerializedWorkerError
	| SerializedWorkerValue[]
	| { type: 'record'; value: { [key: string]: SerializedWorkerValue } };
export interface SerializedWorkerError {
	type: 'error';
	name: string;
	message: string;
	stack?: string;
	code?: string;
	metadata?: Record<string, SerializedWorkerValue>;
	cause?: SerializedWorkerValue;
}
export type ManagerSendCacheResult = CreateManagerMessage<
	'CACHE_RESULT',
	{ nonce: string } & ({ result: any; error?: never } | { error: SerializedWorkerError; result?: never })
>;
export type ManagerSendBotReady = CreateManagerMessage<'BOT_READY'>;
export type ManagerSendApiResponse = CreateManagerMessage<
	'API_RESPONSE',
	{
		response: any;
		responseType?: 'arrayBuffer';
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

export type HotReloadStage = 'spawning' | 'connecting' | 'ready' | 'switching' | 'draining' | 'done' | 'failed';

export interface HotReloadProgress {
	workerId: number;
	stage: HotReloadStage;
	/** Set with the `failed` stage. */
	error?: string;
}

export interface HotReloadWorkerResult {
	workerId: number;
	ok: boolean;
	error?: string;
	/** Time from spawning the replacement until it took over or failed. */
	ms: number;
}

export interface HotReloadResult {
	/** One entry per worker that was attempted, in reload order. */
	workers: HotReloadWorkerResult[];
}

export interface HotReloadOptions extends WorkerHotReloadRequestOptions {
	/**
	 * Experimental manager-only handoff for native workers with one shard and WorkerAdapter.
	 * The replacement still uses an Identify to start up. The original stream pauses while work drains
	 * and resumes from the last received sequence, subject to Discord accepting the session and replay.
	 * The replacement must finish its readiness handlers within `readyTimeout` before taking over.
	 * Outbound Gateway requests to the paused worker may time out. If activation is uncertain, rollback
	 * can replay events that the replacement already dispatched.
	 */
	resumeSession?: boolean;
	/** Called as each worker moves through the reload. */
	onProgress?(event: HotReloadProgress): void;
}

export type ManagerHotReloadActivate = CreateManagerMessage<
	'HOT_RELOAD_ACTIVATE',
	{
		nonce: string;
		/** Whether this worker runs `botReady` handlers, as the first worker does at startup. */
		botReady: boolean;
		cancelSessionHandoff?: number;
	}
>;
export type ManagerHotReloadStop = CreateManagerMessage<
	'HOT_RELOAD_STOP',
	{ nonce: string; sessionHandoff?: { generation: number; drainTimeout: number } }
>;
export type ManagerHotReloadResume = CreateManagerMessage<
	'HOT_RELOAD_RESUME',
	{ nonce: string; session: MakeRequired<ShardData> }
>;
export type ManagerHotReloadDrain = CreateManagerMessage<'HOT_RELOAD_DRAIN', { nonce: string; drainTimeout: number }>;
export type ManagerHotReloadProgress = CreateManagerMessage<
	'HOT_RELOAD_PROGRESS',
	{ nonce: string; progress: HotReloadProgress }
>;
export type ManagerHotReloadResult = CreateManagerMessage<
	'HOT_RELOAD_RESULT',
	{ nonce: string } & ({ result: HotReloadResult; error?: never } | { error: SerializedWorkerError; result?: never })
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
	| ManagerExecuteEval
	| ManagerHotReloadActivate
	| ManagerHotReloadStop
	| ManagerHotReloadResume
	| ManagerHotReloadDrain
	| ManagerHotReloadProgress
	| ManagerHotReloadResult;

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
