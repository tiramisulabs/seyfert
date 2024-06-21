import type { GatewayPresenceUpdateData, GatewaySendPayload } from 'discord-api-types/v10';
import cluster, { type Worker as ClusterWorker } from 'node:cluster';
import { randomUUID } from 'node:crypto';
import { ApiHandler, Logger, Router } from '../..';
import { MemoryAdapter, type Adapter } from '../../cache';
import { BaseClient, type InternalRuntimeConfig } from '../../client/base';
import { MergeOptions, lazyLoadPackage, type MakePartial } from '../../common';
import { WorkerManagerDefaults } from '../constants';
import { DynamicBucket } from '../structures';
import { ConnectQueue } from '../structures/timeout';
import { MemberUpdateHandler } from './events/memberUpdate';
import { PresenceUpdateHandler } from './events/presenceUpdate';
import type { ShardOptions, WorkerData, WorkerManagerOptions } from './shared';
import type { WorkerInfo, WorkerMessage, WorkerShardInfo, WorkerStart } from './worker';

export class WorkerManager extends Map<
	number,
	(ClusterWorker | import('node:worker_threads').Worker) & { ready?: boolean }
> {
	options!: Required<WorkerManagerOptions>;
	debugger?: Logger;
	connectQueue!: ConnectQueue;
	cacheAdapter: Adapter;
	promises = new Map<string, { resolve: (value: any) => void; timeout: NodeJS.Timeout }>();
	memberUpdateHandler = new MemberUpdateHandler();
	presenceUpdateHandler = new PresenceUpdateHandler();
	rest!: ApiHandler;
	constructor(options: MakePartial<WorkerManagerOptions, 'token' | 'intents' | 'info' | 'handlePayload'>) {
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

	get workers() {
		return this.options.workers;
	}

	async syncLatency({ shardId, workerId }: { shardId?: number; workerId?: number }) {
		if (typeof shardId !== 'number' && typeof workerId !== 'number') {
			return;
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
		if (workerId >= this.workers) {
			throw new Error('Invalid shardId');
		}
		return workerId;
	}

	prepareSpaces() {
		this.debugger?.info('Preparing buckets');

		const chunks = DynamicBucket.chunk<number>(
			new Array(this.shardEnd - this.shardStart),
			this.options.shardsPerWorker,
		);

		chunks.forEach((shards, index) => {
			for (let i = 0; i < shards.length; i++) {
				const id = i + (index > 0 ? index * this.options.shardsPerWorker : 0) + this.shardStart;
				chunks[index][i] = id;
			}
		});

		this.debugger?.info(`${chunks.length} buckets created`);
		return chunks;
	}

	postMessage(id: number, body: any) {
		const worker = this.get(id);
		if (!worker) return this.debugger?.error(`Worker ${id} doesnt exists.`);
		switch (this.options.mode) {
			case 'clusters':
				(worker as ClusterWorker).send(body);
				break;
			case 'threads':
				(worker as import('worker_threads').Worker).postMessage(body);
				break;
		}
	}

	async prepareWorkers(shards: number[][]) {
		for (let i = 0; i < shards.length; i++) {
			let worker = this.get(i);
			if (!worker) {
				worker = this.createWorker({
					path: this.options.path,
					debug: this.options.debug,
					token: this.options.token,
					shards: shards[i],
					intents: this.options.intents,
					workerId: i,
					workerProxy: this.options.workerProxy,
				});
				this.set(i, worker);
			}
			const listener = (message: WorkerStart) => {
				if (message.type !== 'WORKER_START') return;
				worker!.removeListener('message', listener);
				this.postMessage(i, {
					type: 'SPAWN_SHARDS',
					compress: this.options.compress ?? false,
					info: {
						...this.options.info,
						shards: this.totalShards,
					},
					properties: this.options.properties,
				} satisfies ManagerSpawnShards);
			};
			worker.on('message', listener);
		}
	}

	createWorker(workerData: WorkerData) {
		const worker_threads = lazyLoadPackage<typeof import('node:worker_threads')>('node:worker_threads');
		if (!worker_threads) throw new Error('Cannot create worker without worker_threads.');
		const env: Record<string, any> = {
			SEYFERT_SPAWNING: 'true',
		};
		for (const i in workerData) {
			env[`SEYFERT_WORKER_${i.toUpperCase()}`] = workerData[i as keyof WorkerData];
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
		}
	}

	spawn(workerId: number, shardId: number) {
		this.connectQueue.push(() => {
			const worker = this.get(workerId);
			if (!worker) {
				this.debugger?.fatal("Trying spawn with worker doesn't exist");
				return;
			}
			this.postMessage(workerId, {
				type: 'ALLOW_CONNECT',
				shardId,
				presence: this.options.presence?.(shardId, workerId),
			} satisfies ManagerAllowConnect);
		});
	}

	async handleWorkerMessage(message: WorkerMessage) {
		switch (message.type) {
			case 'CONNECT_QUEUE':
				this.spawn(message.workerId, message.shardId);
				break;
			case 'CACHE_REQUEST':
				{
					const worker = this.get(message.workerId);
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
				{
					switch (message.payload.t) {
						case 'GUILD_MEMBER_UPDATE':
							if (!this.memberUpdateHandler.check(message.payload.d)) {
								return;
							}
							break;
						case 'PRESENCE_UPDATE':
							if (!this.presenceUpdateHandler.check(message.payload.d)) {
								return;
							}
							break;
					}
					this.options.handlePayload(message.shardId, message.workerId, message.payload);
				}
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
						this.postMessage(this.keys().next().value, {
							type: 'BOT_READY',
						} satisfies ManagerSendBotReady);
						this.forEach(w => {
							delete w.ready;
						});
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
					const { nonce, type, ...data } = message;
					const evalResponse = this.promises.get(nonce);
					if (!evalResponse) {
						return;
					}
					this.promises.delete(nonce);
					clearTimeout(evalResponse.timeout);
					evalResponse.resolve(data.response);
				}
				break;
			case 'EVAL':
				{
					const nonce = this.generateNonce();
					this.postMessage(message.toWorkerId, {
						nonce,
						func: message.func,
						type: 'EXECUTE_EVAL',
						toWorkerId: message.toWorkerId,
					} satisfies ManagerExecuteEval);
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

	private generateNonce(large = true): string {
		const uuid = randomUUID();
		const nonce = large ? uuid : uuid.split('-')[0];
		if (this.promises.has(nonce)) return this.generateNonce(large);
		return nonce;
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
		const worker = this.get(workerId);

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
		const worker = this.get(workerId);

		if (!worker) {
			throw new Error(`Worker #${workerId} doesnt exist`);
		}

		const nonce = this.generateNonce(false);

		this.postMessage(workerId, { shardId, nonce, type: 'SHARD_INFO' } satisfies ManagerRequestShardInfo);

		return this.generateSendPromise<WorkerShardInfo>(nonce, 'Get shard info timeout');
	}

	async getWorkerInfo(workerId: number) {
		const worker = this.get(workerId);

		if (!worker) {
			throw new Error(`Worker #${workerId} doesnt exist`);
		}

		const nonce = this.generateNonce();

		this.postMessage(workerId, { nonce, type: 'WORKER_INFO' } satisfies ManagerRequestWorkerInfo);

		return this.generateSendPromise<WorkerInfo>(nonce, 'Get worker info timeout');
	}

	async start() {
		const rc = await BaseClient.prototype.getRC<InternalRuntimeConfig>();

		this.options.debug ||= rc.debug;
		this.options.intents ||= rc.intents ?? 0;
		this.options.token ??= rc.token;
		this.rest ??= new ApiHandler({
			token: this.options.token,
			baseUrl: 'api/v10',
			domain: 'https://discord.com',
			debug: this.options.debug,
		});
		this.options.info ??= await new Router(this.rest).createProxy().gateway.bot.get();
		this.options.shardEnd ??= this.options.totalShards ?? this.options.info.shards;
		this.options.totalShards ??= this.options.shardEnd;
		this.options = MergeOptions<Required<WorkerManagerOptions>>(WorkerManagerDefaults, this.options);
		this.options.workers ??= Math.ceil(this.options.totalShards / this.options.shardsPerWorker);
		this.connectQueue = new ConnectQueue(5.5e3, this.concurrency);

		if (this.options.debug) {
			this.debugger = new Logger({
				name: '[WorkerManager]',
			});
		}
		if (this.totalShards / this.shardsPerWorker > this.workers) {
			throw new Error(
				`Cannot create enough shards in the specified workers, minimum: ${Math.ceil(
					this.totalShards / this.shardsPerWorker,
				)}`,
			);
		}

		const spaces = this.prepareSpaces();
		await this.prepareWorkers(spaces);
	}
}

type CreateManagerMessage<T extends string, D extends object = {}> = { type: T } & D;

export type ManagerAllowConnect = CreateManagerMessage<
	'ALLOW_CONNECT',
	{ shardId: number; presence: GatewayPresenceUpdateData }
>;
export type ManagerSpawnShards = CreateManagerMessage<
	'SPAWN_SHARDS',
	Pick<ShardOptions, 'info' | 'properties' | 'compress'>
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
export type ManagerExecuteEval = CreateManagerMessage<
	'EXECUTE_EVAL',
	{
		func: string;
		nonce: string;
		toWorkerId: number;
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
	| ManagerExecuteEval;
