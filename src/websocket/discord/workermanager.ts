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
import type { ShardOptions, WorkerData, WorkerManagerOptions } from './shared';
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
type WorkerManagerRuntimeOptionalKeys = 'adapter' | 'handleWorkerMessage' | 'handlePayload' | 'getRC' | 'workerEnv';
type WorkerManagerCustomRuntimeOptionalKeys = 'handleWorkerMessage' | 'handlePayload' | 'getRC' | 'workerEnv';
type WorkerManagerRuntimeOptions =
	| PickPartial<Required<WorkerManagerNativeOptions>, WorkerManagerRuntimeOptionalKeys>
	| (PickPartial<Required<Omit<WorkerManagerCustomOptions, 'path'>>, WorkerManagerCustomRuntimeOptionalKeys> & {
			path?: string;
	  });
type WorkerReshardingState = 'idle' | 'preparing' | 'draining' | 'committing' | 'failed';

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
	return (
		((typeof value === 'object' && value !== null) || typeof value === 'function') &&
		typeof (value as PromiseLike<unknown>).then === 'function'
	);
}

function isSerializedBuffer(value: unknown): value is { type: 'Buffer'; data: number[] } {
	return (
		typeof value === 'object' &&
		value !== null &&
		'type' in value &&
		value.type === 'Buffer' &&
		'data' in value &&
		Array.isArray(value.data)
	);
}

export class WorkerManager extends Map<
	number,
	(ClusterWorker | WorkerThreadsWorker | { ready?: boolean }) & {
		ready?: boolean;
		disconnected?: boolean;
		resharded?: boolean;
	}
