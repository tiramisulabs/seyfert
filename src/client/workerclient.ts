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
import type { ShardData } from '../websocket/discord/shared';
import type {
	ClientHeartbeaterMessages,
	WorkerDisconnectedAllShardsResharding,
	WorkerGenerationAborted,
	WorkerGenerationActivated,
	WorkerGenerationAppReady,
	WorkerGenerationCutoverReady,
	WorkerGenerationDrained,
	WorkerGenerationFailed,
	WorkerGenerationShardsReady,
	WorkerMessages,
	WorkerReady,
	WorkerReadyResharding,
	WorkerReceivePayload,
	WorkerRequestConnect,
	WorkerRequestConnectResharding,
	WorkerReshardingComplete,
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
		totalWorkers: Number(process.env.SEYFERT_WORKER_TOTALWORKERS),
		info: JSON.parse(process.env.SEYFERT_WORKER_INFO!),
		compress: String(process.env.SEYFERT_WORKER_COMPRESS) === 'true',
		generation: process.env.SEYFERT_WORKER_GENERATION ? Number(process.env.SEYFERT_WORKER_GENERATION) : undefined,
		allocationId: process.env.SEYFERT_WORKER_ALLOCATIONID,
		shadow: String(process.env.SEYFERT_WORKER_SHADOW) === 'true',
		supervisorTimeoutMs: process.env.SEYFERT_WORKER_SUPERVISORTIMEOUTMS
			? Number(process.env.SEYFERT_WORKER_SUPERVISORTIMEOUTMS)
			: undefined,
		supervisorIssuedAtMonotonicMs: process.env.SEYFERT_WORKER_SUPERVISORISSUEDATMONOTONICMS
			? Number(process.env.SEYFERT_WORKER_SUPERVISORISSUEDATMONOTONICMS)
			: undefined,
	} satisfies WorkerData;
} catch {
	//
}

const CUTOVER_BUFFER_LIMIT = 10_000;

export class WorkerClient<Ready extends boolean = boolean> extends BaseClient {
	memberUpdateHandler = new MemberUpdateHandler();
	presenceUpdateHandler = new PresenceUpdateHandler();
	collectors = new Collectors();
	events = new EventHandler(this);
	me!: When<Ready, ClientUserStructure>;
	promises = new Map<string, { resolve: (value: any) => void; timeout: NodeJS.Timeout }>();

	shards = new Map<number, Shard>();
	resharding = new Map<number, Shard>();
	private sendToManager?: (body: unknown) => Awaitable<unknown>;
	private generationActive = !workerData?.shadow;
	private generationShardsReady = false;
	private generationDispatches = 0;
	private generationDrainWaiters: (() => void)[] = [];
	private generationShadowHydrations = 0;
	private generationShadowWaiters: (() => void)[] = [];
	private generationShadowError?: unknown;
	private generationCutoverBuffering = false;
	private generationCutoverBuffer: { shardId: number; packet: GatewayDispatchPayload }[] = [];
	private generationCutoverBufferHead = 0;
	private generationBootstrapPackets: { shardId: number; packet: GatewayDispatchPayload }[] = [];
	private generationReadyEventsRun = false;
	private generationAborted = false;
	private generationFailure?: Error;
	private generationActivationInFlight?: Promise<void>;
	private generationActivationAcknowledged = false;
	private supervisorFenceInstalled = false;
	private supervisorFailedClosed = false;
	private supervisorLeaseTimer?: NodeJS.Timeout;
	private supervisorLeaseDeadline?: number;
	private supervisorLeaseSequence = 0;
	private supervisorExitProcess: (code: number) => void = code => process.exit(code);
	private supervisorMonotonicNow = () => Number(process.hrtime.bigint() / 1_000_000n);

	declare options: WorkerClientOptions;

	constructor(options?: WorkerClientOptions) {
		super(options);
		if (options?.postMessage) {
			this.sendToManager = options.postMessage;
		}
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
		if (workerData.shadow || !this.generationActive) return;
		await this.options?.onShardDisconnect?.(data);
		await this.events.runEvent('SHARD_DISCONNECT', this, data, data.shardId, false);
	}

