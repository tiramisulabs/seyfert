import { randomUUID } from 'node:crypto';
import { Worker } from 'node:worker_threads';
import { ApiHandler, Router } from '../..';
import { MemoryAdapter, type Adapter } from '../../cache';
import { BaseClient, type InternalRuntimeConfig } from '../../client/base';
import {
	Logger,
	type MakePartial,
	MergeOptions,
	type GatewayPresenceUpdateData,
	type GatewaySendPayload,
} from '../../common';
import { WorkerManagerDefaults } from '../constants';
import { SequentialBucket } from '../structures';
import { ConnectQueue } from '../structures/timeout';
import { MemberUpdateHandler } from './events/memberUpdate';
import { PresenceUpdateHandler } from './events/presenceUpdate';
import type { ShardOptions, WorkerData, WorkerManagerOptions } from './shared';
import type { WorkerInfo, WorkerMessage, WorkerShardInfo } from './worker';
export class WorkerManager extends Map<number, Worker & { ready?: boolean }> {
	options!: Required<WorkerManagerOptions>;
	debugger?: Logger;
	connectQueue!: ConnectQueue;
	cacheAdapter: Adapter;
	promises = new Map<string, { resolve: (value: any) => void; timeout: NodeJS.Timeout }>();
	memberUpdateHandler = new MemberUpdateHandler();
	presenceUpdateHandler = new PresenceUpdateHandler();
	rest!: ApiHandler;
	constructor(options: MakePartial<WorkerManagerOptions, 'token' | 'intents' | 'info'>) {
		super();
		this.options = MergeOptions<Required<WorkerManagerOptions>>(WorkerManagerDefaults, options);
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
		return this.options.totalShards;
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
		return Number((BigInt(guildId) >> 22n) % BigInt(this.options.info.shards ?? 1));
	}

	calculateWorkerId(shardId: number) {
		const workerId = Math.floor(shardId / this.shardsPerWorker);
		if (workerId >= this.workers) {
			throw new Error('Invalid shardId');
		}
		return workerId;
	}

	prepareSpaces() {
		this.debugger?.info('Preparing buckets');

		const chunks = SequentialBucket.chunk<number>(
			new Array(
				this.options.shardStart !== undefined && this.options.shardEnd !== undefined
					? this.options.shardEnd - this.options.shardStart
					: this.options.totalShards,
			),
			this.options.shardsPerWorker,
		);

		chunks.forEach((shards, index) => {
			for (let i = 0; i < shards.length; i++) {
				const id = i + (index > 0 ? index * this.options.shardsPerWorker : 0) + (this.options.shardStart ?? 0);
				chunks[index][i] = id;
			}
		});

		this.debugger?.info(`${chunks.length} buckets created`);
		return chunks;
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
				});
				this.set(i, worker);
			}
			worker.postMessage({
				type: 'SPAWN_SHARDS',
				compress: this.options.compress ?? false,
				info: this.options.info,
				properties: this.options.properties,
			} satisfies ManagerSpawnShards);
		}
	}

	createWorker(workerData: WorkerData) {
		const worker = new Worker(workerData.path, { workerData });
		worker.on('message', data => this.handleWorkerMessage(data));

		return worker;
	}

	spawn(workerId: number, shardId: number) {
		this.connectQueue.push(() => {
			const worker = this.get(workerId);
			if (!worker) {
				this.debugger?.fatal("Trying spawn with worker doesn't exist");
				return;
			}

			worker.postMessage({
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
					worker.postMessage({
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
							if (!this.presenceUpdateHandler.check(message.payload.d as any)) {
								return;
							}
							break;
					}
					this.options.handlePayload(message.shardId, message.workerId, message.payload);
				}
				break;
			case 'RESULT_PAYLOAD':
				{
					const cacheData = this.promises.get(message.nonce);
					if (!cacheData) {
						return;
					}
					this.promises.delete(message.nonce);
					clearTimeout(cacheData.timeout);
					cacheData.resolve(true);
				}
				break;
			case 'SHARD_INFO':
				{
					const { nonce, type, ...data } = message;
					const cacheData = this.promises.get(nonce);
					if (!cacheData) {
						return;
					}
					this.promises.delete(nonce);
					clearTimeout(cacheData.timeout);
					cacheData.resolve(data);
				}
				break;
			case 'WORKER_INFO':
				{
					const { nonce, type, ...data } = message;
					const cacheData = this.promises.get(nonce);
					if (!cacheData) {
						return;
					}
					this.promises.delete(nonce);
					clearTimeout(cacheData.timeout);
					cacheData.resolve(data);
				}
				break;
			case 'WORKER_READY':
				{
					this.get(message.workerId)!.ready = true;
					if ([...this.values()].every(w => w.ready)) {
						this.get(this.keys().next().value)?.postMessage({
							type: 'BOT_READY',
						} satisfies ManagerSendBotReady);
						this.forEach(w => {
							delete w.ready;
						});
					}
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
		let resolve = (_: T) => {
			/**/
		};
		let timeout = -1 as unknown as NodeJS.Timeout;

		const promise = new Promise<T>((res, rej) => {
			resolve = res;
			timeout = setTimeout(() => {
				this.promises.delete(nonce);
				rej(new Error(message));
			}, 3e3);
		});

		this.promises.set(nonce, { resolve, timeout });

		return promise;
	}

	async send(data: GatewaySendPayload, shardId: number) {
		const workerId = this.calculateWorkerId(shardId);
		const worker = this.get(workerId);

		if (!worker) {
			throw new Error(`Worker #${workerId} doesnt exist`);
		}

		const nonce = this.generateNonce();

		worker.postMessage({
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

		worker.postMessage({ shardId, nonce, type: 'SHARD_INFO' } satisfies ManagerRequestShardInfo);

		return this.generateSendPromise<WorkerShardInfo>(nonce, 'Get shard info timeout');
	}

	async getWorkerInfo(workerId: number) {
		const worker = this.get(workerId);

		if (!worker) {
			throw new Error(`Worker #${workerId} doesnt exist`);
		}

		const nonce = this.generateNonce();

		worker.postMessage({ nonce, type: 'WORKER_INFO' } satisfies ManagerRequestWorkerInfo);

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
		}); //TODO: share ratelimits with all workers
		this.options.info ??= await new Router(this.rest).createProxy().gateway.bot.get();
		this.options.totalShards ??= this.options.info.shards;
		this.options = MergeOptions<Required<WorkerManagerOptions>>(WorkerManagerDefaults, this.options);
		this.options.workers ??= Math.ceil(this.options.totalShards / this.options.shardsPerWorker);
		this.options.info.shards = this.options.totalShards;
		this.options.shardEnd ??= this.options.totalShards;
		this.options.shardStart ??= 0;
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

export type ManagerMessages =
	| ManagerAllowConnect
	| ManagerSpawnShards
	| ManagerSendPayload
	| ManagerRequestShardInfo
	| ManagerRequestWorkerInfo
	| ManagerSendCacheResult
	| ManagerSendBotReady;
