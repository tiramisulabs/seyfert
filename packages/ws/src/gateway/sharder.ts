import type { APIGatewayBotInfo } from "@biscuitland/common";
import { Collection, Logger } from "@biscuitland/common";
import { GatewayManagerDefaults, Options } from "../constants/index";
import { SequentialBucket } from "../structures/index";
import { Shard } from "./shard";
import type { GatewayManagerOptions } from "./shared";

export class GatewayManager extends Collection<number, Shard> {
  connectQueue: SequentialBucket;
  options: Required<GatewayManagerOptions>;
  logger: Logger;

  constructor(_options: GatewayManagerOptions) {
    super();
    this.options = Options<Required<GatewayManagerOptions>>(GatewayManagerDefaults, { info: { shards: _options.totalShards } }, _options);
    this.connectQueue = new SequentialBucket(this.concurrency);
    this.logger = new Logger({
      name: "[GatewayManager]",
      active: this.options.debug,
      logLevel: 0,
    });
  }

  get concurrency(): number {
    return this.options.info.session_start_limit.max_concurrency;
  }

  get remaining(): number {
    return this.options.info.session_start_limit.remaining;
  }

  /*
   * spawns buckets in order
   * https://discord.com/developers/docs/topics/gateway#sharding-max-concurrency
   */
  spawnBuckets(): Shard[][] {
    this.logger.info("Preparing buckets");
    const chunks = SequentialBucket.chunk(new Array(this.options.totalShards), this.concurrency);

    chunks.forEach((arr: any[], index: number) => {
      for (let i = 0; i < arr.length; i++) {
        const id = i + (index > 0 ? index * this.concurrency : 0);
        chunks[index][i] = this.spawn(id);
      }
    });

    return chunks;
  }

  async spawnShards(): Promise<void> {
    const buckets = this.spawnBuckets();

    this.logger.info("Spawn shards");
    for (const bucket of buckets) {
      for (const shard of bucket) {
        if (!shard) break;
        await this.connectQueue.push(shard.identify.bind(shard));
      }
    }
  }

  spawn(shardId: number) {
    let shard = this.get(shardId);

    shard ??= new Shard<true>(shardId, {
      token: this.options.token,
      intents: this.options.intents,
      info: Options<APIGatewayBotInfo>(this.options.info, { shards: this.options.totalShards }),
      handlePayload: this.options.handlePayload,
      properties: this.options.properties,
      debug: this.options.debug,
    });

    this.set(shardId, shard);

    return shard;
  }

  async forceIdentify(shardId: number) {
    await this.spawn(shardId).identify();
  }

  explode() {
    return this.forEach(($) => $.disconnect());
  }
}
