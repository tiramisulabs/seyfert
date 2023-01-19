/// <reference types="node" />
import { EventEmitter } from 'events';
import { Shard } from './Shard';
import type { LeakyBucket } from './utils/Bucket';
import type { APIGatewayBotInfo, GatewayIntentBits, GatewayIdentifyProperties } from 'discord-api-types/v10';
export declare class ShardManager extends EventEmitter {
    options: SMO;
    static readonly DEFAULTS: {
        workers: {
            shards: number;
            amount: number;
            delay: number;
        };
        shards: {
            timeout: number;
            delay: number;
        };
    };
    readonly buckets: Map<number, {
        workers: {
            id: number;
            queue: number[];
        }[];
        leak: LeakyBucket;
    }>;
    readonly shards: Map<number, Shard>;
    constructor(options: SMO);
    /** Invoke internal processing and spawns shards */
    spawns(): Promise<void>;
    private connect;
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
export declare type ShardManagerOptions = Pick<SMO, Exclude<keyof SMO, keyof typeof ShardManager.DEFAULTS>> & Partial<SMO>;
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
