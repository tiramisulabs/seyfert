import { type UUID, randomUUID } from 'node:crypto';
import { ApiHandler, Logger } from '..';
import { WorkerAdapter } from '../cache';
import {
	type Awaitable,
	type DeepPartial,
	LogLevels,
	type MakeRequired,
	type When,
	calculateShardId,
	lazyLoadPackage,
} from '../common';
import { EventHandler } from '../events';
import type { GatewayDispatchPayload, GatewaySendPayload } from '../types';
import { Shard, type ShardManagerOptions, ShardSocketCloseCodes, type WorkerData, properties } from '../websocket';
import type {
	ClientHeartbeaterMessages,
	WorkerDisconnectedAllShardsResharding,
	WorkerMessages,
	WorkerReady,
	WorkerReadyResharding,
	WorkerReceivePayload,
	WorkerRequestConnect,
	WorkerRequestConnectResharding,
	WorkerSendEvalResponse,
	WorkerSendInfo,
	WorkerSendResultPayload,
	WorkerSendShardInfo,
	WorkerSendToWorkerEval,
	WorkerShardInfo,
	WorkerShardsConnected,
	WorkerStart,
	WorkerStartResharding,
} from '../websocket/discord/worker';
import type { ManagerMessages, ManagerSpawnShards } from '../websocket/discord/workermanager';
import type { BaseClientOptions, ServicesOptions, StartOptions } from './base';
import { BaseClient } from './base';
import type { Client, ClientOptions } from './client';

import { MemberUpdateHandler } from '../websocket/discord/events/memberUpdate';
import { PresenceUpdateHandler } from '../websocket/discord/events/presenceUpdate';
import type { WorkerHeartbeaterMessages } from '../websocket/discord/heartbeater';
import type { ShardData } from '../websocket/discord/shared';
import { Collectors } from './collectors';
import { type ClientUserStructure, Transformers } from './transformers';

let workerData: WorkerData;
let manager: import('node:worker_threads').MessagePort;
try {
	workerData = {
		debug: String(process.env.SEYFERT_WORKER_DEBUG) === 'true',
		intents: Number(process.env.SEYFERT_WORKER_INTENTS),
		path: process.env.SEYFERT_WORKER_PATH!,
		shards: JSON.parse(process.env.SEYFERT_WORKER_SHARDS!),
		token: process.env.SEYFERT_WORKER_TOKEN!,
		workerId: Number(process.env.SEYFERT_WORKER_WORKERID),
		workerProxy: String(process.env.SEYFERT_WORKER_WORKERPROXY) === 'true',
		totalShards: Number(process.env.SEYFERT_WORKER_TOTALSHARDS),
		mode: process.env.SEYFERT_WORKER_MODE as 'custom' | 'threads' | 'clusters',
		resharding: String(process.env.SEYFERT_WORKER_RESHARDING) === 'true',
		totalWorkers: Number(process.env.SEYFERT_WORKER_TOTALWORKERS),
		info: JSON.parse(process.env.SEYFERT_WORKER_INFO!),
		compress: String(process.env.SEYFERT_WORKER_COMPRESS) === 'true',
	} satisfies WorkerData;
} catch {
	//
}

export class WorkerClient<Ready extends boolean = boolean> extends BaseClient {
	memberUpdateHandler = new MemberUpdateHandler();
	presenceUpdateHandler = new PresenceUpdateHandler();
	collectors = new Collectors();
	events = new EventHandler(this);
	me!: When<Ready, ClientUserStructure>;
	promises = new Map<string, { resolve: (value: any) => void; timeout: NodeJS.Timeout }>();

	shards = new Map<number, Shard>();
	resharding = new Map<number, Shard>();

	declare options: WorkerClientOptions;

	constructor(options?: WorkerClientOptions) {
		super(options);
		if (options?.postMessage) {
			this.postMessage = options.postMessage;
		}

		if (this.options.handleManagerMessages) {
			const oldFn = this.handleManagerMessages.bind(this);
			this.handleManagerMessages = async message => {
				await this.options.handleManagerMessages!(message);
				return oldFn(message);
			};
		}
	}

	get workerId() {
		return workerData.workerId;
	}

	get latency() {
		let acc = 0;

		this.shards.forEach(s => (acc += s.latency));

		return acc / this.shards.size;
	}

	get applicationId() {
		return this.me?.application.id ?? super.applicationId;
	}

	set applicationId(id: string) {
		super.applicationId = id;
	}

	setServices(rest: ServicesOptions) {
		super.setServices(rest);
		if (this.options.postMessage && rest.cache?.adapter instanceof WorkerAdapter) {
			rest.cache.adapter.postMessage = this.options.postMessage;
		}
	}

