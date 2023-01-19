"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShardManager = void 0;
const events_1 = require("events");
const Shard_1 = require("./Shard");
const Bucket_1 = require("./utils/Bucket");
class ShardManager extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.options = options;
        this.buckets = new Map();
        this.shards = new Map();
    }
    /** Invoke internal processing and spawns shards */
    async spawns() {
        const { gateway, workers } = this.options;
        /** Creates the necessary buckets according to concurrency */
        for (let i = 0; i < gateway.session_start_limit.max_concurrency; i++) {
            this.buckets.set(i, {
                workers: [],
                leak: (0, Bucket_1.createLeakyBucket)({
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
                }
                else {
                    bucket.workers.push({ id: workerID, queue: [i] });
                }
            }
        }
        /** Route all shards to workers */
        this.buckets.forEach(async (bucket) => {
            for (const worker of bucket.workers) {
                for (const id of worker.queue) {
                    await this.connect(id);
                }
            }
        });
    }
    async connect(id) {
        const { shards } = this.options;
        let shard = this.shards.get(id);
        if (!shard) {
            shard = new Shard_1.Shard(this, { id, timeout: shards.timeout });
            this.shards.set(id, shard);
        }
        await shard.connect();
        return shard;
    }
}
exports.ShardManager = ShardManager;
ShardManager.DEFAULTS = {
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