> {
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
	workerQueue: (() => Promise<void>)[] = [];
	cacheAdapter: Adapter;
	promises = new Map<
		string,
		{ resolve: (value: any) => void; reject: (reason?: unknown) => void; timeout: NodeJS.Timeout }
	>();
	rest!: ApiHandler;
	reshardingWorkerQueue: (() => Promise<void>)[] = [];
	private reshardingTimer?: NodeJS.Timeout;
	private reshardingState: WorkerReshardingState = 'idle';
	private reshardingGeneration = 0;
	private reshardingPreviousConcurrency?: number;
	private reshardingFailure?: SeyfertError;
	private _info?: RESTGetAPIGatewayBotResult;
	heartbeater: Heartbeater;

	constructor(options: WorkerManagerConstructorOptions) {
		super();
		// The constructor permits runtime config values that start() fills before use.
		this.options = { mode: 'threads', ...options } as WorkerManager['options'];
		this.cacheAdapter = new MemoryAdapter();

		if (this.options.handleWorkerMessage) {
			const oldFn = this.handleWorkerMessage.bind(this);
			this.handleWorkerMessage = async message => {
				await this.options.handleWorkerMessage!(message);
				return oldFn(message);
			};
		}

		this.heartbeater = new Heartbeater(this.postMessage.bind(this), options.heartbeaterInterval ?? 15e3, error =>
			this.debugger?.error('Worker heartbeat operation failed', error),
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

	postMessage(id: number, body: ManagerMessages | WorkerHeartbeaterMessages) {
		if (this.reshardingFailure) return Promise.reject(this.reshardingFailure);
		const worker = this.get(id);
		if (!worker) return Promise.reject(this.createWorkerNotFoundError(id));
		switch (this.options.mode) {
			case 'clusters': {
				const clusterWorker = worker as ClusterWorker;
				if (!clusterWorker.isConnected()) {
					return Promise.reject(
						new SeyfertError('INTERNAL_ERROR', {
							metadata: { workerId: id, detail: `Cannot send to disconnected worker #${id}.` },
						}),
					);
				}
				return new Promise<void>((resolve, reject) => {
					clusterWorker.send(body, error => {
						if (error) reject(error);
						else resolve();
					});
				});
			}
			case 'threads':
				return (worker as import('worker_threads').Worker).postMessage(body);
			case 'custom':
				return this.options.adapter.postMessage(id, body);
		}
	}

	prepareWorkers(shards: number[][], rawResharding = false) {
		const worker_threads = lazyLoadPackage<typeof import('node:worker_threads')>('node:worker_threads');
		if (!worker_threads)
			throw new SeyfertError('WORKER_THREADS_REQUIRED', {
				metadata: { detail: 'Cannot prepare workers without worker_threads.' },
			});

		const reshardingGeneration = this.reshardingGeneration;
		for (let i = 0; i < shards.length; i++) {
			const registerWorker = async (resharding: boolean) => {
				const existingWorker = this.get(i);
				const worker = await this.createWorker({
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
				if (resharding && !this.isReshardingEffectCurrent(reshardingGeneration, 'preparing')) {
					if (!existingWorker && this.get(i) === worker) this.delete(i);
					return;
				}
				this.set(i, worker);
				return i;
			};
			const registerWorkerHeartbeat = (workerId: number) => {
				this.heartbeater.register(workerId, async deadWorkerId => {
					this.heartbeater.unregister(deadWorkerId);
					this.delete(deadWorkerId);
					if (this.reshardingState !== 'idle') {
						this.failResharding(
							new SeyfertError('INTERNAL_ERROR', {
								metadata: {
									workerId: deadWorkerId,
									detail: `Worker #${deadWorkerId} was lost during resharding; restart required.`,
								},
							}),
						);
						return;
					}
					const replacementId = await registerWorker(false);
					if (replacementId !== undefined) registerWorkerHeartbeat(replacementId);
				});
			};
			const workerExists = this.has(i);
			if (rawResharding || !workerExists) {
				this[rawResharding ? 'reshardingWorkerQueue' : 'workerQueue'].push(async () => {
					const workerId = await registerWorker(rawResharding);
					if (workerId !== undefined) registerWorkerHeartbeat(workerId);
				});
			}
		}
	}

	private handleEmittedWorkerMessage(workerId: number, data: unknown) {
		void this.handleWorkerMessage(data as WorkerMessages).catch(error => {
			this.debugger ??= new Logger({ name: '[WorkerManager]' });
			this.debugger.error(`[Worker #${workerId}] message handling failed`, error);
		});
	}

	createWorker(workerData: WorkerData) {
		if (this.has(workerData.workerId)) {
			const worker = this.get(workerData.workerId)!;
			if (workerData.resharding) {
				return Promise.resolve(
					this.postMessage(workerData.workerId, {
						type: 'WORKER_ALREADY_EXISTS_RESHARDING',
					} satisfies ManagerWorkerAlreadyExistsResharding),
				).then(() => worker);
			}
			return worker;
		}
		const worker_threads = lazyLoadPackage<typeof import('node:worker_threads')>('node:worker_threads');
		if (!worker_threads)
			throw new SeyfertError('WORKER_THREADS_REQUIRED', {
				metadata: { detail: 'Cannot create worker without worker_threads.' },
			});
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
				worker.on('message', data => this.handleEmittedWorkerMessage(workerData.workerId, data));
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
				worker.on('message', data => this.handleEmittedWorkerMessage(workerData.workerId, data));
				return worker;
			}
			case 'custom': {
				const worker = {
					ready: false,
				};
				this.set(workerData.workerId, worker);
				try {
					const spawnResult = this.options.adapter.spawn(workerData, env);
					if (!isPromiseLike(spawnResult)) return worker;
					return Promise.resolve(spawnResult).then(
						() => worker,
						error => {
							if (this.get(workerData.workerId) === worker) this.delete(workerData.workerId);
							throw error;
						},
					);
				} catch (error) {
					if (this.get(workerData.workerId) === worker) this.delete(workerData.workerId);
					throw error;
				}
			}
		}
	}

	private isReshardingEffectCurrent(generation: number, state: WorkerReshardingState) {
		return this.reshardingGeneration === generation && this.reshardingState === state;
	}

	private createReshardingFailure(cause: unknown) {
		return new SeyfertError('INTERNAL_ERROR', {
			cause,
			metadata: { detail: 'Worker manager cannot continue after a failed reshard; restart required.' },
		});
	}

	private failResharding(error: unknown, generation = this.reshardingGeneration) {
		if (
			generation !== this.reshardingGeneration ||
			this.reshardingState === 'idle' ||
			this.reshardingState === 'failed'
		)
			return;
		this.reshardingGeneration++;
		this.reshardingState = 'failed';
		this.reshardingFailure = this.createReshardingFailure(error);
		for (const pending of this.promises.values()) {
			clearTimeout(pending.timeout);
			pending.reject(this.reshardingFailure);
		}
		this.promises.clear();
		this.stopResharding();
		this.reshardingWorkerQueue.length = 0;
		delete this._info;
		if (this.reshardingPreviousConcurrency !== undefined) {
			this.connectQueue.setConcurrency(this.reshardingPreviousConcurrency);
			this.options.info.session_start_limit.max_concurrency = this.reshardingPreviousConcurrency;
			this.reshardingPreviousConcurrency = undefined;
		}
		this.forEach((worker, workerId) => {
			this.heartbeater.unregister(workerId);
			delete worker.resharded;
			delete worker.disconnected;
		});
		this.debugger ??= new Logger({ name: '[WorkerManager]' });
		this.debugger.error('Worker resharding failed; restart the workers and manager before retrying.', error);
	}

	private async runReshardingEffect(
		generation: number,
		state: WorkerReshardingState,
		effect: () => Awaitable<unknown>,
	) {
		try {
			await effect();
		} catch (error) {
			if (this.isReshardingEffectCurrent(generation, state)) this.failResharding(error, generation);
			return false;
		}
		return this.isReshardingEffectCurrent(generation, state);
	}

	spawn(workerId: number, shardId: number, resharding = false, generation = this.reshardingGeneration) {
		return this.connectQueue.push(async () => {
			if (resharding && !this.isReshardingEffectCurrent(generation, 'preparing')) return;
			const worker = this.has(workerId);
			if (!worker) {
				if (resharding) throw this.createWorkerNotFoundError(workerId);
				this.debugger?.fatal(`Trying ${resharding ? 'reshard' : 'spawn'} with worker that doesn't exist`);
				return;
			}
			await this.postMessage(workerId, {
				type: resharding ? 'ALLOW_CONNECT_RESHARDING' : 'ALLOW_CONNECT',
				shardId,
				presence: this.options.presence?.(shardId, workerId),
			} satisfies ManagerAllowConnect | ManagerAllowConnectResharding);
		});
	}

	async handleWorkerMessage(message: WorkerMessages) {
		if (this.reshardingFailure) return;
		switch (message.type) {
			case 'ACK_HEARTBEAT':
				this.heartbeater.acknowledge(message.workerId);
				break;
			case 'WORKER_READY_RESHARDING':
				{
					if (this.reshardingState !== 'preparing') return;
					const generation = this.reshardingGeneration;
					const worker = this.get(message.workerId);
					if (!worker) {
						this.failResharding(this.createWorkerNotFoundError(message.workerId), generation);
						return;
					}
					worker.resharded = true;
					if (!this.reshardingWorkerQueue.length && [...this.values()].every(w => w.resharded)) {
						this.reshardingState = 'draining';
						this.forEach(w => {
							delete w.resharded;
						});
						for (const [id] of this.entries()) {
							const current = await this.runReshardingEffect(generation, 'draining', () =>
								this.postMessage(id, {
									type: 'DISCONNECT_ALL_SHARDS_RESHARDING',
								} satisfies DisconnectAllShardsResharding),
							);
							if (!current) return;
						}
					} else {
						const nextWorker = this.reshardingWorkerQueue.shift();
						if (nextWorker) {
							this.debugger?.info('Spawning next worker to reshard');
							await this.runReshardingEffect(generation, 'preparing', nextWorker);
						} else {
							this.debugger?.info('No more workers to reshard left');
						}
					}
				}
				break;
			case 'DISCONNECTED_ALL_SHARDS_RESHARDING':
				{
					if (this.reshardingState !== 'draining') return;
					const generation = this.reshardingGeneration;
					const worker = this.get(message.workerId);
					if (!worker) {
						this.failResharding(this.createWorkerNotFoundError(message.workerId), generation);
						return;
					}
					worker.disconnected = true;
					if ([...this.values()].every(w => w.disconnected)) {
						const totalShards = this._info!.shards;
						this.reshardingState = 'committing';
						this.forEach(w => {
							delete w.disconnected;
						});
						for (const [id] of this.entries()) {
							const current = await this.runReshardingEffect(generation, 'committing', () =>
								this.postMessage(id, {
									type: 'CONNECT_ALL_SHARDS_RESHARDING',
									totalShards,
								} satisfies ConnnectAllShardsResharding),
							);
							if (!current) return;
						}
						this.options.shardEnd = this.options.totalShards = this.options.info.shards = totalShards;
						this.options.workers = this.size;
						delete this._info;
						this.reshardingPreviousConcurrency = undefined;
						this.reshardingState = 'idle';
						this.reshardingGeneration++;
					}
				}
				break;
			case 'WORKER_START_RESHARDING':
				{
					if (this.reshardingState !== 'preparing') return;
					const generation = this.reshardingGeneration;
					await this.runReshardingEffect(generation, 'preparing', () =>
						this.postMessage(message.workerId, {
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
						} satisfies ManagerSpawnShardsResharding),
					);
				}
				break;
			case 'WORKER_START':
				{
					await this.postMessage(message.workerId, {
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
				{
					if (this.reshardingState !== 'preparing') return;
					const generation = this.reshardingGeneration;
					await this.runReshardingEffect(generation, 'preparing', () =>
						this.spawn(message.workerId, message.shardId, true, generation),
					);
				}
				break;
			case 'CONNECT_QUEUE':
				await this.spawn(message.workerId, message.shardId);
				break;
			case 'CACHE_REQUEST':
				{
					const worker = this.has(message.workerId);
					if (!worker) {
						throw new SeyfertError('INVALID_WORKER_REQUEST', {
							metadata: { detail: 'Invalid request from unavailable worker' },
						});
					}
					const method = this.cacheAdapter[message.method] as (...args: unknown[]) => unknown;
					const result = await method.apply(this.cacheAdapter, message.args);
					await this.postMessage(message.workerId, {
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
						await this.postMessage(this.keys().next().value!, {
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
							if (isSerializedBuffer(file.data)) file.data = new Uint8Array(file.data.data);
						});
					}
					const response = await this.rest.request(message.method, message.url, message.requestOptions);
					const encodedResponse = response instanceof ArrayBuffer ? Array.from(new Uint8Array(response)) : response;
					const responseType = response instanceof ArrayBuffer ? 'arrayBuffer' : undefined;
					await this.postMessage(message.workerId, {
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
					const response = await this.sendRequest(nonce, 'Worker evaluation', () =>
						this.postMessage(message.toWorkerId, {
							nonce,
							func: message.func,
							type: 'EXECUTE_EVAL_TO_WORKER',
							toWorkerId: message.toWorkerId,
							vars: message.vars,
						} satisfies ManagerExecuteEvalToWorker),
					);
					await this.postMessage(message.workerId, {
						nonce: message.nonce,
						response,
						type: 'EVAL_RESPONSE',
					} satisfies ManagerSendEvalResponse);
				}
				break;
		}
	}

	private generateNonce(): UUID {
		const uuid = randomUUID();
		if (this.promises.has(uuid)) return this.generateNonce();
		return uuid;
	}

	private generateSendPromise<T = unknown>(nonce: string, operation = 'Worker request'): Promise<T> {
		return new Promise<T>((res, rej) => {
			const timeout = setTimeout(() => {
				this.promises.delete(nonce);
				rej(
					new SeyfertError('WORKER_TIMEOUT', {
						metadata: { nonce, operation, detail: `${operation} timed out (nonce: ${nonce}).` },
					}),
				);
			}, WORKER_TIMEOUT_MS);
			this.promises.set(nonce, { reject: rej, resolve: res, timeout });
		});
	}

	private async sendRequest<T>(nonce: string, operation: string, send: () => Awaitable<unknown>): Promise<T> {
		const response = this.generateSendPromise<T>(nonce, operation);
		try {
			const [result] = await Promise.all([response, send()]);
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
		if (this.reshardingFailure) throw this.reshardingFailure;
		if (this.options.resharding.interval <= 0) return;
		if (this.shardStart !== 0 || this.shardEnd !== this.totalShards)
			return this.debugger?.debug('Cannot start resharder');
		if (this.reshardingTimer) return;
		this.reshardingTimer = setInterval(() => {
			if (this.reshardingState !== 'idle') return;
			const generation = ++this.reshardingGeneration;
			this.reshardingState = 'preparing';
			void this.checkResharding()
				.then(started => {
					if (!started && this.isReshardingEffectCurrent(generation, 'preparing')) {
						this.reshardingState = 'idle';
					}
				})
				.catch(error => {
					if (!this.isReshardingEffectCurrent(generation, 'preparing')) return;
					if (this._info) this.failResharding(error, generation);
					else {
						this.reshardingState = 'idle';
						this.debugger?.error('Worker resharding check failed', error);
					}
				});
		}, this.options.resharding.interval);
	}

	private async checkResharding() {
		this.debugger?.debug('Checking if reshard is needed');
		const info = await this.options.resharding.getInfo();
		if (info.shards <= this.totalShards) {
			this.debugger?.debug('Resharding not needed');
			return false;
		}
		const percentage = (info.shards / ((this.totalShards * 2500) / 1000)) * 100;
		if (percentage < this.options.resharding.percentage) {
			this.debugger?.debug(`Percentage is not enough to reshard ${percentage}/${this.options.resharding.percentage}`);
			return false;
		}

		this.debugger?.info(`Starting resharding process to ${info.shards}`);
		this._info = info;
		this.reshardingPreviousConcurrency = this.connectQueue.concurrency;
		this.connectQueue.setConcurrency(info.session_start_limit.max_concurrency);
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
		return true;
	}

	stopResharding() {
		clearInterval(this.reshardingTimer);
		this.reshardingTimer = undefined;
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
export type ManagerSendCacheResult = CreateManagerMessage<'CACHE_RESULT', { nonce: string; result: any }>;
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
