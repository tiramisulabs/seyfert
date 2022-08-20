import { createLeakyBucket } from '../utils/bucket-util';

import type { LeakyBucket } from '../utils/bucket-util';

import type { GatewayBot, PickPartial } from '@biscuitland/api-types';
import type { WsAdapter } from './ws-adapter';

import type {
	Shard,
	ShardGatewayConfig,
	ShardOptions,
} from '../services/shard';

import { Agent } from '../services/agent';

export class DefaultWsAdapter implements WsAdapter {
	static readonly DEFAULTS = {
		spawnShardDelay: 5300,

		shardsPerWorker: 25,
		totalWorkers: 4,

		gatewayBot: {
			url: 'wss://gateway.discord.gg',
			shards: 1,

			sessionStartLimit: {
				total: 1000,
				remaining: 1000,
				resetAfter: 0,
				maxConcurrency: 1,
			},
		},

		firstShardId: 0,

		lastShardId: 1,
	};

	buckets = new Map<
		number,
		{
			workers: { id: number; queue: number[] }[];
			leak: LeakyBucket;
		}
	>();

	options: Options;

	agent: Agent;

	constructor(options: DefaultWsOptions) {
		this.options = Object.assign(Object.create(DefaultWsAdapter.DEFAULTS), options);

		this.options.firstShardId = this.options.firstShardId ?? 0;
		this.options.lastShardId = this.options.lastShardId ?? this.options.totalShards - 1 ?? 1;

		this.agent = new Agent({
			totalShards: this.options.totalShards ?? this.options.gatewayBot.shards ?? 1,
			gatewayConfig: this.options.gatewayConfig,
			createShardOptions: this.options.createShardOptions,

			handleMessage: (shard: Shard, message: MessageEvent<any>) => {
				return this.options.handleDiscordPayload(shard, message);
			},

			handleIdentify: (id: number) => {
				// console.log(id % this.options.gatewayBot.sessionStartLimit.maxConcurrency, id, this.options.gatewayBot.sessionStartLimit.maxConcurrency);
				return this.buckets.get(id % this.options.gatewayBot.sessionStartLimit.maxConcurrency)!.leak.acquire(1);
			},
		});
	}

	/**
	 * @inheritDoc
	 */

	prepareBuckets() {
		for (
			let i = 0;
			i < this.options.gatewayBot.sessionStartLimit.maxConcurrency;
			++i
		) {
			this.buckets.set(i, {
				workers: [],
				leak: createLeakyBucket({
					max: 1,
					refillAmount: 1,
					refillInterval: this.options.spawnShardDelay,
				}),
			});
		}

		for (
			let shardId = this.options.firstShardId;
			shardId <= this.options.lastShardId;
			++shardId
		) {
			if (shardId >= this.agent.options.totalShards) {
				throw new Error(
					`Shard (id: ${shardId}) is bigger or equal to the used amount of used shards which is ${this.agent.options.totalShards}`
				);
			}

			const bucketId = shardId % this.options.gatewayBot.sessionStartLimit.maxConcurrency;
			const bucket = this.buckets.get(bucketId);

			if (!bucket) {
				throw new Error(
					`Shard (id: ${shardId}) got assigned to an illegal bucket id: ${bucketId}, expected a bucket id between 0 and ${
						this.options.gatewayBot.sessionStartLimit
							.maxConcurrency - 1
					}`
				);
			}

			const workerId = this.workerId(shardId);
			const worker = bucket.workers.find(w => w.id === workerId);

			if (worker) {
				worker.queue.push(shardId);
			} else {
				bucket.workers.push({ id: workerId, queue: [shardId] });
			}
		}
	}

	/**
	 * @inheritDoc
	 */

	prepareShards() {
		this.buckets.forEach((bucket, bucketId) => {
			for (const worker of bucket.workers) {
				for (const shardId of worker.queue) {
					this.workerToIdentify(worker.id, shardId, bucketId);
				}
			}
		});
	}

	/**
	 * @inheritDoc
	 */

	calculateTotalShards(): number {
		if (this.agent.options.totalShards < 100) {
			return this.agent.options.totalShards;
		}

		return (
			Math.ceil(
				this.agent.options.totalShards /
					(this.options.gatewayBot.sessionStartLimit
						.maxConcurrency === 1
						? 16
						: this.options.gatewayBot.sessionStartLimit
								.maxConcurrency)
			) * this.options.gatewayBot.sessionStartLimit.maxConcurrency
		);
	}

	/**
	 * @inheritDoc
	 */

	workerToIdentify(_workerId: number, shardId: number, _bucketId: number) {
		return this.agent.identify(shardId);
	}

	/**
	 * @inheritDoc
	 */

	workerId(shardId: number) {
		let workerId = Math.floor(shardId / this.options.shardsPerWorker);

		if (workerId >= this.options.totalWorkers) {
			workerId = this.options.totalWorkers - 1;
		}

		return workerId;
	}

	/**
	 * @inheritDoc
	 */

	shards() {
		this.prepareBuckets();

		this.prepareShards();
	}
}

export type DefaultWsOptions = Pick<
	Options,
	Exclude<keyof Options, keyof typeof DefaultWsAdapter.DEFAULTS>
> &
	Partial<Options>;

interface Options {
	/** Delay in milliseconds to wait before spawning next shard. */
	spawnShardDelay: number;

	/** The amount of shards to load per worker. */
	shardsPerWorker: number;

	/** The total amount of workers to use for your bot. */
	totalWorkers: number;

	/** Total amount of shards your bot uses. Useful for zero-downtime updates or resharding. */
	totalShards: number;

	/** Id of the first Shard which should get controlled by this manager. */
	firstShardId: number;

	/** Id of the last Shard which should get controlled by this manager. */
	lastShardId: number;

	createShardOptions?: Omit<
		ShardOptions,
		'id' | 'totalShards' | 'requestIdentify' | 'gatewayConfig'
	>;

	/** Important data which is used by the manager to connect shards to the gateway. */
	gatewayBot: GatewayBot;

	// REMOVE THIS

	gatewayConfig: PickPartial<ShardGatewayConfig, 'token'>;

	/** Sends the discord payload to another guild. */
	handleDiscordPayload: (shard: Shard, data: MessageEvent<any>) => any;
}