	setWorkerData(data: WorkerData) {
		workerData = data;
	}

	get workerData() {
		return workerData;
	}

	async start(options: Omit<DeepPartial<StartOptions>, 'httpConnection' | 'token' | 'connection'> = {}) {
		const worker_threads = lazyLoadPackage<typeof import('node:worker_threads')>('node:worker_threads');

		if (worker_threads?.parentPort) {
			manager = worker_threads?.parentPort;
		}

		if (workerData.mode !== 'custom')
			(manager ?? process).on('message', (data: ManagerMessages) => this.handleManagerMessages(data));

		this.logger = new Logger({
			name: `[Worker #${workerData.workerId}]`,
		});

		if (workerData.debug) {
			this.debugger = new Logger({
				name: `[Worker #${workerData.workerId}]`,
				logLevel: LogLevels.Debug,
			});
		}
		if (workerData.workerProxy) {
			this.setServices({
				rest: new ApiHandler({
					token: workerData.token,
					workerProxy: true,
					debug: workerData.debug,
				}),
			});
		}
		this.cache.intents = workerData.intents;
		this.rest.workerData = workerData;
		this.postMessage({
			type: workerData.resharding ? 'WORKER_START_RESHARDING' : 'WORKER_START',
			workerId: workerData.workerId,
		} satisfies WorkerStart | WorkerStartResharding);
		await super.start(options);
		await this.loadEvents(options.eventsDir);
	}

	async loadEvents(dir?: string) {
		dir ??= await this.getRC().then(x => x.locations.events);
		if (dir) {
			await this.events.load(dir);
			this.logger.info('EventHandler loaded');
		}
	}

	postMessage(body: WorkerMessages | ClientHeartbeaterMessages): unknown {
		if (manager) return manager.postMessage(body);
		return process.send!(body);
	}

