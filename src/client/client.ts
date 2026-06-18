import type { CommandContext, Message } from '..';
import {
	type Awaitable,
	type DeepPartial,
	lazyLoadPackage,
	type PickPartial,
	SeyfertError,
	type WatcherPayload,
	type WatcherSendToShard,
	type When,
} from '../common';
import { EventHandler } from '../events';
import type { GatewayDispatchPayload, GatewayPresenceUpdateData, GatewaySendPayload } from '../types';
import {
	properties,
	type ShardDisconnectData,
	ShardManager,
	type ShardManagerOptions,
	type ShardReconnectData,
} from '../websocket';
import { MemberUpdateHandler } from '../websocket/discord/events/memberUpdate';
import { PresenceUpdateHandler } from '../websocket/discord/events/presenceUpdate';
import type { BaseClientOptions, InternalRuntimeConfig, ServicesOptions, StartOptions } from './base';
import { BaseClient } from './base';
import { Collectors } from './collectors';
import {
	type AnySeyfertPlugin,
	applyPluginGatewayPayloadWrappers,
	type ExtendOf,
	type RegisteredPluginExtension,
	type RegisteredPlugins,
	resolveClientPluginIntents,
} from './plugins';
import type { GatewayIntentInput } from './intents';
import { type ClientUserStructure, type MessageStructure, Transformers } from './transformers';

let parentPort: import('node:worker_threads').MessagePort;

class ClientBase<Ready extends boolean = boolean> extends BaseClient {
	gateway!: ShardManager;
	me!: When<Ready, ClientUserStructure>;
	declare options: Omit<ClientOptions, 'commands'> & {
		commands: NonNullable<ClientOptions['commands']>;
	};
	memberUpdateHandler = new MemberUpdateHandler();
	presenceUpdateHandler = new PresenceUpdateHandler();
	collectors = new Collectors();
	events = new EventHandler(this);

	constructor(options?: ClientOptions) {
		super(options);
	}

	get applicationId(): When<Ready, string, ''> {
		return (this.me?.application.id ?? super.applicationId) as never;
	}

	set applicationId(id: string) {
		super.applicationId = id;
	}

	setServices({
		gateway,
		...rest
	}: ServicesOptions & {
		gateway?: ShardManager;
	}) {
		super.setServices(rest);
		if (gateway) {
			const onPacket = this.onPacket.bind(this);
			const oldFn = gateway.options.handlePayload;
			gateway.options.handlePayload = async (shardId, packet) => {
				await onPacket(shardId, packet);
				return oldFn(shardId, packet);
			};
			const oldOnShardDisconnect = gateway.options.onShardDisconnect;
			gateway.options.onShardDisconnect = async data => {
				await oldOnShardDisconnect?.(data);
				await this.onShardDisconnect(data);
			};
			const oldOnShardReconnect = gateway.options.onShardReconnect;
			gateway.options.onShardReconnect = async data => {
				await oldOnShardReconnect?.(data);
				await this.onShardReconnect(data);
			};
			const oldHandleSendPayload = gateway.options.handleSendPayload;
			gateway.options.handleSendPayload = (shardId, payload) =>
				this.handleGatewaySendPayload(shardId, payload, oldHandleSendPayload);
			this.gateway = gateway;
		}
	}

	get latency() {
		return this.gateway.latency;
	}

	private async onShardDisconnect(data: ShardDisconnectData) {
		await this.options?.onShardDisconnect?.(data);
		await this.events.runEvent('SHARD_DISCONNECT', this, data, data.shardId, false);
	}

	private async onShardReconnect(data: ShardReconnectData) {
		await this.options?.onShardReconnect?.(data);
		await this.events.runEvent('SHARD_RECONNECT', this, data, data.shardId, false);
	}

	async loadEvents(dir?: string) {
		dir ??= await this.getRC().then(x => x.locations.events);
		if (dir) {
			await this.events.load(dir);
			this.logger.info('EventHandler loaded');
		}
	}

