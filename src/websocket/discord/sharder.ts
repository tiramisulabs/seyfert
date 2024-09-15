import {
	LogLevels,
	Logger,
	type MakeRequired,
	MergeOptions,
	type WatcherSendToShard,
	calculateShardId,
	lazyLoadPackage,
} from '../../common';
import type { MakeDeepPartial } from '../../common/types/util';
import {
	type GatewayDispatchPayload,
	GatewayOpcodes,
	type GatewaySendPayload,
	type GatewayUpdatePresence,
	type GatewayVoiceStateUpdate,
} from '../../types';
import { ShardManagerDefaults } from '../constants';
import { DynamicBucket } from '../structures';
import { ConnectQueue } from '../structures/timeout';
import { Shard } from './shard';
import type { ShardManagerOptions, WorkerData } from './shared';

let parentPort: import('node:worker_threads').MessagePort;
let workerData: WorkerData;

export class ShardManager extends Map<number, Shard> {
	connectQueue: ConnectQueue;
	options: MakeRequired<ShardManagerOptions, keyof typeof ShardManagerDefaults>;
	debugger?: Logger;

	constructor(options: MakeDeepPartial<ShardManagerOptions, 'resharding'>) {
		super();
		this.options = MergeOptions<ShardManager['options']>(
			ShardManagerDefaults,
			{
				totalShards: options.info.shards,
			} as ShardManagerOptions,
			options,
		);
		this.connectQueue = new ConnectQueue(5.5e3, this.concurrency);

		if (this.options.debug) {
			this.debugger = new Logger({
				name: '[ShardManager]',
				logLevel: LogLevels.Debug,
			});
		}

		const worker_threads = lazyLoadPackage<typeof import('node:worker_threads')>('node:worker_threads');

		if (worker_threads) {
			workerData = worker_threads.workerData;
			if (worker_threads.parentPort) parentPort = worker_threads.parentPort;
		}
	}

	get totalShards() {
		return this.options.totalShards ?? this.options.info.shards;
	}

	get shardStart() {
		return this.options.shardStart ?? 0;
	}

	get shardEnd() {
		return this.options.shardEnd ?? this.totalShards;
	}

	get remaining() {
		return this.options.info.session_start_limit.remaining;
	}

	get concurrency() {
		return this.options.info.session_start_limit.max_concurrency;
	}

	get latency() {
		let acc = 0;

		this.forEach(s => (acc += s.latency));

		return acc / this.size;
	}

	calculateShardId(guildId: string) {
		return calculateShardId(guildId, this.totalShards);
	}

	spawn(shardId: number) {
		this.debugger?.info(`Spawn shard ${shardId}`);
		let shard = this.get(shardId);

		shard ??= new Shard(shardId, {
			token: this.options.token,
			intents: this.options.intents,
			info: { ...this.options.info, shards: this.totalShards },
			handlePayload: this.options.handlePayload,
			properties: this.options.properties,
			debugger: this.debugger,
			compress: this.options.compress ?? false,
			presence: this.options.presence?.(shardId, -1),
		});

		this.set(shardId, shard);

		return shard;
	}

	async spawnShards(): Promise<void> {
		const buckets = this.spawnBuckets();

		this.debugger?.info('Spawn shards');
		for (const bucket of buckets) {
			for (const shard of bucket) {
				if (!shard) {
					break;
				}
				this.debugger?.info(`${shard.id} add to connect queue`);
				this.connectQueue.push(shard.connect.bind(shard));
			}
		}
		await this.startResharder();
	}

