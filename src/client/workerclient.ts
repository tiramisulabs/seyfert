import { randomUUID, type UUID } from 'node:crypto';
import { ApiHandler, Logger } from '..';
import { WorkerAdapter } from '../cache';
import {
	type Awaitable,
	calculateShardId,
	type DeepPartial,
	LogLevels,
	lazyLoadPackage,
	type MakeRequired,
	SeyfertError,
	type When,
} from '../common';
import { EventHandler } from '../events';
import { GatewayDispatchEvents, type GatewayDispatchPayload, type GatewaySendPayload } from '../types';
import {
	properties,
	Shard,
	type ShardDisconnectData,
	type ShardManagerOptions,
	type ShardReconnectData,
	ShardSocketCloseCodes,
	type WorkerData,
} from '../websocket';
import { MemberUpdateHandler } from '../websocket/discord/events/memberUpdate';
import { PresenceUpdateHandler } from '../websocket/discord/events/presenceUpdate';
import type { WorkerHeartbeaterMessages } from '../websocket/discord/heartbeater';
import type {
	PhysicalHostToWorkerMessage,
	PhysicalWorkerIdentity,
	PhysicalWorkerToHostMessage,
} from '../websocket/discord/physical-worker-port';
import type { ShardData } from '../websocket/discord/shared';
import type {
	ClientHeartbeaterMessages,
	WorkerCutoverAppliedResharding,
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
import type { BaseClientOptions, InternalRuntimeConfig, ServicesOptions, StartOptions } from './base';
import { BaseClient } from './base';
import type { Client, ClientOptions } from './client';
import { Collectors } from './collectors';
import { PhysicalWorkerRuntime } from './physical-worker-runtime';
import {
	applyPluginGatewayDispatchInterceptors,
	applyPluginGatewaySendPayloadWrappers,
	type RegisteredPluginExtension,
	runPluginHooks,
} from './plugins';
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
		reshardId: process.env.SEYFERT_WORKER_RESHARDID,
		incarnationId: process.env.SEYFERT_WORKER_INCARNATIONID,
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
	private readonly physicalRuntime?: PhysicalWorkerRuntime;
	private reshardId = workerData?.reshardId;
	private readonly reshardReadyShards = new Map<string, Set<number>>();
	private readonly reshardReadinessSent = new Set<string>();

	constructor(options?: WorkerClientOptions) {
		super(options);
		if (options?.postMessage) {
			this.postMessage = options.postMessage;
		}
		const physicalIdentity = resolvePhysicalIdentity(options?.physicalWorker);
		if (physicalIdentity) this.physicalRuntime = new PhysicalWorkerRuntime(this, physicalIdentity);
	}

	get workerId() {
		return workerData.workerId;
	}

	get latency() {
		if (this.shards.size <= 0) return 0;
		let acc = 0;

		this.shards.forEach(s => (acc += s.latency));

		return acc / this.shards.size;
	}

	private async onShardDisconnect(data: ShardDisconnectData) {
		this.physicalRuntime?.markShardDisconnected(data.shardId);
		if (this.physicalRuntime && !this.physicalRuntime.allowsUserEvents) return;
		await this.options?.onShardDisconnect?.(data);
		await this.events.runEvent('SHARD_DISCONNECT', this, data, data.shardId, false);
	}

	private async onShardReconnect(data: ShardReconnectData) {
		if (this.physicalRuntime && !this.physicalRuntime.allowsUserEvents) return;
		await this.options?.onShardReconnect?.(data);
		await this.events.runEvent('SHARD_RECONNECT', this, data, data.shardId, false);
	}

	get applicationId(): When<Ready, string, ''> {
		return (this.me?.application.id ?? super.applicationId) as never;
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
		this.reshardId = data.reshardId;
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
			(manager ?? process).on('message', (data: unknown) => this.handleManagerMessages(data as ManagerMessages));

		this.configureLogger({ name: `[Worker #${workerData.workerId}]` }, this.options.logger);

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
		this.resolvePluginGatewayIntents(workerData.intents);
		this.rest.workerData = workerData;
		await super.start(options);
		workerData.intents = this.resolvePluginGatewayIntents(workerData.intents);
		if (!this.physicalRuntime) {
			if (workerData.resharding) {
				if (!this.reshardId) throw new Error('Resharding worker requires an opaque reshard attempt id');
				this.postMessage({
					type: 'WORKER_START_RESHARDING',
					workerId: workerData.workerId,
					incarnationId: workerData.incarnationId!,
					reshardId: this.reshardId,
				} satisfies WorkerStartResharding);
			} else {
				this.postMessage({
					type: 'WORKER_START',
					workerId: workerData.workerId,
					incarnationId: workerData.incarnationId!,
				} satisfies WorkerStart);
			}
		}
		await this.loadEvents(options.eventsDir);
		if (this.physicalRuntime) {
			await this.physicalRuntime.markApplicationReady();
			this.physicalRuntime.startGateway();
		}
	}

	async close() {
		this.physicalRuntime?.close();
		await super.close();
	}

	async loadEvents(dir?: string) {
		dir ??= await this.getRC<InternalRuntimeConfig>().then(x => x.locations.events);
		await runPluginHooks(this, 'events:beforeLoad', this, dir);
		if (dir) {
			await this.events.load(dir);
			this.logger.info('EventHandler loaded');
		}
		await runPluginHooks(this, 'events:afterLoad', this, dir);
	}

	postMessage(body: WorkerMessages | ClientHeartbeaterMessages | PhysicalWorkerToHostMessage): unknown {
		if (manager) return manager.postMessage(body);
		return process.send!(body);
	}

	async handleManagerMessages(data: ManagerMessages | WorkerHeartbeaterMessages | PhysicalHostToWorkerMessage) {
		if (await this.physicalRuntime?.handleMessage(data)) return;
		await this.options.handleManagerMessages?.(data as ManagerMessages | WorkerHeartbeaterMessages);
		switch (data.type) {
			case 'HEARTBEAT':
				this.postMessage({
					type: 'ACK_HEARTBEAT',
					workerId: workerData.workerId,
					incarnationId: workerData.incarnationId!,
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
						this.logger.fatal(`Worker trying to send payload by non-existent shard (#${data.shardId})`);
						return;
					}

					const { nonce: _nonce, shardId: _shardId, type: _type, ...payload } = data;
					const pluginPayload = await applyPluginGatewaySendPayloadWrappers(
						this,
						data.shardId,
						payload as GatewaySendPayload,
					);
					if (pluginPayload !== null) await shard.send(true, pluginPayload);

					this.postMessage({
						type: 'RESULT_PAYLOAD',
						nonce: data.nonce,
						workerId: this.workerId,
						incarnationId: workerData.incarnationId!,
					} satisfies WorkerSendResultPayload);
				}
				break;
			case 'ALLOW_CONNECT_RESHARDING':
				{
					if (data.reshardId !== this.reshardId) break;
					const shard = this.resharding.get(data.shardId);
					if (!shard) {
						this.logger.fatal(`Worker trying to reshard non-existent shard (#${data.shardId})`);
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
						this.logger.fatal(`Worker trying to connect non-existent shard (#${data.shardId})`);
						return;
					}
					shard.options.presence = data.presence;
					await shard.connect();
				}
				break;
			case 'SPAWN_SHARDS_RESHARDING':
				{
					if (data.reshardId !== this.reshardId) break;
					const reshardId = data.reshardId;
					const readyShards = this.reshardReadyShards.get(reshardId) ?? new Set<number>();
					this.reshardReadyShards.set(reshardId, readyShards);
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
							onShardDisconnect: this.onShardDisconnect.bind(this),
							onShardReconnect: this.onShardReconnect.bind(this),
							properties: {
								...properties,
								...this.options.gateway?.properties,
							},
							handlePayload(_, payload) {
								if (payload.t !== GatewayDispatchEvents.GuildsReady) return;
								readyShards.add(id);
								if (
									!self.reshardReadinessSent.has(reshardId) &&
									workerData.shards.every(shardId => readyShards.has(shardId))
								) {
									self.reshardReadinessSent.add(reshardId);
									self.postMessage({
										type: 'WORKER_READY_RESHARDING',
										workerId: workerData.workerId,
										incarnationId: workerData.incarnationId!,
										reshardId,
									} satisfies WorkerReadyResharding);
								}
							},
						});
						this.resharding.set(id, shard);
						this.postMessage({
							type: 'CONNECT_QUEUE_RESHARDING',
							shardId: id,
							workerId: workerData.workerId,
							incarnationId: workerData.incarnationId!,
							reshardId,
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
							incarnationId: workerData.incarnationId!,
						} satisfies WorkerRequestConnect);
					}
				}
				break;
			case 'SHARD_INFO':
				{
					const shard = this.shards.get(data.shardId);
					if (!shard) {
						this.logger.fatal(`Worker trying to get non-existent shard (#${data.shardId})`);
						return;
					}

					this.postMessage({
						...generateShardInfo(shard),
						nonce: data.nonce,
						type: 'SHARD_INFO',
						workerId: this.workerId,
						incarnationId: workerData.incarnationId!,
					} satisfies WorkerSendShardInfo);
				}
				break;
			case 'WORKER_INFO':
				{
					this.postMessage({
						shards: [...this.shards.values()].map(generateShardInfo),
						workerId: workerData.workerId,
						incarnationId: workerData.incarnationId!,
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
						incarnationId: workerData.incarnationId!,
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
					if (this.reshardId && this.reshardId !== data.reshardId) break;
					this.reshardId = data.reshardId;
					this.postMessage({
						type: 'WORKER_START_RESHARDING',
						workerId: workerData.workerId,
						incarnationId: workerData.incarnationId!,
						reshardId: data.reshardId,
					} satisfies WorkerStartResharding);
				}
				break;
			case 'DISCONNECT_ALL_SHARDS_RESHARDING':
				{
					if (data.reshardId !== this.reshardId) break;
					for (const i of this.shards.values()) {
						await i.disconnect(ShardSocketCloseCodes.Resharding);
					}
					this.postMessage({
						type: 'DISCONNECTED_ALL_SHARDS_RESHARDING',
						workerId: workerData.workerId,
						incarnationId: workerData.incarnationId!,
						reshardId: data.reshardId,
					} satisfies WorkerDisconnectedAllShardsResharding);
				}
				break;
			case 'CONNECT_ALL_SHARDS_RESHARDING':
				{
					if (data.reshardId !== this.reshardId) break;
					this.shards.clear();
					for (const [id, shard] of this.resharding) {
						this.shards.set(id, shard);
						shard.options.handlePayload = (shardId, packet) =>
							this.physicalRuntime
								? this.physicalRuntime.capture(shardId, packet)
								: this.dispatchGatewayPacket(shardId, packet);
					}
					workerData.totalShards = data.totalShards;
					workerData.shards = [...this.shards.keys()];
					this.resharding.clear();
					this.reshardReadyShards.delete(data.reshardId);
					this.reshardReadinessSent.delete(data.reshardId);
					this.reshardId = undefined;
					this.postMessage({
						type: 'WORKER_CUTOVER_APPLIED_RESHARDING',
						workerId: workerData.workerId,
						incarnationId: workerData.incarnationId!,
						reshardId: data.reshardId,
					} satisfies WorkerCutoverAppliedResharding);
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
				rej(new SeyfertError('WORKER_TIMEOUT', { metadata: { ...{ nonce }, detail: message } }));
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
			incarnationId: workerData.incarnationId!,
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

	async dispatchGatewayPacket(shardId: number, payload: GatewayDispatchPayload) {
		await this.options?.handlePayload?.call(this, shardId, payload);
		const pluginPacket = await this.onPacket(payload, shardId);
		if (this.options.sendPayloadToParent && pluginPacket !== null)
			await this.postMessage({
				workerId: workerData.workerId,
				incarnationId: workerData.incarnationId!,
				shardId,
				type: 'RECEIVE_PAYLOAD',
				payload: pluginPacket,
			} satisfies WorkerReceivePayload);
	}

	createShard(id: number, data: Pick<ManagerSpawnShards, 'info' | 'compress' | 'properties'>) {
		const shard = new Shard(id, {
			token: workerData.token,
			intents: workerData.intents,
			info: data.info,
			compress: data.compress,
			debugger: this.debugger,
			onShardDisconnect: this.onShardDisconnect.bind(this),
			onShardReconnect: this.onShardReconnect.bind(this),
			properties: {
				...properties,
				...data.properties,
				...this.options.gateway?.properties,
			},
			handlePayload: (shardId, payload) =>
				this.physicalRuntime
					? this.physicalRuntime.capture(shardId, payload)
					: this.dispatchGatewayPacket(shardId, payload),
		});

		return shard;
	}

	async resumeShard(shardId: number, shardData: MakeRequired<ShardData>) {
		const exists = (
			await this.tellWorkers((r, vars) => r.shards.has(vars.shardId), {
				shardId,
			})
		).some(x => x);
		if (exists)
			throw new SeyfertError('CANNOT_OVERRIDE_EXISTING_SHARD', {
				metadata: { detail: 'Cannot override existing shard' },
			});
		const shard = this.createShard(shardId, {
			info: this.workerData.info,
			compress: this.workerData.compress,
		});
		shard.data = shardData;
		this.shards.set(shardId, shard);
		return this.postMessage({
			workerId: this.workerId,
			incarnationId: workerData.incarnationId!,
			shardId,
			type: 'CONNECT_QUEUE',
		});
	}

	protected async onPacket(packet: GatewayDispatchPayload, shardId: number): Promise<GatewayDispatchPayload | null> {
		const pluginPacket = await applyPluginGatewayDispatchInterceptors(this, shardId, packet);
		if (pluginPacket === null) return null;
		packet = pluginPacket;

		const rawTasks = Promise.allSettled([
			this.events.runEvent('RAW', this, packet, shardId, false),
			this.collectors.run('RAW', packet, this),
		]);
		try {
			switch (packet.t) {
				case 'GUILD_MEMBER_UPDATE':
					{
						if (!this.memberUpdateHandler.check(packet.d)) {
							return packet;
						}
						await this.events.execute(packet, this as WorkerClient<true>, shardId);
					}
					break;
				case 'PRESENCE_UPDATE':
					{
						if (!this.presenceUpdateHandler.check(packet.d)) {
							return packet;
						}
						await this.events.execute(packet, this as WorkerClient<true>, shardId);
					}
					break;
				default: {
					switch (packet.t) {
						case GatewayDispatchEvents.InteractionCreate:
							{
								await this.events.execute(packet, this, shardId);
								await this.handleCommand.interaction(packet.d, shardId);
							}
							break;
						case GatewayDispatchEvents.MessageCreate:
							{
								await this.events.execute(packet, this, shardId);
								await this.handleCommand.message(packet.d, shardId);
							}
							break;
						case GatewayDispatchEvents.Ready: {
							this.botId = packet.d.user.id;
							this.applicationId = packet.d.application.id;
							this.me = Transformers.ClientUser(this, packet.d.user, packet.d.application) as never;
							if (
								this.physicalRuntime
									? this.physicalRuntime.claimShardsConnected(shardId)
									: [...this.shards.values()].every(shard => shard.data.session_id)
							) {
								if (!this.physicalRuntime)
									this.postMessage({
										type: 'WORKER_SHARDS_CONNECTED',
										workerId: this.workerId,
										incarnationId: workerData.incarnationId!,
									} as WorkerShardsConnected);
								await this.events.runEvent('WORKER_SHARDS_CONNECTED', this, this.me, -1);
							}
							await this.events.execute(packet, this, shardId);
							this.debugger?.debug(`#${shardId}[${packet.d.user.username}](${this.botId}) is online...`);
							break;
						}
						case GatewayDispatchEvents.GuildsReady:
							{
								if (
									this.physicalRuntime
										? this.physicalRuntime.claimWorkerReady(shardId)
										: [...this.shards.values()].every(shard => shard.isReady)
								) {
									if (!this.physicalRuntime)
										this.postMessage({
											type: 'WORKER_READY',
											workerId: this.workerId,
											incarnationId: workerData.incarnationId!,
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
			return packet;
		} finally {
			await rawTasks;
		}
	}
}

export interface WorkerClient<Ready extends boolean = boolean> extends RegisteredPluginExtension {}

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
	/**
	 * Enables the worker-local physical IPC seam. When omitted, the same
	 * identity is read from SEYFERT_PHYSICAL_SLOT and SEYFERT_PHYSICAL_TOKEN.
	 */
	physicalWorker?: Readonly<PhysicalWorkerIdentity>;
	handlePayload?: ShardManagerOptions['handlePayload'];
	/**
	 * @deprecated Use shard disconnect events instead. Injected ShardManager callbacks can double-fire.
	 */
	onShardDisconnect?: ShardManagerOptions['onShardDisconnect'];
	/**
	 * @deprecated Use shard reconnect events instead. Injected ShardManager callbacks can double-fire.
	 */
	onShardReconnect?: ShardManagerOptions['onShardReconnect'];
	gateway?: ClientOptions['gateway'];
	postMessage?: (body: unknown) => Awaitable<unknown>;
	/** can have perfomance issues in big bots if the client sends every event, specially in startup (false by default) */
	sendPayloadToParent?: boolean;
	handleManagerMessages?(message: ManagerMessages | WorkerHeartbeaterMessages): Awaitable<unknown>;
}

function resolvePhysicalIdentity(
	configured: Readonly<PhysicalWorkerIdentity> | undefined,
): Readonly<PhysicalWorkerIdentity> | undefined {
	const slot = configured?.slot ?? process.env.SEYFERT_PHYSICAL_SLOT;
	const token = configured?.token ?? process.env.SEYFERT_PHYSICAL_TOKEN;
	if (slot === undefined && token === undefined) return;
	if (typeof slot !== 'string' || !slot.trim() || typeof token !== 'string' || !token.trim())
		throw new TypeError('Physical worker slot and token must both be non-empty strings');
	return Object.freeze({ slot, token });
}
