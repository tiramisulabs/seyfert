import { randomUUID, type UUID } from 'node:crypto';
import { ApiHandler, Logger } from '..';
import { LimitedMemoryAdapter, MemoryAdapter, WorkerAdapter } from '../cache';
import {
	type Awaitable,
	calculateShardId,
	type DeepPartial,
	delay,
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
	WorkerHotReloadAck,
	WorkerHotReloadRequestOptions,
	WorkerMessages,
	WorkerReadyResharding,
	WorkerReceivePayload,
	WorkerRequestConnect,
	WorkerRequestConnectResharding,
	WorkerRequestHotReload,
	WorkerSendEvalResponse,
	WorkerSendInfo,
	WorkerSendResultPayload,
	WorkerSendShardInfo,
	WorkerSendToWorkerEval,
	WorkerShardInfo,
	WorkerStart,
	WorkerStartResharding,
} from '../websocket/discord/worker';
import { deserializeWorkerError } from '../websocket/discord/worker-errors';
import type {
	HotReloadProgress,
	HotReloadResult,
	ManagerMessages,
	ManagerSpawnShards,
} from '../websocket/discord/workermanager';
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
		hotReload: String(process.env.SEYFERT_WORKER_HOTRELOAD) === 'true',
		generation: Number(process.env.SEYFERT_WORKER_GENERATION ?? 0),
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

	/**
	 * Whether gateway events reach handlers. A hot reload replacement waits on standby, only building its cache,
	 * until the manager switches to it; the worker it replaces then stops and drains.
	 */
	private dispatchState: 'active' | 'standby' | 'stopped' = 'active';
	/** The readiness handlers skipped on standby, in startup order, replayed when the replacement takes over. */
	private standbyReadiness: (
		| { event: 'WORKER_SHARDS_CONNECTED' | 'WORKER_READY' }
		| { packet: GatewayDispatchPayload; shardId: number }
	)[] = [];
	/** Dispatched work a worker replaced by a hot reload waits for before it closes its sessions. */
	private inFlightWork = new Set<Promise<unknown>>();
	private hotReloadRequests = new Map<
		string,
		{
			resolve(result: HotReloadResult): void;
			reject(error: unknown): void;
			onProgress?(event: HotReloadProgress): void;
		}
	>();

	declare options: WorkerClientOptions;

	constructor(options?: WorkerClientOptions) {
		super(options);

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
		if (this.shards.size <= 0) return 0;
		let acc = 0;

		this.shards.forEach(s => (acc += s.latency));

		return acc / this.shards.size;
	}

	private async onShardDisconnect(data: ShardDisconnectData) {
		if (this.dispatchState !== 'active') return;
		await this.options?.onShardDisconnect?.(data);
		await this.events.runEvent('SHARD_DISCONNECT', this, data, data.shardId, false);
	}

	private async onShardReconnect(data: ShardReconnectData) {
		if (this.dispatchState !== 'active') return;
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
		this.dispatchState = data?.hotReload ? 'standby' : 'active';
		this.standbyReadiness = [];
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
			(manager ?? process).on('message', (data: ManagerMessages) => {
				void this.handleManagerMessages(data).catch(error => {
					this.logger.error('Worker manager message handling failed', error);
				});
			});

		if (workerData.hotReload) this.dispatchState = 'standby';
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
		await this.postMessage({
			type: workerData.resharding ? 'WORKER_START_RESHARDING' : 'WORKER_START',
			workerId: workerData.workerId,
		} satisfies WorkerStart | WorkerStartResharding);
		await this.loadEvents(options.eventsDir);
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

	async postMessage(body: WorkerMessages | ClientHeartbeaterMessages): Promise<unknown> {
		if (this.options.postMessage) return this.options.postMessage.call(this, body);
		if (manager) return manager.postMessage(body);
		return new Promise<void>((resolve, reject) => {
			process.send!(body, error => {
				if (error) reject(error);
				else resolve();
			});
		});
	}

	async handleManagerMessages(data: ManagerMessages | WorkerHeartbeaterMessages) {
		switch (data.type) {
			case 'HEARTBEAT':
				await this.postMessage({
					type: 'ACK_HEARTBEAT',
					workerId: workerData.workerId,
				});
				break;
			case 'CACHE_RESULT':
				if (this.cache.adapter instanceof WorkerAdapter && this.cache.adapter.promises.has(data.nonce)) {
					const cacheData = this.cache.adapter.promises.get(data.nonce)!;
					clearTimeout(cacheData.timeout);
					this.cache.adapter.promises.delete(data.nonce);
					if (data.error) cacheData.reject(deserializeWorkerError(data.error));
					else cacheData.resolve(data.result);
				}
				break;
			case 'SEND_PAYLOAD':
				{
					const { nonce: _nonce, shardId: _shardId, type: _type, ...payload } = data;
					const result = await this.sendGatewayPayloadOnShard(data.shardId, payload as GatewaySendPayload, true);
					if (result === 'missing') {
						this.logger.fatal(`Worker trying to send payload by non-existent shard (#${data.shardId})`);
						return;
					}

					await this.postMessage({
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
									void self
										.postMessage({
											type: 'WORKER_READY_RESHARDING',
											workerId: workerData.workerId,
										} satisfies WorkerReadyResharding)
										.catch(error => {
											self.logger.error('Failed to send WORKER_READY_RESHARDING to the worker manager', error);
										});
								}
							},
						});
						this.resharding.set(id, shard);
						await this.postMessage({
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
						await this.postMessage({
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
						this.logger.fatal(`Worker trying to get non-existent shard (#${data.shardId})`);
						return;
					}

					await this.postMessage({
						...generateShardInfo(shard),
						nonce: data.nonce,
						type: 'SHARD_INFO',
						workerId: this.workerId,
					} satisfies WorkerSendShardInfo);
				}
				break;
			case 'WORKER_INFO':
				{
					await this.postMessage({
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
					promise.resolve(data.responseType === 'arrayBuffer' ? Uint8Array.from(data.response).buffer : data.response);
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
					await this.postMessage({
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
					await this.postMessage({
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
					await this.postMessage({
						type: 'DISCONNECTED_ALL_SHARDS_RESHARDING',
						workerId: workerData.workerId,
					} satisfies WorkerDisconnectedAllShardsResharding);
				}
				break;
			case 'CONNECT_ALL_SHARDS_RESHARDING':
				{
					this.shards.clear();
					const handlePayload = this.options?.handlePayload?.bind(this);
					const dispatchPayload = async (shardId: number, packet: GatewayDispatchPayload) => {
						if (handlePayload) await this.cache.withoutGuildWriteOrder(() => handlePayload(shardId, packet));
						return this.onPacket(packet, shardId);
					};
					for (const [id, shard] of this.resharding) {
						this.shards.set(id, shard);
						shard.options.handlePayload = (shardId, packet) =>
							this.cache.trackMemberCount
								? this.cache.withGuildWriteOrder(packet, 'payload', () => dispatchPayload(shardId, packet))
								: dispatchPayload(shardId, packet);
					}
					workerData.totalShards = data.totalShards;
					workerData.shards = [...this.shards.keys()];
					this.resharding.clear();
				}
				break;
			case 'HOT_RELOAD_ACTIVATE':
				{
					// A replaced worker can be resumed when its replacement fails to take over.
					const fromStandby = this.dispatchState === 'standby';
					this.dispatchState = 'active';
					await this.postMessage({
						type: 'HOT_RELOAD_ACK',
						nonce: data.nonce,
						workerId: workerData.workerId,
					} satisfies WorkerHotReloadAck);
					if (!fromStandby) break;
					// Handlers never saw this worker become ready while it was on standby.
					for (const step of this.standbyReadiness.splice(0)) {
						if ('event' in step) await this.events.runEvent(step.event, this, this.me, -1);
						else await this.events.execute(step.packet, this, step.shardId);
					}
					if (data.botReady) await this.events.runEvent('BOT_READY', this, this.me, -1);
				}
				break;
			case 'HOT_RELOAD_STOP':
				this.dispatchState = 'stopped';
				await this.postMessage({
					type: 'HOT_RELOAD_ACK',
					nonce: data.nonce,
					workerId: workerData.workerId,
				} satisfies WorkerHotReloadAck);
				break;
			case 'HOT_RELOAD_DRAIN':
				{
					// A late rollback could have resumed this worker; once replaced it must not dispatch again.
					this.dispatchState = 'stopped';
					let timer: NodeJS.Timeout | undefined;
					let timedOut = false;
					const deadline = new Promise<void>(resolve => {
						timer = setTimeout(() => {
							timedOut = true;
							resolve();
						}, data.drainTimeout);
					});
					// Work can still be added while draining, such as RAW listeners once an interceptor resolves.
					while (this.inFlightWork.size && !timedOut) {
						await Promise.race([Promise.allSettled([...this.inFlightWork]), deadline]);
					}
					clearTimeout(timer);
					for (const shard of this.shards.values()) shard.end('Replaced by a hot reload');
					// The manager exits this worker after the ack, so let the close frames go out first.
					for (let waited = 0; waited < 3_000 && [...this.shards.values()].some(shard => shard.isOpen); waited += 50) {
						await delay(50);
					}
					await this.postMessage({
						type: 'HOT_RELOAD_ACK',
						nonce: data.nonce,
						workerId: workerData.workerId,
					} satisfies WorkerHotReloadAck);
				}
				break;
			case 'HOT_RELOAD_PROGRESS':
				this.hotReloadRequests.get(data.nonce)?.onProgress?.(data.progress);
				break;
			case 'HOT_RELOAD_RESULT':
				{
					const request = this.hotReloadRequests.get(data.nonce);
					if (!request) return;
					this.hotReloadRequests.delete(data.nonce);
					if (data.error) request.reject(deserializeWorkerError(data.error));
					else request.resolve(data.result);
				}
				break;
		}
	}

	/**
	 * Asks the `WorkerManager` to hot reload workers, possibly including this one. See
	 * `WorkerManager.hotReload` for how the reload works and what it guarantees.
	 *
	 * `onProgress` receives each stage as the manager reports it. If this worker is replaced, the promise resolves
	 * with the entries so far, including this worker's own, before it is told to drain, so it can still reply or
	 * log. Its stop and drain still follow. A plain `Client` has no manager; hot reload needs the `WorkerManager`.
	 */
	requestHotReload(
		options: WorkerHotReloadRequestOptions & { onProgress?(event: HotReloadProgress): void } = {},
	): Promise<HotReloadResult> {
		const { onProgress, ...request } = options;
		const nonce = this.generateNonce();
		return new Promise<HotReloadResult>((resolve, reject) => {
			this.hotReloadRequests.set(nonce, { resolve, reject, onProgress });
			Promise.resolve(
				this.postMessage({
					type: 'HOT_RELOAD_REQUEST',
					nonce,
					options: request,
					workerId: workerData.workerId,
				} satisfies WorkerRequestHotReload),
			).catch(error => {
				this.hotReloadRequests.delete(nonce);
				reject(error);
			});
		});
	}

	calculateShardId(guildId: string) {
		return calculateShardId(guildId, this.workerData.totalShards);
	}

	/**
	 * Sends a Gateway payload through the worker client's plugin wrappers and shard rate limiter.
	 *
	 * @returns `false` when a plugin wrapper vetoes the payload, otherwise `true` after it is sent.
	 */
	async sendGatewayPayload<T extends GatewaySendPayload>(shardId: number, payload: T): Promise<boolean> {
		const result = await this.sendGatewayPayloadOnShard(shardId, payload, false);
		if (result === 'missing') {
			throw new SeyfertError('INTERNAL_ERROR', { metadata: { detail: `Shard #${shardId} doesn't exist` } });
		}
		return result === 'sent';
	}

	private async sendGatewayPayloadOnShard(
		shardId: number,
		payload: GatewaySendPayload,
		force: boolean,
	): Promise<'missing' | 'sent' | 'vetoed'> {
		const pluginPayload = await applyPluginGatewaySendPayloadWrappers(this, shardId, payload);
		if (pluginPayload === null) return 'vetoed';
		const shard = this.shards.get(shardId);
		if (!shard) return 'missing';
		await shard.send(force, pluginPayload);
		return 'sent';
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
			}, 60e3);
			this.promises.set(nonce, { resolve: res, timeout });
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

	async tellWorker<R, V extends Record<string, unknown>>(workerId: number, func: (_: this, vars: V) => R, vars: V) {
		const nonce = this.generateNonce();
		return this.sendRequest<R>(nonce, 'Worker request', () =>
			this.postMessage({
				type: 'EVAL_TO_WORKER',
				func: func.toString(),
				toWorkerId: workerId,
				workerId: workerData.workerId,
				nonce,
				vars: JSON.stringify(vars),
			} satisfies WorkerSendToWorkerEval),
		);
	}

	tellWorkers<R, V extends Record<string, unknown>>(func: (_: this, vars: V) => R, vars: V) {
		const promises: Promise<R>[] = [];
		for (let i = 0; i < workerData.totalWorkers; i++) {
			promises.push(this.tellWorker(i, func, vars));
		}
		return Promise.all(promises);
	}

	createShard(id: number, data: Pick<ManagerSpawnShards, 'info' | 'compress' | 'properties'>) {
		const onPacket = this.onPacket.bind(this);
		const handlePayload = this.options?.handlePayload?.bind(this);
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
				let pluginPacket: GatewayDispatchPayload | null;
				// The user hook is a handler too, so it waits until this worker is the active one.
				const userHook = self.dispatchState === 'active' ? handlePayload : undefined;
				if (self.cache.trackMemberCount) {
					pluginPacket = await self.cache.withGuildWriteOrder(payload, 'payload', async () => {
						if (userHook) await self.cache.withoutGuildWriteOrder(() => userHook(shardId, payload));
						return onPacket(payload, shardId);
					});
				} else {
					if (userHook) await self.cache.withoutGuildWriteOrder(() => userHook(shardId, payload));
					pluginPacket = await onPacket(payload, shardId);
				}
				if (self.options.sendPayloadToParent && pluginPacket !== null) {
					void self
						.postMessage({
							workerId: workerData.workerId,
							shardId,
							type: 'RECEIVE_PAYLOAD',
							payload: pluginPacket,
						} satisfies WorkerReceivePayload)
						.catch(error => {
							self.logger.error('Failed to send RECEIVE_PAYLOAD to the worker manager', error);
						});
				}
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

	protected onPacket(packet: GatewayDispatchPayload, shardId: number): Promise<GatewayDispatchPayload | null> {
		const handled = this.cache.trackMemberCount
			? this.cache.withGuildWriteOrder(packet, 'dispatch', () => this.handlePacket(packet, shardId))
			: this.handlePacket(packet, shardId);
		if (this.dispatchState === 'active') this.trackInFlight(handled);
		return handled;
	}

	private trackInFlight(work: Promise<unknown>) {
		this.inFlightWork.add(work);
		const settle = () => this.inFlightWork.delete(work);
		work.then(settle, settle);
	}

	/**
	 * A replacement on standby only builds its cache and reports readiness. A stopped worker keeps its own cache
	 * current too, so it can take events back if its replacement fails to take over.
	 */
	private async handleInactivePacket(packet: GatewayDispatchPayload, shardId: number): Promise<null> {
		if (this.dispatchState === 'standby') this.trackStandbyReadiness(packet, shardId);
		// A shared adapter is kept current by the active worker; writing it here would apply every change twice.
		if (this.cache.adapter instanceof MemoryAdapter || this.cache.adapter instanceof LimitedMemoryAdapter) {
			await this.cache.onPacket(packet);
		}
		return null;
	}

	private trackStandbyReadiness(packet: GatewayDispatchPayload, shardId: number) {
		switch (packet.t) {
			// Mirrors handlePacket's readiness branches, recording each handler where startup would run it.
			case GatewayDispatchEvents.Ready:
				this.botId = packet.d.user.id;
				this.applicationId = packet.d.application.id;
				this.me = Transformers.ClientUser(this, packet.d.user, packet.d.application) as never;
				if ([...this.shards.values()].every(shard => shard.data.session_id)) {
					this.standbyReadiness.push({ event: 'WORKER_SHARDS_CONNECTED' });
				}
				this.standbyReadiness.push({ packet, shardId });
				break;
			case GatewayDispatchEvents.GuildsReady:
				if ([...this.shards.values()].every(shard => shard.isReady)) {
					void this.postMessage({
						type: 'WORKER_READY',
						workerId: this.workerId,
					}).catch(error => {
						this.logger.error('Failed to send WORKER_READY to the worker manager', error);
					});
					this.standbyReadiness.push({ event: 'WORKER_READY' });
				}
				this.standbyReadiness.push({ packet, shardId });
				break;
		}
	}

	private async handlePacket(packet: GatewayDispatchPayload, shardId: number): Promise<GatewayDispatchPayload | null> {
		if (this.dispatchState !== 'active') return this.handleInactivePacket(packet, shardId);
		if (this.pluginRegistry.gatewayDispatchInterceptors.length) {
			const pluginPacket = await this.cache.withoutGuildWriteOrder(() =>
				applyPluginGatewayDispatchInterceptors(this, shardId, packet),
			);
			if (pluginPacket === null) return null;
			packet = pluginPacket;
		}

		this.trackInFlight(
			this.cache.withoutGuildWriteOrder(() =>
				Promise.allSettled([
					this.events.runEvent('RAW', this, packet, shardId, false),
					this.collectors.run('RAW', packet, this),
				]),
			),
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
							void this.postMessage({
								type: 'WORKER_SHARDS_CONNECTED',
								workerId: this.workerId,
							}).catch(error => {
								this.logger.error('Failed to send WORKER_SHARDS_CONNECTED to the worker manager', error);
							});
							await this.events.runEvent('WORKER_SHARDS_CONNECTED', this, this.me, -1);
						}
						await this.events.execute(packet, this, shardId);
						this.debugger?.debug(`#${shardId}[${packet.d.user.username}](${this.botId}) is online...`);
						break;
					}
					case GatewayDispatchEvents.GuildsReady:
						{
							if ([...this.shards.values()].every(shard => shard.isReady)) {
								void this.postMessage({
									type: 'WORKER_READY',
									workerId: this.workerId,
								}).catch(error => {
									this.logger.error('Failed to send WORKER_READY to the worker manager', error);
								});
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
	/**
	 * Sends worker IPC messages. For cache requests, reject only when the request was not delivered;
	 * accepted operations report completion or failure through CACHE_RESULT.
	 */
	postMessage?: (body: unknown) => Awaitable<unknown>;
	/** can have perfomance issues in big bots if the client sends every event, specially in startup (false by default) */
	sendPayloadToParent?: boolean;
	handleManagerMessages?(message: ManagerMessages | WorkerHeartbeaterMessages): Awaitable<unknown>;
}