	protected async execute(options: { token?: string; intents?: number } = {}) {
		await super.execute(options);

		const worker_threads = lazyLoadPackage<typeof import('node:worker_threads')>('node:worker_threads');

		if (worker_threads?.parentPort) {
			parentPort = worker_threads.parentPort;
		}

		if (worker_threads?.workerData?.__USING_WATCHER__) {
			parentPort?.on('message', (data: WatcherPayload | WatcherSendToShard) => {
				switch (data.type) {
					case 'PAYLOAD':
						this.gateway.options.handlePayload(data.shardId, data.payload);
						break;
					case 'SEND_TO_SHARD':
						void this.gateway.send(data.shardId, data.payload).catch(error => {
							this.logger.fatal('Watcher failed to send payload to shard', error);
						});
						break;
				}
			});
		} else {
			await this.gateway.spawnShards();
		}
	}

	async start(options: Omit<DeepPartial<StartOptions>, 'httpConnection'> = {}, execute = true) {
		await super.start(options);
		await this.loadEvents(options.eventsDir);

		const { token: tokenRC, intents: intentsRC, debug: debugRC } = await this.getRC<InternalRuntimeConfig>();
		const token = options?.token ?? tokenRC;
		const connectionIntents = options.connection?.intents as GatewayIntentInput | undefined;
		const intents = resolveClientPluginIntents(this, connectionIntents ?? intentsRC);
		this.cache.intents = intents;

		if (!this.gateway) {
			if (typeof token !== 'string' || token.length === 0) {
				throw new SeyfertError('INVALID_TOKEN', { metadata: { detail: 'token is not a string' } });
			}
			this.gateway = new ShardManager({
				token,
				info: await this.proxy.gateway.bot.get(),
				intents,
				handlePayload: async (shardId, packet) => {
					await this.options?.handlePayload?.(shardId, packet);
					return this.onPacket(shardId, packet);
				},
				handleSendPayload: (shardId, payload) =>
					this.handleGatewaySendPayload(shardId, payload, this.options?.handleSendPayload),
				onShardDisconnect: this.onShardDisconnect.bind(this),
				onShardReconnect: this.onShardReconnect.bind(this),
				presence: this.options?.presence,
				debug: debugRC,
				shardStart: this.options?.shards?.start,
				shardEnd: this.options?.shards?.end ?? this.options?.shards?.total,
				totalShards: this.options?.shards?.total ?? this.options?.shards?.end,
				properties: {
					...properties,
					...this.options?.gateway?.properties,
				},
				compress: this.options?.gateway?.compress,
				resharding: {
					getInfo: this.options.resharding?.getInfo ?? (() => this.proxy.gateway.bot.get()),
					interval: this.options?.resharding?.interval,
					percentage: this.options?.resharding?.percentage,
				},
			});
		}

		if (execute) {
			await this.execute({ ...(options.connection ?? {}), intents });
		} else {
			await super.execute(options);
		}
	}

