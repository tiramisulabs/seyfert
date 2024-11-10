import cluster, { type Worker as ClusterWorker } from 'node:cluster';
import { type UUID, randomUUID } from 'node:crypto';
import type { Worker as WorkerThreadsWorker } from 'node:worker_threads';
import { ApiHandler, Logger, type UsingClient, type WorkerClient } from '../..';
import { type Adapter, MemoryAdapter } from '../../cache';
import { BaseClient, type InternalRuntimeConfig } from '../../client/base';
import { BASE_HOST, type MakePartial, MergeOptions, lazyLoadPackage } from '../../common';
import type { GatewayPresenceUpdateData, GatewaySendPayload, RESTGetAPIGatewayBotResult } from '../../types';
import { WorkerManagerDefaults, properties } from '../constants';
import { DynamicBucket } from '../structures';
import { ConnectQueue } from '../structures/timeout';
import type { ShardOptions, WorkerData, WorkerManagerOptions } from './shared';
import type { WorkerInfo, WorkerMessage, WorkerShardInfo } from './worker';

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
		logger?.info('Preparing buckets', options);

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

	options: MakePartial<Required<WorkerManagerOptions>, 'adapter'>;
	debugger?: Logger;
	connectQueue!: ConnectQueue;
	workerQueue: (() => void)[] = [];
	cacheAdapter: Adapter;
	promises = new Map<string, { resolve: (value: any) => void; timeout: NodeJS.Timeout }>();
	rest!: ApiHandler;
	reshardingWorkerQueue: (() => void)[] = [];
	private _info?: RESTGetAPIGatewayBotResult;

	constructor(
		options: Omit<MakePartial<WorkerManagerOptions, 'token' | 'intents' | 'info' | 'handlePayload'>, 'resharding'> & {
			resharding?: MakePartial<NonNullable<WorkerManagerOptions['resharding']>, 'getInfo'>;
		},
	) {
		super();
		this.options = options as WorkerManager['options'];
		this.cacheAdapter = new MemoryAdapter();
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
			throw new Error('Undefined workerId and shardId');
		}

		const id = workerId ?? this.calculateWorkerId(shardId!);

		if (!this.has(id)) {
			throw new Error(`Worker #${workerId} doesnt exist`);
		}

		const data = await this.getWorkerInfo(id);

		return data.shards.reduce((acc, prv) => acc + prv.latency, 0) / data.shards.length;
	}

	calculateShardId(guildId: string) {
		return Number((BigInt(guildId) >> 22n) % BigInt(this.totalShards));
	}

	calculateWorkerId(shardId: number) {
		const workerId = Math.floor((shardId - this.shardStart) / this.shardsPerWorker);
		if (workerId >= this.totalWorkers) {
			throw new Error('Invalid shardId');
		}
		return workerId;
	}

	postMessage(id: number, body: ManagerMessages) {
		const worker = this.get(id);
		if (!worker) return this.debugger?.error(`Worker ${id} does not exists.`);
		switch (this.options.mode) {
			case 'clusters':
				(worker as ClusterWorker).send(body);
				break;
			case 'threads':
				(worker as import('worker_threads').Worker).postMessage(body);
				break;
			case 'custom':
				this.options.adapter!.postMessage(id, body);
				break;
		}
	}

	prepareWorkers(shards: number[][], resharding = false) {
		const worker_threads = lazyLoadPackage<typeof import('node:worker_threads')>('node:worker_threads');
		if (!worker_threads) throw new Error('Cannot prepare workers without worker_threads.');

		for (let i = 0; i < shards.length; i++) {
			const workerExists = this.has(i);
			if (resharding || !workerExists) {
				this[resharding ? 'reshardingWorkerQueue' : 'workerQueue'].push(() => {
					const worker = this.createWorker({
						path: this.options.path,
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
				});
			}
		}
	}

	createWorker(workerData: WorkerData) {
		if (this.has(workerData.workerId)) {
			if (workerData.resharding) {
				this.postMessage(workerData.workerId, {
					type: 'WORKER_ALREADY_EXISTS_RESHARDING',
				} satisfies ManagerWorkerAlreadyExistsResharding);
			}
			const worker = this.get(workerData.workerId)!;
			return worker;
		}
		const worker_threads = lazyLoadPackage<typeof import('node:worker_threads')>('node:worker_threads');
		if (!worker_threads) throw new Error('Cannot create worker without worker_threads.');
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
				const worker = new worker_threads.Worker(workerData.path, {
					env,
				});
				worker.on('message', data => this.handleWorkerMessage(data));
				return worker;
			}
			case 'clusters': {
				cluster.setupPrimary({
					exec: workerData.path,
				});
				const worker = cluster.fork(env);
				worker.on('message', data => this.handleWorkerMessage(data));
				return worker;
			}
			case 'custom': {
				this.options.adapter!.spawn(workerData, env);
				return {
					ready: false,
				};
			}
		}
	}

	spawn(workerId: number, shardId: number, resharding = false) {
		this.connectQueue.push(() => {
			const worker = this.has(workerId);
			if (!worker) {
				this.debugger?.fatal(`Trying ${resharding ? 'reshard' : 'spawn'} with worker that doesn't exist`);
				return;
			}
			this.postMessage(workerId, {
				type: resharding ? 'ALLOW_CONNECT_RESHARDING' : 'ALLOW_CONNECT',
				shardId,
				presence: this.options.presence?.(shardId, workerId),
			} satisfies ManagerAllowConnect | ManagerAllowConnectResharding);
		});
	}

	async handleWorkerMessage(message: WorkerMessage) {
		switch (message.type) {
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
							nextWorker();
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
						this.options.shardEnd = this.options.totalShards = this._info!.shards;
						this.options.workers = this.size;
						delete this._info;
						for (const [id] of this.entries()) {
							this.postMessage(id, {
								type: 'CONNECT_ALL_SHARDS_RESHARDING',
							} satisfies ConnnectAllShardsResharding);
						}
						this.forEach(w => {
							delete w.disconnected;
						});
					}
				}
				break;
			case 'WORKER_START_RESHARDING':
				{
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
				this.spawn(message.workerId, message.shardId, true);
				break;
			case 'CONNECT_QUEUE':
				this.spawn(message.workerId, message.shardId);
				break;
			case 'CACHE_REQUEST':
				{
					const worker = this.has(message.workerId);
					if (!worker) {
						throw new Error('Invalid request from unavailable worker');
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
				await this.options.handlePayload(message.shardId, message.workerId, message.payload);
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
					if ([...this.values()].every(w => w.ready)) {
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
						nextWorker();
					} else {
						this.debugger?.info('No more workers to spawn left');
					}
				}
				break;
			case 'WORKER_API_REQUEST':
				{
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
				rej(new Error(message));
			}, 60e3);
			this.promises.set(nonce, { resolve: res, timeout });
		});
	}

	async send(data: GatewaySendPayload, shardId: number) {
		const workerId = this.calculateWorkerId(shardId);
		const worker = this.has(workerId);

		if (!worker) {
			throw new Error(`Worker #${workerId} doesnt exist`);
		}

		const nonce = this.generateNonce();

		this.postMessage(workerId, {
			type: 'SEND_PAYLOAD',
			shardId,
			nonce,
			...data,
		} satisfies ManagerSendPayload);

		return this.generateSendPromise<true>(nonce, 'Shard send payload timeout');
	}

	async getShardInfo(shardId: number) {
		const workerId = this.calculateWorkerId(shardId);
		const worker = this.has(workerId);

		if (!worker) {
			throw new Error(`Worker #${workerId} doesnt exist`);
		}

		const nonce = this.generateNonce();

		this.postMessage(workerId, { shardId, nonce, type: 'SHARD_INFO' } satisfies ManagerRequestShardInfo);

		return this.generateSendPromise<WorkerShardInfo>(nonce, 'Get shard info timeout');
	}

	async getWorkerInfo(workerId: number) {
		const worker = this.has(workerId);

		if (!worker) {
			throw new Error(`Worker #${workerId} doesnt exist`);
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

	async start() {
		const rc = await BaseClient.prototype.getRC<InternalRuntimeConfig>();

		this.options.debug ||= rc.debug;
		this.options.intents ||= rc.intents ?? 0;
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
		this.options = MergeOptions<Required<WorkerManagerOptions>>(WorkerManagerDefaults, this.options);
		this.options.resharding.getInfo ??= () => this.rest.proxy.gateway.bot.get();
		this.options.workers ??= Math.ceil(this.options.totalShards / this.options.shardsPerWorker);
		this.connectQueue = new ConnectQueue(5.5e3, this.concurrency);

		if (this.options.debug) {
			this.debugger = new Logger({
				name: '[WorkerManager]',
			});
		}
		if (this.totalShards / this.shardsPerWorker > this.totalWorkers) {
			throw new Error(
				`Cannot create enough shards in the specified workers, minimum: ${Math.ceil(
					this.totalShards / this.shardsPerWorker,
				)}`,
			);
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
		this.workerQueue.shift()!();
		await this.startResharding();
	}

	async startResharding() {
		if (this.options.resharding.interval <= 0) return;
		if (this.shardStart !== 0 || this.shardEnd !== this.totalShards)
			return this.debugger?.debug('Cannot start resharder');
		setInterval(async () => {
			this.debugger?.debug('Checking if reshard is needed');
			const info = await this.options.resharding.getInfo();
			if (info.shards <= this.totalShards) return this.debugger?.debug('Resharding not needed');
			//https://github.com/discordeno/discordeno/blob/6a5f446c0651b9fad9f1550ff1857fe7a026426b/packages/gateway/src/manager.ts#L106C8-L106C94
			const percentage = (info.shards / ((this.totalShards * 2500) / 1000)) * 100;
			if (percentage < this.options.resharding.percentage)
				return this.debugger?.debug(
					`Percentage is not enough to reshard ${percentage}/${this.options.resharding.percentage}`,
				);

			this.debugger?.info('Starting resharding process');

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
			await this.prepareWorkers(spaces, true);
			return this.reshardingWorkerQueue.shift()!();
		}, this.options.resharding.interval);
	}
}

type CreateManagerMessage<T extends string, D extends object = object> = { type: T } & D;

export type ManagerAllowConnect = CreateManagerMessage<
	'ALLOW_CONNECT',
	{ shardId: number; presence: GatewayPresenceUpdateData }
>;
export type ManagerAllowConnectResharding = CreateManagerMessage<
	'ALLOW_CONNECT_RESHARDING',
	{ shardId: number; presence: GatewayPresenceUpdateData }
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
export type ConnnectAllShardsResharding = CreateManagerMessage<'CONNECT_ALL_SHARDS_RESHARDING'>;
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

export type ManagerMessages =
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
