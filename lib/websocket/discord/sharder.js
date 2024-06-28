"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShardManager = void 0;
const v10_1 = require("discord-api-types/v10");
const common_1 = require("../../common");
const constants_1 = require("../constants");
const structures_1 = require("../structures");
const timeout_1 = require("../structures/timeout");
const shard_1 = require("./shard");
let parentPort;
let workerData;
class ShardManager extends Map {
    connectQueue;
    options;
    debugger;
    constructor(options) {
        super();
        this.options = (0, common_1.MergeOptions)(constants_1.ShardManagerDefaults, {
            totalShards: options.info.shards,
        }, options);
        this.connectQueue = new timeout_1.ConnectQueue(5.5e3, this.concurrency);
        if (this.options.debug) {
            this.debugger = new common_1.Logger({
                name: '[ShardManager]',
                logLevel: common_1.LogLevels.Debug,
            });
        }
        const worker_threads = (0, common_1.lazyLoadPackage)('node:worker_threads');
        if (worker_threads) {
            workerData = worker_threads.workerData;
            if (worker_threads.parentPort)
                parentPort = worker_threads.parentPort;
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
    calculateShardId(guildId) {
        return Number((BigInt(guildId) >> 22n) % BigInt(this.options.info.shards ?? 1));
    }
    spawn(shardId) {
        this.debugger?.info(`Spawn shard ${shardId}`);
        let shard = this.get(shardId);
        shard ??= new shard_1.Shard(shardId, {
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
    async spawnShards() {
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
    spawnBuckets() {
        this.debugger?.info('#0 Preparing buckets');
        const chunks = structures_1.DynamicBucket.chunk(new Array(this.shardEnd - this.shardStart), this.concurrency);
        chunks.forEach((arr, index) => {
            for (let i = 0; i < arr.length; i++) {
                const id = i + (index > 0 ? index * this.concurrency : 0) + this.shardStart;
                chunks[index][i] = this.spawn(id);
            }
        });
        this.debugger?.info(`${chunks.length} buckets created`);
        return chunks;
    }
    forceIdentify(shardId) {
        this.debugger?.info(`Shard #${shardId} force identify`);
        return this.spawn(shardId).identify();
    }
    disconnect(shardId) {
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
    setShardPresence(shardId, payload) {
        this.debugger?.info(`Shard #${shardId} update presence`);
        return this.send(shardId, {
            op: v10_1.GatewayOpcodes.PresenceUpdate,
            d: payload,
        });
    }
    setPresence(payload) {
        return new Promise(resolve => {
            this.forEach(shard => {
                this.setShardPresence(shard.id, payload);
            }, this);
            resolve();
        });
    }
    joinVoice(guild_id, channel_id, options) {
        const shardId = this.calculateShardId(guild_id);
        this.debugger?.info(`Shard #${shardId} join voice ${channel_id} in ${guild_id}`);
        return this.send(shardId, {
            op: v10_1.GatewayOpcodes.VoiceStateUpdate,
            d: {
                guild_id,
                channel_id,
                ...(0, common_1.toSnakeCase)(options),
            },
        });
    }
    leaveVoice(guild_id) {
        const shardId = this.calculateShardId(guild_id);
        this.debugger?.info(`Shard #${shardId} leave voice in ${guild_id}`);
        return this.send(shardId, {
            op: v10_1.GatewayOpcodes.VoiceStateUpdate,
            d: {
                guild_id,
                channel_id: null,
                self_mute: false,
                self_deaf: false,
            },
        });
    }
    send(shardId, payload) {
        if (workerData?.__USING_WATCHER__) {
            return parentPort?.postMessage({
                type: 'SEND_TO_SHARD',
                shardId,
                payload,
            });
        }
        this.get(shardId)?.send(false, payload);
    }
}
exports.ShardManager = ShardManager;