	async handleManagerMessages(data: ManagerMessages | WorkerHeartbeaterMessages) {
		switch (data.type) {
			case 'HEARTBEAT':
				this.postMessage({
					type: 'ACK_HEARTBEAT',
					workerId: workerData.workerId,
				});
				break;
			case 'CACHE_RESULT':
				if (this.cache.adapter instanceof WorkerAdapter && this.cache.adapter.promises.has(data.nonce)) {
					const cacheData = this.cache.adapter.promises.get(data.nonce)!;
					clearTimeout(cacheData.timeout);
					cacheData.resolve(data.result);
					this.cache.adapter.promises.delete(data.nonce);
				}
				break;
			case 'SEND_PAYLOAD':
				{
					const shard = this.shards.get(data.shardId);
					if (!shard) {
						this.logger.fatal('Worker trying send payload by non-existent shard');
						return;
					}

					await shard.send(true, {
						...data,
					} satisfies GatewaySendPayload);

					this.postMessage({
						type: 'RESULT_PAYLOAD',
						nonce: data.nonce,
						workerId: this.workerId,
					} satisfies WorkerSendResultPayload);
				}
				break;
			case 'ALLOW_CONNECT_RESHARDING':
				{
					const shard = this.resharding.get(data.shardId);
					if (!shard) {
						this.logger.fatal('Worker trying reshard non-existent shard');
						return;
					}
					shard.options.presence = data.presence;
					await shard.connect();
				}
				break;
			case 'ALLOW_CONNECT':
				{
					const shard = this.shards.get(data.shardId);
					if (!shard) {
						this.logger.fatal('Worker trying connect non-existent shard');
						return;
					}
					shard.options.presence = data.presence;
					await shard.connect();
				}
				break;
			case 'SPAWN_SHARDS_RESHARDING':
				{
					let shardsConnected = 0;
					const self = this;
					for (const id of workerData.shards) {
						const existsShard = this.resharding.has(id);
						if (existsShard) {
							this.logger.warn(`Trying to re-spawn existing shard #${id}`);
							continue;
						}

						const shard = new Shard(id, {
							token: workerData.token,
							intents: workerData.intents,
							info: data.info,
							compress: data.compress,
							debugger: this.debugger,
							properties: {
								...properties,
								...this.options.gateway?.properties,
							},
							handlePayload(_, payload) {
								if (payload.t !== 'GUILDS_READY') return;
								if (++shardsConnected === workerData.shards.length) {
									self.postMessage({
										type: 'WORKER_READY_RESHARDING',
										workerId: workerData.workerId,
									} satisfies WorkerReadyResharding);
								}
							},
						});
						this.resharding.set(id, shard);
						this.postMessage({
							type: 'CONNECT_QUEUE_RESHARDING',
							shardId: id,
							workerId: workerData.workerId,
						} satisfies WorkerRequestConnectResharding);
					}
				}
				break;
			case 'SPAWN_SHARDS':
				{
					for (const id of workerData.shards) {
						const existsShard = this.shards.has(id);
						if (existsShard) {
							this.logger.warn(`Trying to spawn existing shard #${id}`);
							continue;
						}

						const shard = this.createShard(id, data);
						this.shards.set(id, shard);
						this.postMessage({
							type: 'CONNECT_QUEUE',
							shardId: id,
							workerId: workerData.workerId,
						} satisfies WorkerRequestConnect);
					}
				}
				break;
			case 'SHARD_INFO':
				{
					const shard = this.shards.get(data.shardId);
					if (!shard) {
						this.logger.fatal('Worker trying get non-existent shard');
						return;
					}

					this.postMessage({
						...generateShardInfo(shard),
						nonce: data.nonce,
						type: 'SHARD_INFO',
						workerId: this.workerId,
					} satisfies WorkerSendShardInfo);
				}
				break;
			case 'WORKER_INFO':
				{
					this.postMessage({
						shards: [...this.shards.values()].map(generateShardInfo),
						workerId: workerData.workerId,
						type: 'WORKER_INFO',
						nonce: data.nonce,
					} satisfies WorkerSendInfo);
				}
				break;
			case 'BOT_READY':
				await this.events.runEvent('BOT_READY', this, this.me, -1);
				break;
			case 'API_RESPONSE':
				{
					const promise = this.rest.workerPromises!.get(data.nonce);
					if (!promise) return;
					this.rest.workerPromises!.delete(data.nonce);
					if (data.error) return promise.reject(data.error);
					promise.resolve(data.response);
				}
				break;
			case 'EXECUTE_EVAL':
			case 'EXECUTE_EVAL_TO_WORKER':
				{
					let result: unknown;
					try {
						result = await eval(`
					(${data.func})(this, ${data.vars})
					`);
					} catch (e) {
						result = e;
					}
					this.postMessage({
						type: 'EVAL_RESPONSE',
						response: result,
						workerId: workerData.workerId,
						nonce: data.nonce,
					} satisfies WorkerSendEvalResponse);
				}
				break;
			case 'EVAL_RESPONSE':
				{
					const evalResponse = this.promises.get(data.nonce);
					if (!evalResponse) return;
					this.promises.delete(data.nonce);
					clearTimeout(evalResponse.timeout);
					evalResponse.resolve(data.response);
				}
				break;
			case 'WORKER_ALREADY_EXISTS_RESHARDING':
				{
					this.postMessage({
						type: 'WORKER_START_RESHARDING',
						workerId: workerData.workerId,
					} satisfies WorkerStartResharding);
				}
				break;
			case 'DISCONNECT_ALL_SHARDS_RESHARDING':
				{
					for (const i of this.shards.values()) {
						await i.disconnect(ShardSocketCloseCodes.Resharding);
					}
					this.postMessage({
						type: 'DISCONNECTED_ALL_SHARDS_RESHARDING',
						workerId: workerData.workerId,
					} satisfies WorkerDisconnectedAllShardsResharding);
				}
				break;
			case 'CONNECT_ALL_SHARDS_RESHARDING':
				{
					this.shards.clear();
					const handlePayload = this.options?.handlePayload?.bind(this);
					for (const [id, shard] of this.resharding) {
						this.shards.set(id, shard);
						shard.options.handlePayload = async (shardId, packet) => {
							await handlePayload?.(shardId, packet);
							return this.onPacket(packet, shardId);
						};
					}
					workerData.totalShards = data.totalShards;
					workerData.shards = [...this.shards.keys()];
					this.resharding.clear();
				}
				break;
		}
	}