	private async onShardReconnect(data: ShardReconnectData) {
		if (workerData.shadow || !this.generationActive) return;
		await this.options?.onShardReconnect?.(data);
		await this.events.runEvent('SHARD_RECONNECT', this, data, data.shardId, false);
	}

	private assertGenerationWorkerData(data: WorkerData) {
		const hasGeneration = data.generation !== undefined;
		const hasAllocation = data.allocationId !== undefined;
		if (hasGeneration !== hasAllocation || (data.shadow && !hasGeneration))
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `Worker generation and allocationId must be provided together for shadow allocations` },
			});
		if (hasGeneration && (!Number.isSafeInteger(data.generation) || data.generation! < 0))
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `Worker generation must be a non-negative safe integer` },
			});
		if (hasAllocation && (typeof data.allocationId !== 'string' || data.allocationId.trim().length === 0))
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `Worker generation allocationId must be a non-empty string` },
			});
		const hasSupervisorTimeout = data.supervisorTimeoutMs !== undefined;
		const hasSupervisorIssuedAt = data.supervisorIssuedAtMonotonicMs !== undefined;
		if (hasSupervisorTimeout !== hasSupervisorIssuedAt)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `supervisorTimeoutMs and supervisorIssuedAtMonotonicMs must be provided together` },
			});
		if (
			hasSupervisorTimeout &&
			(!Number.isSafeInteger(data.supervisorTimeoutMs) ||
				data.supervisorTimeoutMs! <= 0 ||
				data.supervisorTimeoutMs! > 2_147_483_647)
		)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: {
					detail: `supervisorTimeoutMs must be a positive safe integer no greater than 2147483647 milliseconds`,
				},
			});
		if (
			hasSupervisorIssuedAt &&
			(!Number.isSafeInteger(data.supervisorIssuedAtMonotonicMs) || data.supervisorIssuedAtMonotonicMs! < 0)
		)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `supervisorIssuedAtMonotonicMs must be a non-negative safe integer` },
			});
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
		this.assertGenerationWorkerData(data);
		clearTimeout(this.supervisorLeaseTimer);
		workerData = data;
		this.generationActive = !data.shadow;
		this.generationShardsReady = false;
		this.generationDispatches = 0;
		this.generationDrainWaiters = [];
		this.generationShadowHydrations = 0;
		this.generationShadowWaiters = [];
		this.generationShadowError = undefined;
		this.generationCutoverBuffering = false;
		this.generationCutoverBuffer = [];
		this.generationCutoverBufferHead = 0;
		this.generationBootstrapPackets = [];
		this.generationReadyEventsRun = false;
		this.generationAborted = false;
		this.generationFailure = undefined;
		this.generationActivationInFlight = undefined;
		this.generationActivationAcknowledged = false;
		this.supervisorFailedClosed = false;
		this.supervisorLeaseTimer = undefined;
		this.supervisorLeaseDeadline = undefined;
		this.supervisorLeaseSequence = 0;
	}

	get workerData() {
		return workerData;
	}

	async start(options: Omit<DeepPartial<StartOptions>, 'httpConnection' | 'token' | 'connection'> = {}) {
		this.assertGenerationWorkerData(workerData);
		if (!this.installSupervisorFence())
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: 'Worker supervisor IPC channel is unavailable' },
			});
		const worker_threads = lazyLoadPackage<typeof import('node:worker_threads')>('node:worker_threads');

		if (worker_threads?.parentPort) {
			manager = worker_threads?.parentPort;
		}

		if (workerData.mode !== 'custom')
			(manager ?? process).on('message', (data: ManagerMessages) => this.handleManagerMessages(data));

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
		this.postMessage({
			type: workerData.resharding ? 'WORKER_START_RESHARDING' : 'WORKER_START',
			workerId: workerData.workerId,
		} satisfies WorkerStart | WorkerStartResharding);
		await this.loadEvents(options.eventsDir);
		if (workerData.generation !== undefined && workerData.allocationId)
			this.postMessage({
				type: 'WORKER_GENERATION_APP_READY',
				workerId: workerData.workerId,
				intents: workerData.intents,
			} satisfies WorkerGenerationAppReady);
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

	postMessage(body: WorkerMessages | ClientHeartbeaterMessages): unknown {
		const message =
			workerData?.generation !== undefined && workerData.allocationId
				? { ...body, generation: workerData.generation, allocationId: workerData.allocationId }
				: body;
		if (this.sendToManager) return this.sendToManager(message);
		if (manager) return manager.postMessage(message);
		return process.send!(message);
	}

	async handleManagerMessages(data: ManagerMessages | WorkerHeartbeaterMessages) {
		if (
			workerData.generation !== undefined &&
			workerData.allocationId &&
			(data.generation === undefined || data.allocationId === undefined)
		)
			return;
		if (data.generation !== undefined && data.generation !== workerData.generation) return;
		if (data.allocationId !== undefined && data.allocationId !== workerData.allocationId) return;
		if (data.type === 'RENEW_WORKER_SUPERVISOR_LEASE') {
			if (workerData.supervisorTimeoutMs === undefined) return;
			this.renewSupervisorLease(data.expiresInMs, data.issuedAtMonotonicMs, data.sequence);
			return;
		}
		if (!workerData.shadow) await this.options.handleManagerMessages?.(data);
		switch (data.type) {
			case 'BEGIN_WORKER_GENERATION_CUTOVER':
				if (!workerData.shadow || this.generationAborted || this.generationFailure) return;
				this.generationCutoverBuffering = true;
				this.postMessage({
					type: 'WORKER_GENERATION_CUTOVER_READY',
					workerId: workerData.workerId,
				} satisfies WorkerGenerationCutoverReady);
				break;
			case 'ACTIVATE_WORKER_GENERATION':
				if (this.generationAborted || this.generationFailure) return;
				if (this.generationActivationAcknowledged) {
					await this.postMessage({
						type: 'WORKER_GENERATION_ACTIVATED',
						workerId: workerData.workerId,
					} satisfies WorkerGenerationActivated);
					return;
				}
				if (workerData.shadow && !this.generationShardsReady) {
					this.logger.fatal('Cannot activate a worker generation before all shards are ready');
					return;
				}
				if (workerData.shadow) {
					if (!this.generationCutoverBuffering) {
						this.logger.fatal('Cannot activate a worker generation before its cutover buffer is armed');
						return;
					}
					try {
						this.generationActivationInFlight ??= this.activateShadowGeneration();
						await this.generationActivationInFlight;
					} catch (error) {
						this.failWorkerGeneration(error, 'Worker generation activation failed');
						return;
					}
				}
				if (this.generationAborted) return;
				if (this.generationActivationAcknowledged) return;
				this.generationActivationAcknowledged = true;
				try {
					await this.postMessage({
						type: 'WORKER_GENERATION_ACTIVATED',
						workerId: workerData.workerId,
					} satisfies WorkerGenerationActivated);
				} catch (error) {
					this.generationActivationAcknowledged = false;
					throw error;
				}
				break;
			case 'DRAIN_WORKER_GENERATION':
				this.generationActive = false;
				await this.waitForGenerationDispatches();
				for (const shard of this.shards.values()) shard.disconnect(ShardSocketCloseCodes.Resharding);
				this.postMessage({
					type: 'WORKER_GENERATION_DRAINED',
					workerId: workerData.workerId,
				} satisfies WorkerGenerationDrained);
				break;
			case 'ABORT_WORKER_GENERATION':
				this.generationAborted = true;
				this.generationActive = false;
				this.generationCutoverBuffering = false;
				this.generationCutoverBuffer = [];
				this.generationCutoverBufferHead = 0;
				this.generationBootstrapPackets = [];
				for (const shard of this.shards.values()) shard.disconnect(ShardSocketCloseCodes.Resharding);
				for (const shard of this.resharding.values()) shard.disconnect(ShardSocketCloseCodes.Resharding);
				this.shards.clear();
				this.resharding.clear();
				this.postMessage({
					type: 'WORKER_GENERATION_ABORTED',
					workerId: workerData.workerId,
				} satisfies WorkerGenerationAborted);
				break;
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
					await this.runGenerationOperation(async () => {
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

						await this.postMessage({
							type: 'RESULT_PAYLOAD',
							nonce: data.nonce,
							workerId: this.workerId,
						} satisfies WorkerSendResultPayload);
					});
				}
				break;
			case 'ALLOW_CONNECT_RESHARDING':
				{
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
							onShardDisconnect: this.onShardDisconnect.bind(this),
							onShardReconnect: this.onShardReconnect.bind(this),
							properties: {
								...properties,
								...this.options.gateway?.properties,
							},
							handlePayload(_, payload) {
								if (payload.t !== GatewayDispatchEvents.GuildsReady) return;
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
					await this.runGenerationOperation(async () => {
						const shard = this.shards.get(data.shardId);
						if (!shard) {
							this.logger.fatal(`Worker trying to get non-existent shard (#${data.shardId})`);
							return;
						}

						await this.postMessage({
							...generateShardInfo(shard),
							nonce: data.nonce,
							type: 'SHARD_INFO',
							workerId: this.workerId,
						} satisfies WorkerSendShardInfo);
					});
				}
				break;
			case 'WORKER_INFO':
				{
					await this.runGenerationOperation(() =>
						Promise.resolve(
							this.postMessage({
								shards: [...this.shards.values()].map(generateShardInfo),
								workerId: workerData.workerId,
								type: 'WORKER_INFO',
								nonce: data.nonce,
							} satisfies WorkerSendInfo),
						),
					);
				}
				break;
			case 'BOT_READY':
				await this.runGenerationOperation(() => this.events.runEvent('BOT_READY', this, this.me, -1));
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
					await this.runGenerationOperation(async () => {
						let result: unknown;
						try {
							result = await eval(`
					(${data.func})(this, ${data.vars})
					`);
						} catch (e) {
							result = e;
						}
						await this.postMessage({
							type: 'EVAL_RESPONSE',
							response: result,
							workerId: workerData.workerId,
							nonce: data.nonce,
						} satisfies WorkerSendEvalResponse);
					});
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
					for (const [id, shard] of this.resharding) {
						this.shards.set(id, shard);
						shard.options.handlePayload = (shardId, packet) =>
							this.runGenerationDispatch(() => this.dispatchGatewayPacket(shardId, packet));
					}
					workerData.totalShards = data.totalShards;
					workerData.shards = [...this.shards.keys()];
					this.resharding.clear();
					this.postMessage({
						type: 'WORKER_RESHARDING_COMPLETE',
						workerId: workerData.workerId,
					} satisfies WorkerReshardingComplete);
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

	private async handleShadowPacket(shardId: number, packet: GatewayDispatchPayload) {
		if (!workerData.shadow || this.generationAborted || this.generationFailure) return;
		if (this.generationCutoverBuffering) {
			if (this.generationCutoverBuffer.length - this.generationCutoverBufferHead >= CUTOVER_BUFFER_LIMIT) {
				this.failWorkerGeneration(
					new Error(`Worker generation cutover buffer exceeded ${CUTOVER_BUFFER_LIMIT} events`),
					'Worker generation cutover buffer limit exceeded',
				);
				return;
			}
			this.generationCutoverBuffer.push({ shardId, packet });
			return;
		}
		this.generationShadowHydrations++;
		let shadowPacket = packet;
		try {
			const pluginPacket = await applyPluginGatewayDispatchInterceptors(this, shardId, packet);
			if (pluginPacket === null) return;
			shadowPacket = pluginPacket;
			if (shadowPacket.t === 'READY' || shadowPacket.t === 'GUILDS_READY')
				this.rememberGenerationBootstrapPacket(shardId, shadowPacket);
			if (shadowPacket.t === 'READY') {
				this.botId = shadowPacket.d.user.id;
				this.applicationId = shadowPacket.d.application.id;
				this.me = Transformers.ClientUser(this, shadowPacket.d.user, shadowPacket.d.application) as never;
				this.debugger?.debug(`#${shardId}[${shadowPacket.d.user.username}](${this.botId}) shadow is online...`);
			}
			await this.cache.onPacket(shadowPacket);
		} catch (error) {
			this.generationShadowError ??= error;
			this.failWorkerGeneration(error, 'Worker generation shadow cache hydration failed');
		} finally {
			this.generationShadowHydrations--;
			if (this.generationShadowHydrations === 0) {
				const waiters = this.generationShadowWaiters.splice(0);
				for (const resolve of waiters) resolve();
			}
		}

		if (shadowPacket.t === 'GUILDS_READY') {
			await this.waitForShadowHydrations();
			if (this.generationShadowError) {
				this.failWorkerGeneration(
					this.generationShadowError,
					'Cannot ready a worker generation after shadow cache hydration failed',
				);
				return;
			}
			if (!this.generationShardsReady && [...this.shards.values()].every(shard => shard.isReady)) {
				this.generationShardsReady = true;
				this.postMessage({
					type: 'WORKER_GENERATION_SHARDS_READY',
					workerId: workerData.workerId,
				} satisfies WorkerGenerationShardsReady);
			}
			return;
		}
	}

	private waitForShadowHydrations() {
		if (this.generationShadowHydrations === 0) return Promise.resolve();
		return new Promise<void>(resolve => this.generationShadowWaiters.push(resolve));
	}

	private installSupervisorFence(
		supervisor: Pick<NodeJS.Process, 'connected' | 'once' | 'send'> = process,
		exitProcess: (code: number) => void = code => process.exit(code),
	) {
		this.supervisorExitProcess = exitProcess;
		if (workerData.supervisorTimeoutMs !== undefined && !this.supervisorFenceInstalled) {
			if (typeof supervisor.send !== 'function' || supervisor.connected === false) {
				this.failClosedWithoutSupervisor(exitProcess);
				return false;
			}
			this.supervisorFenceInstalled = true;
			supervisor.once('disconnect', () => this.failClosedWithoutSupervisor(exitProcess));
		}
		if (workerData.supervisorTimeoutMs !== undefined && this.supervisorLeaseDeadline === undefined)
			this.renewSupervisorLease(workerData.supervisorTimeoutMs, workerData.supervisorIssuedAtMonotonicMs!);
		return !this.supervisorFailedClosed;
	}

	private assertSupervisorLeaseTimeout(expiresInMs: number) {
		if (!Number.isSafeInteger(expiresInMs) || expiresInMs <= 0 || expiresInMs > 2_147_483_647)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: {
					detail: `Supervisor lease TTL must be a positive safe integer no greater than 2147483647 milliseconds`,
				},
			});
	}

	private renewSupervisorLease(
		expiresInMs: number,
		issuedAtMonotonicMs = this.supervisorMonotonicNow(),
		sequence?: number,
	) {
		this.assertSupervisorLeaseTimeout(expiresInMs);
		if (!Number.isSafeInteger(issuedAtMonotonicMs) || issuedAtMonotonicMs < 0)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `Supervisor lease issuedAtMonotonicMs must be a non-negative safe integer` },
			});
		if (sequence !== undefined && (!Number.isSafeInteger(sequence) || sequence <= 0))
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `Supervisor lease sequence must be a positive safe integer` },
			});
		if (this.supervisorFailedClosed || this.generationAborted || this.generationFailure) return;
		const now = this.supervisorMonotonicNow();
		if (this.supervisorLeaseDeadline !== undefined && now >= this.supervisorLeaseDeadline) {
			this.failClosedWithoutSupervisor(this.supervisorExitProcess);
			return;
		}
		if (sequence !== undefined) {
			if (sequence <= this.supervisorLeaseSequence) return;
			this.supervisorLeaseSequence = sequence;
		}
		const deadline = issuedAtMonotonicMs + expiresInMs;
		if (!Number.isSafeInteger(deadline))
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `Supervisor lease deadline exceeds the safe integer range` },
			});
		if (deadline <= now) {
			if (this.supervisorLeaseDeadline === undefined) this.failClosedWithoutSupervisor(this.supervisorExitProcess);
			return;
		}
		if (this.supervisorLeaseDeadline !== undefined && deadline <= this.supervisorLeaseDeadline) return;
		clearTimeout(this.supervisorLeaseTimer);
		this.supervisorLeaseDeadline = deadline;
		this.scheduleSupervisorLeaseExpiry(deadline);
	}

	private scheduleSupervisorLeaseExpiry(deadline: number) {
		const check = () => {
			if (this.supervisorLeaseDeadline !== deadline) return;
			const remaining = deadline - this.supervisorMonotonicNow();
			if (remaining > 0) {
				this.supervisorLeaseTimer = setTimeout(check, Math.ceil(remaining));
				return;
			}
			this.failClosedWithoutSupervisor(this.supervisorExitProcess);
		};
		this.supervisorLeaseTimer = setTimeout(check, Math.max(1, Math.ceil(deadline - this.supervisorMonotonicNow())));
	}

	private failClosedWithoutSupervisor(exitProcess: (code: number) => void = code => process.exit(code)) {
		if (this.supervisorFailedClosed) return;
		this.supervisorFailedClosed = true;
		clearTimeout(this.supervisorLeaseTimer);
		this.supervisorLeaseTimer = undefined;
		this.supervisorLeaseDeadline = undefined;
		const failure = new SeyfertError('INTERNAL_ERROR', {
			metadata: { detail: 'Worker supervisor IPC channel disconnected' },
		});
		this.generationFailure ??= failure;
		this.generationAborted = true;
		this.generationActive = false;
		this.generationCutoverBuffering = false;
		this.generationCutoverBuffer = [];
		this.generationCutoverBufferHead = 0;
		this.generationBootstrapPackets = [];
		for (const shard of this.shards.values()) shard.disconnect(ShardSocketCloseCodes.ShutdownAll);
		for (const shard of this.resharding.values()) shard.disconnect(ShardSocketCloseCodes.ShutdownAll);
		this.shards.clear();
		this.resharding.clear();
		exitProcess(1);
	}

	private async activateShadowGeneration() {
		await this.waitForShadowHydrations();
		if (this.generationShadowError) throw this.generationShadowError;
		await this.replayGenerationBootstrapPackets();
		if (!this.generationReadyEventsRun) {
			await this.events.runEvent('WORKER_SHARDS_CONNECTED', this, this.me, -1);
			await this.events.runEvent('WORKER_READY', this, this.me, -1);
			this.generationReadyEventsRun = true;
		}

		while (!this.generationAborted) {
			const buffered = this.generationCutoverBuffer[this.generationCutoverBufferHead];
			if (buffered) {
				await this.dispatchGatewayPacket(buffered.shardId, buffered.packet);
				this.generationCutoverBufferHead++;
				if (
					this.generationCutoverBufferHead >= 1_024 &&
					this.generationCutoverBufferHead * 2 >= this.generationCutoverBuffer.length
				) {
					this.generationCutoverBuffer.splice(0, this.generationCutoverBufferHead);
					this.generationCutoverBufferHead = 0;
				}
				continue;
			}
			await this.waitForGenerationDispatches();
			if (this.generationCutoverBuffer.length === this.generationCutoverBufferHead) {
				// No await may occur between observing the empty buffer and opening live dispatch.
				this.generationCutoverBuffer = [];
				this.generationCutoverBufferHead = 0;
				this.generationActive = true;
				workerData.shadow = false;
				this.generationCutoverBuffering = false;
				return;
			}
		}
	}

	private rememberGenerationBootstrapPacket(shardId: number, packet: GatewayDispatchPayload) {
		const index = this.generationBootstrapPackets.findIndex(
			entry => entry.shardId === shardId && entry.packet.t === packet.t,
		);
		const entry = { shardId, packet };
		if (index === -1) this.generationBootstrapPackets.push(entry);
		else this.generationBootstrapPackets[index] = entry;
	}

	private async replayGenerationBootstrapPackets() {
		const packets = this.generationBootstrapPackets;
		this.generationBootstrapPackets = [];
		for (const { shardId, packet } of packets) {
			this.trackGenerationDispatch(
				Promise.allSettled([
					this.events.runEvent('RAW', this, packet, shardId, false),
					this.collectors.run('RAW', packet, this),
				]),
			);
			await this.events.execute(packet, this, shardId, false);
		}
	}

	private failWorkerGeneration(error: unknown, message: string) {
		if (this.generationFailure) return;
		this.generationFailure = error instanceof Error ? error : new Error(String(error));
		this.generationAborted = true;
		this.generationActive = false;
		this.generationCutoverBuffering = false;
		this.generationCutoverBuffer = [];
		this.generationCutoverBufferHead = 0;
		this.generationBootstrapPackets = [];
		this.logger.fatal(message, this.generationFailure);
		try {
			void Promise.resolve(
				this.postMessage({
					type: 'WORKER_GENERATION_FAILED',
					workerId: workerData.workerId,
					message: this.generationFailure.message,
				} satisfies WorkerGenerationFailed),
			).catch(postError => this.logger.error('Cannot report worker generation failure', postError));
		} catch (postError) {
			this.logger.error('Cannot report worker generation failure', postError);
		}
	}

	private async runGenerationDispatch<T>(dispatch: () => Promise<T>): Promise<T | undefined> {
		if (!this.generationActive) return;
		return this.runGenerationOperation(dispatch);
	}

	private dispatchGatewayPacket(shardId: number, payload: GatewayDispatchPayload) {
		return this.runGenerationOperation(async () => {
			await this.options?.handlePayload?.call(this, shardId, payload);
			const pluginPacket = await this.onPacket(payload, shardId);
			if (this.options.sendPayloadToParent && pluginPacket !== null)
				await this.postMessage({
					workerId: workerData.workerId,
					shardId,
					type: 'RECEIVE_PAYLOAD',
					payload: pluginPacket,
				} satisfies WorkerReceivePayload);
		});
	}

	private async runGenerationOperation<T>(operation: () => Promise<T>): Promise<T> {
		this.generationDispatches++;
		try {
			return await operation();
		} finally {
			this.completeGenerationDispatch();
		}
	}

	private trackGenerationDispatch(dispatch: Promise<unknown>) {
		this.generationDispatches++;
		void dispatch.finally(() => this.completeGenerationDispatch());
	}

	private completeGenerationDispatch() {
		this.generationDispatches--;
		if (this.generationDispatches === 0) {
			const waiters = this.generationDrainWaiters.splice(0);
			for (const resolve of waiters) resolve();
		}
	}

	private waitForGenerationDispatches() {
		if (this.generationDispatches === 0) return Promise.resolve();
		return new Promise<void>(resolve => this.generationDrainWaiters.push(resolve));
	}

	createShard(id: number, data: Pick<ManagerSpawnShards, 'info' | 'compress' | 'properties'>) {
		const self = this;
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
			async handlePayload(shardId, payload) {
				if (!self.generationActive) return self.handleShadowPacket(shardId, payload);
				return self.dispatchGatewayPacket(shardId, payload);
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
			shardId,
			type: 'CONNECT_QUEUE',
		});
	}

	protected async onPacket(packet: GatewayDispatchPayload, shardId: number): Promise<GatewayDispatchPayload | null> {
		const pluginPacket = await applyPluginGatewayDispatchInterceptors(this, shardId, packet);
		if (pluginPacket === null) return null;
		packet = pluginPacket;

		this.trackGenerationDispatch(
			Promise.allSettled([
				this.events.runEvent('RAW', this, packet, shardId, false),
				this.collectors.run('RAW', packet, this),
			]),
		);
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
					case GatewayDispatchEvents.GuildsReady:
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
		return packet;
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
