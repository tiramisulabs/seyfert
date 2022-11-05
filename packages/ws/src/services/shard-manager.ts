import type { ShardManagerOptions, SMO } from '../types';
import type { LeakyBucket } from '../utils/bucket';

import { Shard } from './shard';

import { createLeakyBucket } from '../utils/bucket';
import { Options } from '../utils/options';

export class ShardManager {
	static readonly DEFAULTS = {
		workers: {
			shards: 25,
			amount: 5,
			delay: 5000
		},

		shards: {
			timeout: 15000,
			delay: 5000
		}
	};

	readonly options: SMO;

	readonly buckets = new Map<
		number,
		{
			workers: { id: number; queue: number[] }[];
			leak: LeakyBucket;
		}
	>();

	readonly shards = new Map<number, Shard>();

	constructor(options: ShardManagerOptions) {
		this.options = Options(ShardManager.DEFAULTS, options);
	}

	/** Invokes internal processing and respawns shards */
	async respawns(): Promise<void> {
		//
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

	/** Invokes the bucket to prepare the connection to the shard */
	private async connect(id: number): Promise<Shard> {
		const { gateway } = this.options;

		let shard = this.shards.get(id);

		if (!shard) {
			shard = new Shard({
				id,

				gateway: this.options.gateway,

				shards: this.options.shards,

				config: this.options.config,

				handlePayloads: async (shard, payload) => {
					await this.options.handleDiscordPayload(shard, payload); // remove await?
				},

				handleIdentify: async (id: number) => {
					await this.buckets.get(id % gateway.session_start_limit.max_concurrency)!.leak.acquire(1); // remove await?
				}
			});

			this.shards.set(id, shard);
		}

		await shard.connect();

		return shard;
	}
}
