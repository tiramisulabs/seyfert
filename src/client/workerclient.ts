import { GatewayIntentBits, type GatewayDispatchPayload, type GatewaySendPayload } from 'discord-api-types/v10';
import { randomUUID } from 'node:crypto';
import { ApiHandler, Logger } from '..';
import type { Cache } from '../cache';
import { WorkerAdapter } from '../cache';
import { LogLevels, lazyLoadPackage, type DeepPartial, type When } from '../common';
import { EventHandler } from '../events';
import { Shard, properties, type ShardManagerOptions, type WorkerData } from '../websocket';
import type {
	WorkerReady,
	WorkerReceivePayload,
	WorkerRequestConnect,
	WorkerSendEval,
	WorkerSendEvalResponse,
	WorkerSendInfo,
	WorkerSendResultPayload,
	WorkerSendShardInfo,
	WorkerShardInfo,
	WorkerStart,
} from '../websocket/discord/worker';
import type { ManagerMessages } from '../websocket/discord/workermanager';
import type { BaseClientOptions, ServicesOptions, StartOptions } from './base';
import { BaseClient } from './base';
import type { Client, ClientOptions } from './client';

import { Collectors } from './collectors';
import { type ClientUserStructure, Transformers } from './transformers';

let workerData: WorkerData;
let manager: import('node:worker_threads').MessagePort;
try {
	workerData = {
		debug: process.env.SEYFERT_WORKER_DEBUG === 'true',
		intents: Number.parseInt(process.env.SEYFERT_WORKER_INTENTS!),
		path: process.env.SEYFERT_WORKER_PATH!,
		shards: process.env.SEYFERT_WORKER_SHARDS!.split(',').map(id => Number.parseInt(id)),
		token: process.env.SEYFERT_WORKER_TOKEN!,
		workerId: Number.parseInt(process.env.SEYFERT_WORKER_WORKERID!),
		workerProxy: process.env.SEYFERT_WORKER_WORKERPROXY === 'true',
	} as WorkerData;
} catch {}

export class WorkerClient<Ready extends boolean = boolean> extends BaseClient {
	private __handleGuilds?: Set<string> = new Set();
	logger = new Logger({
		name: `[Worker #${workerData.workerId}]`,
	});

	collectors = new Collectors();
	events? = new EventHandler(this);
	me!: When<Ready, ClientUserStructure>;
	promises = new Map<string, { resolve: (value: any) => void; timeout: NodeJS.Timeout }>();

	shards = new Map<number, Shard>();

	declare options: WorkerClientOptions;

