import type { GatewayDispatchPayload, GatewaySendPayload } from 'discord-api-types/v10';
import { ApiHandler } from '../../api';
import { ShardManager, type ShardManagerDefaults, type ShardManagerOptions } from '../../websocket';
import { Logger } from '../it/logger';
import type { MakePartial, MakeRequired } from '../types/util';
/**
 * Represents a watcher class that extends the ShardManager.
 */
export declare class Watcher extends ShardManager {
    worker?: import('node:worker_threads').Worker;
    logger: Logger;
    rest?: ApiHandler;
    options: MakeRequired<WatcherOptions, 'token' | 'info' | keyof typeof ShardManagerDefaults>;
    /**
     * Initializes a new instance of the Watcher class.
     * @param options The options for the watcher.
     */
    constructor(options: WatcherOptions);
    /**
     * Resets the worker instance.
     */
    resetWorker(): void;
    /**
     * Spawns shards for the watcher.
     */
    spawnShards(): Promise<void>;
    /**
     * Builds the watcher.
     */
    protected build(): void;
}
export interface WatcherOptions extends MakePartial<Omit<ShardManager['options'], 'handlePayload' | 'info' | 'token' | 'intents'>, 'compress' | 'presence' | 'properties' | 'shardEnd' | 'shardStart' | 'spawnShardDelay' | 'totalShards' | 'url' | 'version'> {
    filePath: string;
    transpileCommand: string;
    srcPath: string;
    argv?: string[];
    handlePayload?: ShardManagerOptions['handlePayload'];
    info?: ShardManagerOptions['info'];
    token?: ShardManagerOptions['token'];
    intents?: ShardManagerOptions['intents'];
}
export interface WatcherPayload {
    type: 'PAYLOAD';
    shardId: number;
    payload: GatewayDispatchPayload;
}
export interface WatcherSendToShard {
    type: 'SEND_TO_SHARD';
    shardId: number;
    payload: GatewaySendPayload;
}
