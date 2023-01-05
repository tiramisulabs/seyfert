import { EventEmitter } from 'events';
import { Shard } from './Shard';
import type { LeakyBucket } from './utils/Bucket';
import { createLeakyBucket } from './utils/Bucket';
import type {
	APIGatewayBotInfo,
	GatewayIntentBits,
	GatewayIdentifyProperties,
} from 'discord-api-types/v10';

export class ShardManager extends EventEmitter {
	static readonly DEFAULTS = {
		workers: {
			shards: 25,
			amount: 5,
			delay: 5000,
		},
		shards: {
			timeout: 15000,
			delay: 5000,
		},
	};

	readonly buckets = new Map<
		number,
		{
			workers: { id: number; queue: number[] }[];
			leak: LeakyBucket;
		}
	>();

	readonly shards = new Map<number, Shard>();

	constructor(public options: SMO) {
		super();
	}

	/** Invoke internal processing and spawns shards */
	async spawns(): Promise<void> {
		const { gateway, workers } = this.options;

		/** Creates the necessary buckets according to concurrency */
		for (let i = 0; i < gateway.session_start_limit.max_concurrency; i++) {
			this.buckets.set(i, {
				workers: [],
				leak: createLeakyBucket({
					max: 1,
					refillAmount: 1,
					refillInterval: workers.delay,
				}),
			});
		}

		/** Create the start sequence of the shards inside the buckets. */
		for (let i = 0; i < gateway.shards; i++) {
			const bucketID = i % gateway.session_start_limit.max_concurrency;
			const bucket = this.buckets.get(bucketID);

			if (bucket) {
				const workerID = Math.floor(i / workers.shards);
				const worker = bucket.workers.find(w => w.id === workerID);

				if (worker) {
					worker.queue.push(i);
				} else {
					bucket.workers.push({ id: workerID, queue: [i] });
				}
			}
		}

		/** Route all shards to workers */
		this.buckets.forEach(async bucket => {
			for (const worker of bucket.workers) {

				for (const id of worker.queue) {
					await this.connect(id);
				}

			}
		});
	}

	private async connect(id: number): Promise<Shard> {
		const { shards } = this.options;

		let shard = this.shards.get(id);

		if (!shard) {
			shard = new Shard(this, { id, timeout: shards.timeout });

			this.shards.set(id, shard);
		}

		await shard.connect();

		return shard;
	}
}

export interface SMO {
	token: string;
	gateway: APIGatewayBotInfo;
	workers: ShardManagerWorkersOptions;
	shards: ShardManagerShardsOptions;
	intents: GatewayIntentBits;
	largeThreshold?: number;
	properties: GatewayIdentifyProperties;
}

export type ShardManagerOptions = Pick<SMO, Exclude<keyof SMO, keyof typeof ShardManager.DEFAULTS>> & Partial<SMO>;

export interface ShardManagerWorkersOptions {
	/**
	 * Number of shards per worker
	 * @default 25
	 */
	shards: number;

	/**
	 * Number of workers
	 * @default 5
	 */
	amount: number;

	/**
	 * Waiting time between workers
	 * @default 5000
	 */
	delay: number;
}

export interface ShardManagerShardsOptions {
	/**
	 * Waiting time to receive the ready event.
	 * @default 15000
	 */
	timeout: number;

	/**
	 * Waiting time between shards
	 * @default 5000
	 */
	delay: number;
}