	async startResharder() {
		if (this.options.resharding.interval <= 0) return;
		if (this.shardStart !== 0 || this.shardEnd !== this.totalShards)
			return this.debugger?.debug('Cannot start resharder');

		this.debugger?.debug('Resharder enabled');
		setInterval(async () => {
			this.debugger?.debug('Checking if reshard is needed');
			const info = await this.options.resharding.getInfo();
			if (info.shards <= this.totalShards) return this.debugger?.debug('Resharding not needed');
			//https://github.com/discordeno/discordeno/blob/6a5f446c0651b9fad9f1550ff1857fe7a026426b/packages/gateway/src/manager.ts#L106C8-L106C94
			const percentage = (info.shards / ((this.totalShards * 2500) / 1000)) * 100;
			if (percentage < this.options.resharding.percentage)
				return this.debugger?.debug(
					`Percentage is not enough to reshard ${percentage}/${this.options.resharding.percentage}`,
				);

			this.debugger?.info('Starting resharding process');

			this.connectQueue.concurrency = info.session_start_limit.max_concurrency;
			this.options.totalShards = info.shards;
			this.options.info.session_start_limit.max_concurrency = info.session_start_limit.max_concurrency;

			let shardsConnected = 0;
			let handlePayload = async (sharder: ShardManager, _: number, packet: GatewayDispatchPayload) => {
				if (
					(packet.t === 'GUILD_CREATE' || packet.t === 'GUILD_DELETE') &&
					this.options.resharding.onGuild(packet.d.id)
				) {
					return;
				}

				if (packet.t !== 'READY') return;

				this.options.resharding.reloadGuilds(packet.d.guilds.map(x => x.id));

				if (++shardsConnected < info.shards) return; //waiting for last shard to connect

				// dont listen more events when all shards are ready
				handlePayload = async () => {
					//
				};
				await this.disconnectAll();
				this.clear();

				for (const [id, shard] of sharder) {
					shard.options.handlePayload = (shardId, packet) => {
						return this.options.handlePayload(shardId, packet);
					};
					this.set(id, shard);
				}

				sharder.clear();
			};

			const resharder = new ShardManager({
				...this.options,
				resharding: {
					// getInfo mock, we don't need it
					getInfo: () => ({}) as any,
					interval: 0,
					percentage: 0,
					reloadGuilds() {
						//
					},
					onGuild() {
						return true;
					},
				},
				handlePayload: (shardId, packet): unknown => {
					return handlePayload(resharder, shardId, packet);
				},
			});

			// share ratelimit
			resharder.connectQueue = this.connectQueue;

			await resharder.spawnShards();
		}, this.options.resharding.interval);
	}

	/*
	 * spawns buckets in order
	 * https://discord.com/developers/docs/topics/gateway#sharding-max-concurrency
	 */
	spawnBuckets(): Shard[][] {
		this.debugger?.info('#0 Preparing buckets');
		const chunks = DynamicBucket.chunk(new Array(this.shardEnd - this.shardStart), this.concurrency);
		chunks.forEach((arr: any[], index: number) => {
			for (let i = 0; i < arr.length; i++) {
				const id = i + (index > 0 ? index * this.concurrency : 0) + this.shardStart;
				chunks[index][i] = this.spawn(id);
			}
		});
		this.debugger?.info(`${chunks.length} buckets created`);
		return chunks;
	}

	forceIdentify(shardId: number) {
		this.debugger?.info(`Shard #${shardId} force identify`);
		return this.spawn(shardId).identify();
	}

	disconnect(shardId: number) {
		this.debugger?.info(`Shard #${shardId} force disconnect`);
		return this.get(shardId)?.disconnect();
	}

	disconnectAll() {
		this.debugger?.info('Disconnect all shards');
		return new Promise(resolve => {
			this.forEach(shard => shard.disconnect());
			resolve(null);
		});
	}

	setShardPresence(shardId: number, payload: GatewayUpdatePresence['d']) {
		this.debugger?.info(`Shard #${shardId} update presence`);
		return this.send<GatewayUpdatePresence>(shardId, {
			op: GatewayOpcodes.PresenceUpdate,
			d: payload,
		});
	}

	setPresence(payload: GatewayUpdatePresence['d']): Promise<void> {
		return new Promise(resolve => {
			this.forEach(shard => {
				this.setShardPresence(shard.id, payload);
			}, this);
			resolve();
		});
	}

	joinVoice(
		guild_id: string,
		channel_id: string,
		options: Pick<GatewayVoiceStateUpdate['d'], 'self_deaf' | 'self_mute'>,
	) {
		const shardId = this.calculateShardId(guild_id);
		this.debugger?.info(`Shard #${shardId} join voice ${channel_id} in ${guild_id}`);

		return this.send<GatewayVoiceStateUpdate>(shardId, {
			op: GatewayOpcodes.VoiceStateUpdate,
			d: {
				guild_id,
				channel_id,
				...options,
			},
		});
	}

	leaveVoice(guild_id: string) {
		const shardId = this.calculateShardId(guild_id);
		this.debugger?.info(`Shard #${shardId} leave voice in ${guild_id}`);

		return this.send<GatewayVoiceStateUpdate>(shardId, {
			op: GatewayOpcodes.VoiceStateUpdate,
			d: {
				guild_id,
				channel_id: null,
				self_mute: false,
				self_deaf: false,
			},
		});
	}

	send<T extends GatewaySendPayload>(shardId: number, payload: T) {
		if (workerData?.__USING_WATCHER__) {
			return parentPort?.postMessage({
				type: 'SEND_TO_SHARD',
				shardId,
				payload,
			} satisfies WatcherSendToShard);
		}
		this.get(shardId)?.send(false, payload);
	}
}