	constructor(options?: WorkerClientOptions) {
		super(options);

		if (!process.env.SEYFERT_SPAWNING) {
			throw new Error('WorkerClient cannot spawn without manager');
		}
		this.postMessage({
			type: 'WORKER_START',
			workerId: workerData.workerId,
		} satisfies WorkerStart);

		const worker_threads = lazyLoadPackage<typeof import('node:worker_threads')>('node:worker_threads');
		if (worker_threads?.parentPort) {
			manager = worker_threads?.parentPort;
		}
		(manager ?? process).on('message', (data: ManagerMessages) => this.handleManagerMessages(data));

		this.setServices({
			cache: {
				adapter: new WorkerAdapter(workerData),
				disabledCache: options?.disabledCache,
			},
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
	}

	get workerId() {
		return workerData.workerId;
	}

	get latency() {
		let acc = 0;

		this.shards.forEach(s => (acc += s.latency));

		return acc / this.shards.size;
	}

	setServices({
		...rest
	}: ServicesOptions & {
		handlers?: ServicesOptions['handlers'] & {
			events?: EventHandler['callback'];
		};
	}) {
		super.setServices(rest);
		if (rest.handlers && 'events' in rest.handlers) {
			if (!rest.handlers.events) {
				this.events = undefined;
			} else if (typeof rest.handlers.events === 'function') {
				this.events = new EventHandler(this);
			} else {
				this.events = rest.handlers.events;
			}
		}
	}

	async start(options: Omit<DeepPartial<StartOptions>, 'httpConnection' | 'token' | 'connection'> = {}) {
		await super.start(options);
		await this.loadEvents(options.eventsDir);
		this.cache.intents = workerData.intents;
	}

	async loadEvents(dir?: string) {
		dir ??= await this.getRC().then(x => x.events);
		if (dir && this.events) {
			await this.events.load(dir);
			this.logger.info('EventHandler loaded');
		}
	}

	postMessage(body: any) {
		if (manager) return manager.postMessage(body);
		return process.send!(body);
	}

	protected async handleManagerMessages(data: ManagerMessages) {
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
			case 'SPAWN_SHARDS':
				{
					const onPacket = this.onPacket.bind(this);
					const handlePayload = this.options?.handlePayload?.bind(this);
					const self = this;
					for (const id of workerData.shards) {
						let shard = this.shards.get(id);
						if (!shard) {
							shard = new Shard(id, {
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
									await onPacket?.(payload, shardId);
									self.postMessage({
										workerId: workerData.workerId,
										shardId,
										type: 'RECEIVE_PAYLOAD',
										payload,
									} satisfies WorkerReceivePayload);
								},
							});
							this.shards.set(id, shard);
						}

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
				{
					let result;
					try {
						// biome-ignore lint/security/noGlobalEval: yes
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

	tellWorker(workerId: number, func: (_: this) => {}) {
		const nonce = this.generateNonce();
		this.postMessage({
			type: 'EVAL',
			func: func.toString(),
			toWorkerId: workerId,
			workerId: workerData.workerId,
			nonce,
		} satisfies WorkerSendEval);
		return this.generateSendPromise(nonce);
	}

	protected async onPacket(packet: GatewayDispatchPayload, shardId: number) {
		Promise.allSettled([
			this.events?.runEvent('RAW', this, packet, shardId, false),
			this.collectors.run('RAW', packet),
		]); //ignore promise
		switch (packet.t) {
			case 'GUILD_CREATE': {
				if (this.__handleGuilds?.has(packet.d.id)) {
					this.__handleGuilds.delete(packet.d.id);
					if (!this.__handleGuilds.size && [...this.shards.values()].every(shard => shard.data.session_id)) {
						this.postMessage({
							type: 'WORKER_READY',
							workerId: this.workerId,
						} as WorkerReady);
						await this.events?.runEvent('WORKER_READY', this, this.me, -1);
					}
					if (!this.__handleGuilds.size) delete this.__handleGuilds;
					return this.cache.onPacket(packet);
				}
				await this.events?.execute(packet.t, packet, this, shardId);
				break;
			}
			default: {
				await this.events?.execute(packet.t as never, packet, this, shardId);
				switch (packet.t) {
					case 'READY':
						if (!this.__handleGuilds) this.__handleGuilds = new Set();
						for (const g of packet.d.guilds) {
							this.__handleGuilds.add(g.id);
						}
						this.botId = packet.d.user.id;
						this.applicationId = packet.d.application.id;
						this.me = Transformers.ClientUser(this, packet.d.user, packet.d.application) as never;
						if (
							!(
								this.__handleGuilds.size && (workerData.intents & GatewayIntentBits.Guilds) === GatewayIntentBits.Guilds
							)
						) {
							if ([...this.shards.values()].every(shard => shard.data.session_id)) {
								this.postMessage({
									type: 'WORKER_READY',
									workerId: this.workerId,
								} as WorkerReady);
								await this.events?.runEvent('WORKER_READY', this, this.me, -1);
							}
							delete this.__handleGuilds;
						}
						this.debugger?.debug(`#${shardId} [${packet.d.user.username}](${this.botId}) is online...`);
						break;
					case 'INTERACTION_CREATE':
						await this.handleCommand.interaction(packet.d, shardId);
						break;
					case 'MESSAGE_CREATE':
						await this.handleCommand.message(packet.d, shardId);
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
	};
}

interface WorkerClientOptions extends BaseClientOptions {
	disabledCache: Cache['disabledCache'];
	commands?: NonNullable<Client['options']>['commands'];
	handlePayload?: ShardManagerOptions['handlePayload'];
	gateway?: ClientOptions['gateway'];
}
