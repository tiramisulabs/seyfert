import { type UUID, randomUUID } from 'node:crypto';
import { ApiHandler, Logger } from '..';
import { WorkerAdapter } from '../cache';
import { type DeepPartial, LogLevels, type When, hasIntent, lazyLoadPackage } from '../common';
import { EventHandler } from '../events';
import type { GatewayDispatchPayload, GatewaySendPayload } from '../types';
import { Shard, type ShardManagerOptions, type WorkerData, properties } from '../websocket';
import type {
	WorkerDisconnectedAllShardsResharding,
	WorkerMessage,
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
import type { ManagerMessages } from '../websocket/discord/workermanager';
import type { BaseClientOptions, ServicesOptions, StartOptions } from './base';
import { BaseClient } from './base';
import type { Client, ClientOptions } from './client';

import { MemberUpdateHandler } from '../websocket/discord/events/memberUpdate';
import { PresenceUpdateHandler } from '../websocket/discord/events/presenceUpdate';
import { Collectors } from './collectors';
import { type ClientUserStructure, Transformers } from './transformers';

let workerData: WorkerData;
let manager: import('node:worker_threads').MessagePort;
try {
	workerData = {
		debug: process.env.SEYFERT_WORKER_DEBUG === 'true',
		intents: Number(process.env.SEYFERT_WORKER_INTENTS),
		path: process.env.SEYFERT_WORKER_PATH!,
		shards: process.env.SEYFERT_WORKER_SHARDS!.split(',').map(id => Number(id)),
		token: process.env.SEYFERT_WORKER_TOKEN!,
		workerId: Number(process.env.SEYFERT_WORKER_WORKERID),
		workerProxy: process.env.SEYFERT_WORKER_WORKERPROXY === 'true',
		totalShards: Number(process.env.SEYFERT_WORKER_TOTALSHARDS),
		mode: process.env.SEYFERT_WORKER_MODE as 'custom' | 'threads' | 'clusters',
		resharding: process.env.SEYFERT_WORKER_RESHARDING === 'true',
		totalWorkers: Number(process.env.SEYFERT_WORKER_TOTALWORKERS),
	} satisfies WorkerData;
} catch {
	//
}

export class WorkerClient<Ready extends boolean = boolean> extends BaseClient {
	private __handleGuilds?: string[];
	private __handleGuildsResharding?: string[];

	memberUpdateHandler = new MemberUpdateHandler();
	presenceUpdateHandler = new PresenceUpdateHandler();
	collectors = new Collectors();
	events? = new EventHandler(this);
	me!: When<Ready, ClientUserStructure>;
	promises = new Map<string, { resolve: (value: any) => void; timeout: NodeJS.Timeout }>();

	shards = new Map<number, Shard>();
	resharding = new Map<number, Shard>();
	private _ready?: boolean;
	private __setServicesCache?: boolean;

	declare options: WorkerClientOptions;

	constructor(options?: WorkerClientOptions) {
		super(options);
		if (options?.postMessage) {
			this.postMessage = options.postMessage;
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

	setServices(rest: ServicesOptions) {
		super.setServices(rest);
		if (rest.cache) {
			this.__setServicesCache = true;
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

		if (this.__setServicesCache) {
			this.setServices({
				cache: {
					disabledCache: this.cache.disabledCache,
				},
			});
		} else {
			const adapter = new WorkerAdapter(workerData);
			if (this.options.postMessage) {
				adapter.postMessage = this.options.postMessage;
			}
			this.setServices({
				cache: {
					adapter,
					disabledCache: this.cache.disabledCache,
				},
			});
		}

		delete this.__setServicesCache;

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
		this.postMessage({
			type: workerData.resharding ? 'WORKER_START_RESHARDING' : 'WORKER_START',
			workerId: workerData.workerId,
		} satisfies WorkerStart | WorkerStartResharding);
		if (workerData.resharding) {
			this.__handleGuildsResharding = [];
		}
		await super.start(options);
		await this.loadEvents(options.eventsDir);
		this.cache.intents = workerData.intents;
	}

	async loadEvents(dir?: string) {
		dir ??= await this.getRC().then(x => ('events' in x.locations ? x.locations.events : undefined));
		if (dir && this.events) {
			await this.events.load(dir);
			this.logger.info('EventHandler loaded');
		}
	}

	postMessage(body: WorkerMessage): unknown {
		if (manager) return manager.postMessage(body);
		return process.send!(body);
	}

	async handleManagerMessages(data: ManagerMessages) {
		switch (data.type) {
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
								if (payload.t === 'GUILD_CREATE' || payload.t === 'GUILD_DELETE') {
									const indexOf = self.__handleGuildsResharding!.indexOf(payload.d.id);
									if (indexOf !== -1) {
										self.__handleGuildsResharding!.splice(indexOf, 1);
										if (!self.__handleGuildsResharding?.length && shardsConnected === workerData.shards.length) {
											delete self.__handleGuildsResharding;
											self.postMessage({
												type: 'WORKER_READY_RESHARDING',
												workerId: workerData.workerId,
											} satisfies WorkerReadyResharding);
										}
									}
								}

								if (payload.t !== 'READY') return;
								shardsConnected++;

								const ids = payload.d.guilds.map(x => x.id);
								if (hasIntent(workerData.intents, 'Guilds')) {
									self.__handleGuildsResharding = self.__handleGuildsResharding?.concat(ids) ?? ids;
								}

								if (shardsConnected === workerData.shards.length && !self.__handleGuildsResharding?.length) {
									delete self.__handleGuildsResharding;
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
					const onPacket = this.onPacket.bind(this);
					const handlePayload = this.options?.handlePayload?.bind(this);
					const self = this;
					for (const id of workerData.shards) {
						const existsShard = this.shards.has(id);
						if (existsShard) {
							this.logger.warn(`Trying to spawn existing shard #${id}`);
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
				await this.events?.runEvent('BOT_READY', this, this.me, -1);
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
					(${data.func})(this)
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
					this.__handleGuildsResharding = [];
					this.postMessage({
						type: 'WORKER_START_RESHARDING',
						workerId: workerData.workerId,
					} satisfies WorkerStartResharding);
				}
				break;
			case 'DISCONNECT_ALL_SHARDS_RESHARDING':
				{
					for (const i of this.shards.values()) {
						await i.disconnect();
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
					this.resharding.clear();
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

	tellWorker<R>(workerId: number, func: (_: this) => R) {
		const nonce = this.generateNonce();
		this.postMessage({
			type: 'EVAL_TO_WORKER',
			func: func.toString(),
			toWorkerId: workerId,
			workerId: workerData.workerId,
			nonce,
		} satisfies WorkerSendToWorkerEval);
		return this.generateSendPromise<R>(nonce);
	}

	tellWorkers<R>(func: (_: this) => R) {
		const promises: Promise<R>[] = [];
		for (let i = 0; i < workerData.totalWorkers; i++) {
			promises.push(this.tellWorker(i, func));
		}
		return Promise.all(promises);
	}

	protected async onPacket(packet: GatewayDispatchPayload, shardId: number) {
		Promise.allSettled([
			this.events?.runEvent('RAW', this, packet, shardId, false),
			this.collectors.run('RAW', packet, this),
		]); //ignore promise
		switch (packet.t) {
			//// Cases where we must obtain the old data before updating
			case 'GUILD_MEMBER_UPDATE':
				{
					if (!this.memberUpdateHandler.check(packet.d)) {
						return;
					}
					await this.events?.execute(packet.t, packet, this as WorkerClient<true>, shardId);
				}
				break;
			case 'PRESENCE_UPDATE':
				{
					if (!this.presenceUpdateHandler.check(packet.d)) {
						return;
					}
					await this.events?.execute(packet.t, packet, this as WorkerClient<true>, shardId);
				}
				break;
			case 'GUILD_DELETE':
			case 'GUILD_CREATE': {
				if (this.__handleGuilds?.includes(packet.d.id)) {
					this.__handleGuilds?.splice(this.__handleGuilds!.indexOf(packet.d.id), 1);
					if (!this.__handleGuilds?.length && [...this.shards.values()].every(shard => shard.data.session_id)) {
						delete this.__handleGuilds;
						await this.cache.onPacket(packet);
						this.postMessage({
							type: 'WORKER_READY',
							workerId: this.workerId,
						} as WorkerReady);
						return this.events?.runEvent('WORKER_READY', this, this.me, -1);
					}
					if (!this.__handleGuilds?.length) delete this.__handleGuilds;
					return this.cache.onPacket(packet);
				}
				await this.events?.execute(packet.t, packet, this, shardId);
				break;
			}
			default: {
				switch (packet.t) {
					case 'INTERACTION_CREATE':
						{
							await this.events?.execute(packet.t as never, packet, this, shardId);
							await this.handleCommand.interaction(packet.d, shardId);
						}
						break;
					case 'MESSAGE_CREATE':
						{
							await this.events?.execute(packet.t as never, packet, this, shardId);
							await this.handleCommand.message(packet.d, shardId);
						}
						break;
					case 'READY':
						{
							const ids = packet.d.guilds.map(x => x.id);
							if (hasIntent(this.workerData.intents, 'Guilds')) {
								this.__handleGuilds = this.__handleGuilds?.concat(ids) ?? ids;
							}
							this.botId = packet.d.user.id;
							this.applicationId = packet.d.application.id;
							this.me = Transformers.ClientUser(this, packet.d.user, packet.d.application) as never;
							await this.events?.execute(packet.t as never, packet, this, shardId);
							if (!this._ready && [...this.shards.values()].every(shard => shard.data.session_id)) {
								this._ready = true;
								this.postMessage({
									type: 'WORKER_SHARDS_CONNECTED',
									workerId: this.workerId,
								} as WorkerShardsConnected);
								await this.events?.runEvent('WORKER_SHARDS_CONNECTED', this, this.me, -1);
							}
							if (!this.__handleGuilds!.length) {
								if ([...this.shards.values()].every(shard => shard.data.session_id)) {
									this.postMessage({
										type: 'WORKER_READY',
										workerId: this.workerId,
									} as WorkerReady);
									await this.events?.runEvent('WORKER_READY', this, this.me, -1);
								}
								delete this.__handleGuilds;
							}
							this.debugger?.debug(`#${shardId}[${packet.d.user.username}](${this.botId}) is online...`);
						}
						break;
					default:
						await this.events?.execute(packet.t as never, packet, this, shardId);
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

interface WorkerClientOptions extends BaseClientOptions {
	commands?: NonNullable<Client['options']>['commands'];
	handlePayload?: ShardManagerOptions['handlePayload'];
	gateway?: ClientOptions['gateway'];
	postMessage?: (body: unknown) => unknown;
	/** can have perfomance issues in big bots if the client sends every event, specially in startup (false by default) */
	sendPayloadToParent?: boolean;
}
