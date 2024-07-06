import { GatewayIntentBits, type GatewayDispatchPayload, type GatewayPresenceUpdateData } from 'discord-api-types/v10';
import type { CommandContext, Message } from '..';
import {
	type Awaitable,
	lazyLoadPackage,
	type DeepPartial,
	type If,
	type WatcherPayload,
	type WatcherSendToShard,
} from '../common';
import { EventHandler } from '../events';
import { ShardManager, properties, type ShardManagerOptions } from '../websocket';
import { MemberUpdateHandler } from '../websocket/discord/events/memberUpdate';
import { PresenceUpdateHandler } from '../websocket/discord/events/presenceUpdate';
import type { BaseClientOptions, InternalRuntimeConfig, ServicesOptions, StartOptions } from './base';
import { BaseClient } from './base';
import { Collectors } from './collectors';
import { type ClientUserStructure, Transformers, type MessageStructure } from './transformers';

let parentPort: import('node:worker_threads').MessagePort;

export class Client<Ready extends boolean = boolean> extends BaseClient {
	private __handleGuilds?: Set<string> = new Set();
	gateway!: ShardManager;
	me!: If<Ready, ClientUserStructure>;
	declare options: Omit<ClientOptions, 'commands'> & {
		commands: NonNullable<ClientOptions['commands']>;
	};
	memberUpdateHandler = new MemberUpdateHandler();
	presenceUpdateHandler = new PresenceUpdateHandler();
	collectors = new Collectors();
	events? = new EventHandler(this);

	constructor(options?: ClientOptions) {
		super(options);
	}

	setServices({
		gateway,
		...rest
	}: ServicesOptions & {
		gateway?: ShardManager;
		handlers?: ServicesOptions['handlers'] & {
			events?: EventHandler['callback'];
		};
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

	async loadEvents(dir?: string) {
		dir ??= await this.getRC().then(x => x.events);
		if (dir && this.events) {
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

		if (!this.gateway) {
			BaseClient.assertString(token, 'token is not a string');
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
			});
		}

		this.cache.intents = this.gateway.options.intents;

		if (execute) {
			await this.execute(options.connection);
		} else {
			await super.execute(options);
		}
	}

	protected async onPacket(shardId: number, packet: GatewayDispatchPayload) {
		Promise.allSettled([
			this.events?.runEvent('RAW', this, packet, shardId, false),
			this.collectors.run('RAW', packet),
		]); //ignore promise
		switch (packet.t) {
			//// Cases where we must obtain the old data before updating
			case 'GUILD_MEMBER_UPDATE':
				if (!this.memberUpdateHandler.check(packet.d)) {
					return;
				}
				await this.events?.execute(packet.t, packet, this as Client<true>, shardId);
				break;
			case 'PRESENCE_UPDATE':
				if (!this.presenceUpdateHandler.check(packet.d)) {
					return;
				}
				await this.events?.execute(packet.t, packet, this as Client<true>, shardId);
				break;
			case 'GUILD_CREATE': {
				if (this.__handleGuilds?.has(packet.d.id)) {
					this.__handleGuilds.delete(packet.d.id);
					if (!this.__handleGuilds.size && [...this.gateway.values()].every(shard => shard.data.session_id)) {
						await this.events?.runEvent('BOT_READY', this, this.me, -1);
					}
					if (!this.__handleGuilds.size) delete this.__handleGuilds;
					return this.cache.onPacket(packet);
				}
				await this.events?.execute(packet.t, packet, this as Client<true>, shardId);
				break;
			}
			//rest of the events
			default: {
				await this.events?.execute(packet.t as never, packet, this as Client<true>, shardId);
				switch (packet.t) {
					case 'INTERACTION_CREATE':
						await this.handleCommand.interaction(packet.d, shardId);
						break;
					case 'MESSAGE_CREATE':
						await this.handleCommand.message(packet.d, shardId);
						break;
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
								this.__handleGuilds.size &&
								(this.gateway.options.intents & GatewayIntentBits.Guilds) === GatewayIntentBits.Guilds
							)
						) {
							if ([...this.gateway.values()].every(shard => shard.data.session_id)) {
								await this.events?.runEvent('BOT_READY', this, this.me, -1);
							}
							delete this.__handleGuilds;
						}
						this.debugger?.debug(`#${shardId}[${packet.d.user.username}](${this.botId}) is online...`);
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
		deferReplyResponse?: (ctx: CommandContext) => Parameters<Message['write']>[0];
		reply?: (ctx: CommandContext) => boolean;
	};
	handlePayload?: ShardManagerOptions['handlePayload'];
}
