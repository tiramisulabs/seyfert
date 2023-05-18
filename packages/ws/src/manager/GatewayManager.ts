import { Options, Collection, Logger, delay } from '@biscuitland/common';
import {
  Shard,
  GatewayMemberRequest,
  BucketData,
  CreateGatewayManagerOptions,
  JoinVoiceOptions,
  GatewayManagerDefaultOptions
} from '../index';
export class GatewayManager {
  buckets = new Map<number, BucketData>();
  shards = new Map<number, Shard>();
  cache: Collection<string, GatewayMemberRequest> | null = null;
  options: Required<CreateGatewayManagerOptions>;
  logger: Logger;
  constructor(options: CreateGatewayManagerOptions) {
    this.options = Options<Required<CreateGatewayManagerOptions>>(GatewayManagerDefaultOptions, {
      ...options,
      lastShardId:
        options.lastShardId ??
        (options.totalShards ? options.totalShards - 1 : options.connection ? options.connection.shards - 1 : 0)
    });
    if (this.options.cache) this.cache = new Collection();
    this.logger = new Logger({
      name: '[GatewayManager]',
      active: options.debug
    });
  }

  calculateTotalShards(): number {
    if (this.options.totalShards < 100) {
      this.logger.info(`Calculating total shards: ${this.options.totalShards}`);
      return this.options.totalShards;
    }
    this.logger.info(
      'Calculating total shards',
      this.options.totalShards,
      this.options.connection.session_start_limit.max_concurrency
    );

    // Calculate a multiple of `maxConcurrency` which can be used to connect to the gateway.
    return (
      Math.ceil(
        this.options.totalShards /
          // If `maxConcurrency` is 1 we can safely use 16.
          (this.options.connection.session_start_limit.max_concurrency === 1
            ? 16
            : this.options.connection.session_start_limit.max_concurrency)
      ) * this.options.connection.session_start_limit.max_concurrency
    );
  }

  calculateWorekId(shardId: number): number {
    const workerId = shardId % this.options.shardsPerWorker;
    this.logger.info(
      `Calculating workerId: Shard: ${shardId} -> Worker: ${workerId} -> Per Worker: ${this.options.shardsPerWorker} -> Total: ${this.options.totalWorkers}`
    );
    return workerId;
  }

  prepareBuckets(): void {
    for (let i = 0; i < this.options.connection.session_start_limit.max_concurrency; ++i) {
      this.logger.info(`Preparing buckets for concurrency: ${i}`);
      this.buckets.set(i, { workers: [], identifyRequest: [] });
    }

    for (let shardId = this.options.firstShardId; shardId <= this.options.lastShardId; ++shardId) {
      this.logger.info(`Preparing bucket for shard: ${shardId}`);
      if (shardId >= this.options.totalShards) {
        throw new Error(
          `Shard (id: ${shardId}) is bigger or equal to the used amount of used shards which is ${this.options.totalShards}`
        );
      }

      const bucketId = shardId % this.options.connection.session_start_limit.max_concurrency;
      const bucket = this.buckets.get(bucketId);
      if (!bucket)
        throw new Error(
          `Shard (id: ${shardId}) got assigned to an illegal bucket id: ${bucketId}, expected a bucket id between 0 and ${
            this.options.connection.session_start_limit.max_concurrency - 1
          }`
        );

      const workerId = this.calculateWorekId(shardId);
      const worker = bucket.workers.find((w) => w.id === workerId);

      // IF THE QUEUE HAS SPACE JUST ADD IT TO THIS QUEUE
      worker ? worker.queue.push(shardId) : bucket.workers.push({ id: workerId, queue: [shardId] });

      for (const bucket of this.buckets.values()) {
        for (const worker of bucket.workers.values()) {
          worker.queue = worker.queue.sort();
        }
      }
    }
  }

  async spawnShards() {
    this.prepareBuckets();

    await Promise.all(
      [...this.buckets.entries()].map(async ([bucketId, bucket]) => {
        for (const worker of bucket.workers) {
          worker.queue.forEach(async (shardId) => await this.tellWorkerIdentify(worker.id, shardId, bucketId));
        }
      })
    );
  }

  async tellWorkerIdentify(...[workerId, shardId, bucketId]: number[]) {
    this.logger.info(`tell worker to identify (${workerId}, ${shardId}, ${bucketId})`);
    await this.identify(shardId);
  }

  async identify(shardId: number, bId?: number) {
    const bucketId = bId ?? shardId % this.options.connection.session_start_limit.max_concurrency;
    let shard = this.shards.get(shardId);
    this.logger.info(`identifying ${shard ? 'existing' : 'new'} shard (${shardId})`);
    if (!shard) {
      shard = new Shard({
        id: shardId,
        connection: {
          intents: this.options.intents,
          url: this.options.url,
          version: this.options.version,
          token: this.options.token,
          totalShards: this.options.totalShards,
          properties: this.options.properties
        },
        logger: this.logger,
        // @ts-ignore
        handlePayload: this.options.handlePayload,
        requestIdentify: async () => await this.identify(shardId),
        shardIsReady: async () => {
          this.logger.info(`<Shard> Shard #${shardId} is ready`);
          await delay(this.options.spawnShardDelay);
          this.logger.info('<Shard> Resolving shard identify request');
          this.buckets.get(bucketId)?.identifyRequest.shift()?.();
        }
      });

      this.shards.set(shardId, shard);
    }

    const bucket = this.buckets.get(bucketId);
    if (!bucket) return;

    return new Promise<void>((resolve) => {
      // Mark that we are making an identify request so another is not made.
      bucket.identifyRequest.push(resolve);
      this.logger.info(`identifiying shard #${shardId}`);
      shard!.identify();
    });
  }

  async shutdown(code: number, reason: string) {
    this.shards.forEach((shard) => shard.close(code, reason));
    await delay(5000);
  }

  async kill(shardId: number) {
    const shard = this.shards.get(shardId);
    if (!shard) {
      this.logger.info(`kill shard but not found ${shardId}`);
      return;
    }
    this.logger.info(`kill shard ${shardId}`);
    this.shards.delete(shardId);
    await shard.shutdown();
  }

  calculateShardId(guildId: string, totalShards = this.options.totalShards) {
    if (totalShards === 1) {
      return 0;
    }

    this.logger.info(`calculateShardId (guildId: ${guildId}, totalShards: ${totalShards})`);
    return Number((BigInt(guildId) >> 22n) % BigInt(totalShards));
  }

  async joinVoice(options: JoinVoiceOptions) {
    const shardId = this.calculateShardId(options.guild_id);
    const shard = this.shards.get(shardId);
    if (!shard) throw new Error(`Shard #${shardId}`);

    this.logger.info(`joinVoice guildId ${options.guild_id} channelId ${options.channel_id}`);
    shard.joinVoiceChannel(options);
  }
}
