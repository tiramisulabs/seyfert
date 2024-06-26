import {
	GatewayOpcodes,
	type GatewaySendPayload,
	type GatewayUpdatePresence,
	type GatewayVoiceStateUpdate,
} from 'discord-api-types/v10';
import {
	LogLevels,
	Logger,
	type MakeRequired,
	MergeOptions,
	lazyLoadPackage,
	toSnakeCase,
	type ObjectToLower,
	type WatcherSendToShard,
} from '../../common';
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

	constructor(options: ShardManagerOptions) {
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
		return Number((BigInt(guildId) >> 22n) % BigInt(this.options.info.shards ?? 1));
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
			compress: false,
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
		options: ObjectToLower<Pick<GatewayVoiceStateUpdate['d'], 'self_deaf' | 'self_mute'>>,
	) {
		const shardId = this.calculateShardId(guild_id);
		this.debugger?.info(`Shard #${shardId} join voice ${channel_id} in ${guild_id}`);

		return this.send<GatewayVoiceStateUpdate>(shardId, {
			op: GatewayOpcodes.VoiceStateUpdate,
			d: {
				guild_id,
				channel_id,
				...toSnakeCase(options),
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
