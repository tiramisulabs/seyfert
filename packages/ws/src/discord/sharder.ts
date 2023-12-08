import {
  APIGatewayBotInfo,
  Collection,
  GatewayOpcodes,
  GatewayUpdatePresence,
  GatewayVoiceStateUpdate,
  LogLevels,
  Logger,
  ObjectToLower,
  Options,
  toSnakeCase,
} from "@biscuitland/common";
import { ShardManagerDefaults } from "../constants";
import { SequentialBucket } from "../structures";
import { Shard } from "./shard.js";
import { ShardManagerOptions } from "./shared";

export class ShardManager extends Collection<number, Shard> {
  connectQueue: SequentialBucket;
  options: Required<ShardManagerOptions>;
  logger: Logger;

  constructor(options: ShardManagerOptions) {
    super();
    this.options = Options<Required<ShardManagerOptions>>(ShardManagerDefaults, options, { info: { shards: options.totalShards } });

    this.connectQueue = new SequentialBucket(this.concurrency);

    this.logger = new Logger({
      active: this.options.debug,
      name: "[ShardManager]",
      logLevel: LogLevels.Debug,
    });
  }

  get remaining(): number {
    return this.options.info.session_start_limit.remaining;
  }

  get concurrency(): number {
    return this.options.info.session_start_limit.max_concurrency;
  }

  calculeShardId(guildId: string) {
    return Number((BigInt(guildId) >> 22n) % BigInt(this.options.totalShards));
  }

  spawn(shardId: number) {
    this.logger.info(`Spawn shard ${shardId}`);
    let shard = this.get(shardId);

    shard ??= new Shard(shardId, {
      token: this.options.token,
      intents: this.options.intents,
      info: Options<APIGatewayBotInfo>(this.options.info, { shards: this.options.totalShards }),
      handlePayload: this.options.handlePayload,
      properties: this.options.properties,
      logger: this.logger,
      compress: false,
    });

    this.set(shardId, shard);

    return shard;
  }

  async spawnShards(): Promise<void> {
    const buckets = this.spawnBuckets();

    this.logger.info("Spawn shards");
    for (const bucket of buckets) {
      for (const shard of bucket) {
        if (!shard) break;
        this.logger.info(`${shard.id} add to connect queue`);
        await this.connectQueue.push(shard.connect.bind(shard));
      }
    }
  }

  /*
   * spawns buckets in order
   * https://discord.com/developers/docs/topics/gateway#sharding-max-concurrency
   */
  spawnBuckets(): Shard[][] {
    this.logger.info("Preparing buckets");
    const chunks = SequentialBucket.chunk(new Array(this.options.totalShards), this.concurrency);

    // biome-ignore lint/complexity/noForEach: i mean is the same thing, but we need the index;
    chunks.forEach((arr: any[], index: number) => {
      for (let i = 0; i < arr.length; i++) {
        const id = i + (index > 0 ? index * this.concurrency : 0);
        chunks[index][i] = this.spawn(id);
      }
    });
    this.logger.info(`${chunks.length} buckets created`);
    return chunks;
  }

  forceIdentify(shardId: number) {
    this.logger.info(`Shard #${shardId} force identify`);
    return this.spawn(shardId).identify();
  }

  disconnect(shardId: number) {
    this.logger.info(`Force disconnect shard ${shardId}`);
    return this.get(shardId)?.disconnect();
  }

  disconnectAll() {
    this.logger.info("Disconnect all shards");
    return new Promise((resolve) => {
      // biome-ignore lint/complexity/noForEach: In maps, for each and for of have same performance
      this.forEach((shard) => shard.disconnect());
      resolve(null);
    });
  }

  setShardPresence(shardId: number, payload: GatewayUpdatePresence["d"]) {
    this.logger.info(`Shard #${shardId} update presence`);
    return this.get(shardId)?.send<GatewayUpdatePresence>(1, {
      op: GatewayOpcodes.PresenceUpdate,
      d: payload,
    });
  }
  setPresence(payload: GatewayUpdatePresence["d"]): Promise<void> | undefined {
    return new Promise((resolve) => {
      // biome-ignore lint/complexity/noForEach: In maps, for each and for of have same performance
      this.forEach((shard) => {
        this.setShardPresence(shard.id, payload);
      }, this);
      resolve();
    });
  }

  joinVoice(guild_id: string, channel_id: string, options: ObjectToLower<Pick<GatewayVoiceStateUpdate["d"], "self_deaf" | "self_mute">>) {
    const shardId = this.calculeShardId(guild_id);
    this.logger.info(`Shard #${shardId} join voice ${channel_id} in ${guild_id}`);

    return this.get(shardId)?.send<GatewayVoiceStateUpdate>(1, {
      op: GatewayOpcodes.VoiceStateUpdate,
      d: {
        guild_id,
        channel_id,
        ...toSnakeCase(options),
      },
    });
  }

  leaveVoice(guild_id: string) {
    const shardId = this.calculeShardId(guild_id);
    this.logger.info(`Shard #${shardId} leave voice in ${guild_id}`);

    return this.get(shardId)?.send<GatewayVoiceStateUpdate>(1, {
      op: GatewayOpcodes.VoiceStateUpdate,
      d: {
        guild_id,
        channel_id: null,
        self_mute: false,
        self_deaf: false,
      },
    });
  }
}