	protected async onPacket(shardId: number, packet: GatewayDispatchPayload) {
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
					await this.events.execute(packet, this as Client<true>, shardId);
				}
				break;
			case 'PRESENCE_UPDATE':
				{
					if (!this.presenceUpdateHandler.check(packet.d)) {
						return;
					}
					await this.events.execute(packet, this as Client<true>, shardId);
				}
				break;
			//rest of the events
			default: {
				switch (packet.t) {
					case 'INTERACTION_CREATE':
						{
							await this.events.execute(packet, this as Client<true>, shardId);
							await this.handleCommand.interaction(packet.d, shardId);
						}
						break;
					case 'MESSAGE_CREATE':
						{
							await this.events.execute(packet, this as Client<true>, shardId);
							await this.handleCommand.message(packet.d, shardId);
						}
						break;
					case 'READY': {
						this.botId = packet.d.user.id;
						this.applicationId = packet.d.application.id;
						this.me = Transformers.ClientUser(this, packet.d.user, packet.d.application) as never;
						this.debugger?.debug(`#${shardId}[${packet.d.user.username}](${this.botId}) is online...`);
						await this.events.execute(packet, this as Client<true>, shardId);
						break;
					}
					case 'GUILDS_READY':
						{
							await this.events.execute(packet, this as Client<true>, shardId);
							if ([...this.gateway.values()].every(shard => shard.isReady)) {
								await this.events.runEvent('BOT_READY', this, this.me, -1);
							}
						}
						break;
					default:
						await this.events.execute(packet, this as Client<true>, shardId);
						break;
				}
				break;
			}
		}
	}

	private async handleGatewaySendPayload(
		shardId: number,
		payload: GatewaySendPayload,
		handleSendPayload?: ShardManagerOptions['handleSendPayload'],
	) {
		const pluginPayload = await applyPluginGatewayPayloadWrappers(this, shardId, payload);
		if (pluginPayload === null) return null;
		const result = await handleSendPayload?.(shardId, pluginPayload);
		if (result === null) return null;
		return result ?? pluginPayload;
	}
}

type ClientPluginsOf<TPluginsOrReady extends readonly AnySeyfertPlugin[] | boolean> =
	TPluginsOrReady extends readonly AnySeyfertPlugin[] ? TPluginsOrReady : RegisteredPlugins;
type ClientReadyOf<
	TPluginsOrReady extends readonly AnySeyfertPlugin[] | boolean,
	Ready extends boolean,
> = TPluginsOrReady extends boolean ? TPluginsOrReady : Ready;
type Materialize<T> = {
	[K in keyof T]: T[K];
};

export type Client<
	TPluginsOrReady extends readonly AnySeyfertPlugin[] | boolean = RegisteredPlugins,
	Ready extends boolean = boolean,
> = ClientBase<ClientReadyOf<TPluginsOrReady, Ready>> &
	RegisteredPluginExtension &
	Materialize<ExtendOf<ClientPluginsOf<TPluginsOrReady>>>;

export interface ClientConstructor {
	new <Ready extends boolean = boolean>(options?: ClientOptions<RegisteredPlugins>): Client<Ready>;
	new <const TPlugins extends readonly AnySeyfertPlugin[] = RegisteredPlugins>(
		options?: ClientOptions<TPlugins>,
	): Client<TPlugins>;
}

export const Client = ClientBase as unknown as ClientConstructor;

export interface ClientOptions<TPlugins extends readonly AnySeyfertPlugin[] = RegisteredPlugins>
	extends BaseClientOptions {
	plugins?: TPlugins;
	presence?: (shardId: number) => GatewayPresenceUpdateData;
	shards?: {
		start: number;
		end: number;
		total?: number;
	};
	gateway?: {
		properties?: Partial<ShardManagerOptions['properties']>;
		compress?: ShardManagerOptions['compress'];
	};
	commands?: BaseClientOptions['commands'] & {
		prefix?: (message: MessageStructure) => Awaitable<string[]>;
		deferReplyResponse?: (ctx: CommandContext) => Awaitable<Parameters<Message['write']>[0]>;
		reply?: (ctx: CommandContext) => Awaitable<boolean>;
	};
	handlePayload?: ShardManagerOptions['handlePayload'];
	handleSendPayload?: ShardManagerOptions['handleSendPayload'];
	/**
	 * @deprecated Use shard disconnect events instead. Injected ShardManager callbacks can double-fire.
	 */
	onShardDisconnect?: ShardManagerOptions['onShardDisconnect'];
	/**
	 * @deprecated Use shard reconnect events instead. Injected ShardManager callbacks can double-fire.
	 */
	onShardReconnect?: ShardManagerOptions['onShardReconnect'];
	resharding?: PickPartial<NonNullable<ShardManagerOptions['resharding']>, 'getInfo'>;
}
