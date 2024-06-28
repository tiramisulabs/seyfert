"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.properties = exports.WorkerManagerDefaults = exports.ShardManagerDefaults = exports.COMPRESS = void 0;
const COMPRESS = false;
exports.COMPRESS = COMPRESS;
const properties = {
    os: process.platform,
    browser: 'Seyfert',
    device: 'Seyfert',
};
exports.properties = properties;
const ShardManagerDefaults = {
    totalShards: 1,
    spawnShardDelay: 5300,
    debug: false,
    intents: 0,
    properties,
    version: 10,
    shardStart: 0,
    handlePayload: (shardId, packet) => {
        console.info(`Packet ${packet.t} on shard ${shardId}`);
    },
};
exports.ShardManagerDefaults = ShardManagerDefaults;
const WorkerManagerDefaults = {
    ...ShardManagerDefaults,
    shardsPerWorker: 32,
    handlePayload: (_shardId, _workerId, _packet) => { },
};
exports.WorkerManagerDefaults = WorkerManagerDefaults;
