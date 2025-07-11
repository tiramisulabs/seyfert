import type { CommandContext, Message } from '..';
import {
	type Awaitable,
	assertString,
	type DeepPartial,
	lazyLoadPackage,
	type PickPartial,
	type WatcherPayload,
	type WatcherSendToShard,
	When,
} from '../common';
import { EventHandler } from '../events';
import type { GatewayDispatchPayload, GatewayPresenceUpdateData } from '../types';
import { properties, ShardManager, type ShardManagerOptions } from '../websocket';
import { MemberUpdateHandler } from '../websocket/discord/events/memberUpdate';
import { PresenceUpdateHandler } from '../websocket/discord/events/presenceUpdate';
import type { BaseClientOptions, InternalRuntimeConfig, ServicesOptions, StartOptions } from './base';
import { BaseClient } from './base';
import { Collectors } from './collectors';
import { type ClientUserStructure, type MessageStructure, Transformers } from './transformers';

let parentPort: import('node:worker_threads').MessagePort;

export class Client<Ready extends boolean = boolean> extends BaseClient {
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

	get applicationId(): When<Ready, string> {
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
			this.gateway = gateway;
		}
	}

	get latency() {
		return this.gateway.latency;
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
						this.gateway.send(data.shardId, data.payload);
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
		const intents = options?.connection?.intents ?? intentsRC;
		this.cache.intents = intents;

		if (!this.gateway) {
			assertString(token, 'token is not a string');
			this.gateway = new ShardManager({
				token,
				info: await this.proxy.gateway.bot.get(),
				intents,
				handlePayload: async (shardId, packet) => {
					await this.options?.handlePayload?.(shardId, packet);
					return this.onPacket(shardId, packet);
				},
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
			await this.execute(options.connection);
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
}

export interface ClientOptions extends BaseClientOptions {
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
	resharding?: PickPartial<NonNullable<ShardManagerOptions['resharding']>, 'getInfo'>;
}
