import { type GatewayDispatchPayload } from 'discord-api-types/v10';
import { Logger } from '..';
import type { Cache } from '../cache';
import { type DeepPartial, type When } from '../common';
import { EventHandler } from '../events';
import { Shard, type ShardManagerOptions } from '../websocket';
import type { WorkerShardInfo } from '../websocket/discord/worker';
import type { ManagerMessages } from '../websocket/discord/workermanager';
import type { BaseClientOptions, ServicesOptions, StartOptions } from './base';
import { BaseClient } from './base';
import type { Client, ClientOptions } from './client';
import { Collectors } from './collectors';
import { type ClientUserStructure } from './transformers';
export declare class WorkerClient<Ready extends boolean = boolean> extends BaseClient {
    private __handleGuilds?;
    logger: Logger;
    collectors: Collectors;
    events?: EventHandler | undefined;
    me: When<Ready, ClientUserStructure>;
    promises: Map<string, {
        resolve: (value: any) => void;
        timeout: NodeJS.Timeout;
    }>;
    shards: Map<number, Shard>;
    options: WorkerClientOptions;
    constructor(options?: WorkerClientOptions);
    get workerId(): number;
    get latency(): number;
    setServices({ ...rest }: ServicesOptions & {
        handlers?: ServicesOptions['handlers'] & {
            events?: EventHandler['callback'];
        };
    }): void;
    start(options?: Omit<DeepPartial<StartOptions>, 'httpConnection' | 'token' | 'connection'>): Promise<void>;
    loadEvents(dir?: string): Promise<void>;
    postMessage(body: any): boolean | void;
    protected handleManagerMessages(data: ManagerMessages): Promise<any>;
    private generateNonce;
    private generateSendPromise;
    tellWorker(workerId: number, func: (_: this) => {}): Promise<unknown>;
    protected onPacket(packet: GatewayDispatchPayload, shardId: number): Promise<void>;
}
export declare function generateShardInfo(shard: Shard): WorkerShardInfo;
interface WorkerClientOptions extends BaseClientOptions {
    disabledCache: Cache['disabledCache'];
    commands?: NonNullable<Client['options']>['commands'];
    handlePayload?: ShardManagerOptions['handlePayload'];
    gateway?: ClientOptions['gateway'];
}
export {};