	calculateShardId(guildId: string) {
		return calculateShardId(guildId, this.workerData.totalShards);
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

	tellWorker<R, V extends Record<string, unknown>>(workerId: number, func: (_: this, vars: V) => R, vars: V) {
		const nonce = this.generateNonce();
		this.postMessage({
			type: 'EVAL_TO_WORKER',
			func: func.toString(),
			toWorkerId: workerId,
			workerId: workerData.workerId,
			nonce,
			vars: JSON.stringify(vars),
		} satisfies WorkerSendToWorkerEval);
		return this.generateSendPromise<R>(nonce);
	}

	tellWorkers<R, V extends Record<string, unknown>>(func: (_: this, vars: V) => R, vars: V) {
		const promises: Promise<R>[] = [];
		for (let i = 0; i < workerData.totalWorkers; i++) {
			promises.push(this.tellWorker(i, func, vars));
		}
		return Promise.all(promises);
	}

	createShard(id: number, data: Pick<ManagerSpawnShards, 'info' | 'compress'>) {
		const onPacket = this.onPacket.bind(this);
		const handlePayload = this.options?.handlePayload?.bind(this);
		const self = this;
		const shard = new Shard(id, {
			token: workerData.token,
			intents: workerData.intents,
			info: data.info,
			compress: data.compress,
			debugger: this.debugger,
			properties: {
				...properties,
				...this.options.gateway?.properties,
			},
			async handlePayload(shardId, payload) {
				await handlePayload?.(shardId, payload);
				await onPacket(payload, shardId);
				if (self.options.sendPayloadToParent)
					self.postMessage({
						workerId: workerData.workerId,
						shardId,
						type: 'RECEIVE_PAYLOAD',
						payload,
					} satisfies WorkerReceivePayload);
			},
		});

		return shard;
	}

	async resumeShard(shardId: number, shardData: MakeRequired<ShardData>) {
		const exists = (
			await this.tellWorkers((r, vars) => r.shards.has(vars.shardId), {
				shardId,
			})
		).some(x => x);
		if (exists) throw new Error('Cannot override existing shard');
		const shard = this.createShard(shardId, {
			info: this.workerData.info,
			compress: this.workerData.compress,
		});
		shard.data = shardData;
		this.shards.set(shardId, shard);
		return this.postMessage({
			workerId: this.workerId,
			shardId,
			type: 'CONNECT_QUEUE',
		});
	}

	protected async onPacket(packet: GatewayDispatchPayload, shardId: number) {
		Promise.allSettled([
			this.events.runEvent('RAW', this, packet, shardId, false),
			this.collectors.run('RAW', packet, this),
		]); //ignore promise
		switch (packet.t) {
			case 'GUILD_MEMBER_UPDATE':
				{
					if (!this.memberUpdateHandler.check(packet.d)) {
						return;
					}
					await this.events.execute(packet, this as WorkerClient<true>, shardId);
				}
				break;
			case 'PRESENCE_UPDATE':
				{
					if (!this.presenceUpdateHandler.check(packet.d)) {
						return;
					}
					await this.events.execute(packet, this as WorkerClient<true>, shardId);
				}
				break;
			default: {
				switch (packet.t) {
					case 'INTERACTION_CREATE':
						{
							await this.events.execute(packet, this, shardId);
							await this.handleCommand.interaction(packet.d, shardId);
						}
						break;
					case 'MESSAGE_CREATE':
						{
							await this.events.execute(packet, this, shardId);
							await this.handleCommand.message(packet.d, shardId);
						}
						break;
					case 'READY': {
						this.botId = packet.d.user.id;
						this.applicationId = packet.d.application.id;
						this.me = Transformers.ClientUser(this, packet.d.user, packet.d.application) as never;
						if ([...this.shards.values()].every(shard => shard.data.session_id)) {
							this.postMessage({
								type: 'WORKER_SHARDS_CONNECTED',
								workerId: this.workerId,
							} as WorkerShardsConnected);
							await this.events.runEvent('WORKER_SHARDS_CONNECTED', this, this.me, -1);
						}
						await this.events.execute(packet, this, shardId);
						this.debugger?.debug(`#${shardId}[${packet.d.user.username}](${this.botId}) is online...`);
						break;
					}
					case 'GUILDS_READY':
						{
							if ([...this.shards.values()].every(shard => shard.isReady)) {
								this.postMessage({
									type: 'WORKER_READY',
									workerId: this.workerId,
								} as WorkerReady);
								await this.events.runEvent('WORKER_READY', this, this.me, -1);
							}
							await this.events.execute(packet, this, shardId);
						}
						break;
					default:
						await this.events.execute(packet, this, shardId);
						break;
				}
				break;
			}
		}
	}
}

export function generateShardInfo(shard: Shard): WorkerShardInfo {
	return {
		open: shard.isOpen,
		shardId: shard.id,
		latency: shard.latency,
		resumable: shard.resumable,
		workerId: workerData.workerId,
	};
}

export interface WorkerClientOptions extends BaseClientOptions {
	commands?: NonNullable<Client['options']>['commands'];
	handlePayload?: ShardManagerOptions['handlePayload'];
	gateway?: ClientOptions['gateway'];
	postMessage?: (body: unknown) => Awaitable<unknown>;
	/** can have perfomance issues in big bots if the client sends every event, specially in startup (false by default) */
	sendPayloadToParent?: boolean;
	handleManagerMessages?(message: ManagerMessages | WorkerHeartbeaterMessages): Awaitable<unknown>;
}
