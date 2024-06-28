import type { GatewayPresenceUpdateData, GatewaySendPayload } from 'discord-api-types/v10';
import { type Worker as ClusterWorker } from 'node:cluster';
import { ApiHandler, Logger } from '../..';
import { type Adapter } from '../../cache';
import { type MakePartial } from '../../common';
import { ConnectQueue } from '../structures/timeout';
import { MemberUpdateHandler } from './events/memberUpdate';
import { PresenceUpdateHandler } from './events/presenceUpdate';
import type { ShardOptions, WorkerData, WorkerManagerOptions } from './shared';
import type { WorkerInfo, WorkerMessage, WorkerShardInfo } from './worker';
export declare class WorkerManager extends Map<number, (ClusterWorker | import('node:worker_threads').Worker) & {
    ready?: boolean;
}> {
    options: Required<WorkerManagerOptions>;
    debugger?: Logger;
    connectQueue: ConnectQueue;
    cacheAdapter: Adapter;
    promises: Map<string, {
        resolve: (value: any) => void;
        timeout: NodeJS.Timeout;
    }>;
    memberUpdateHandler: MemberUpdateHandler;
    presenceUpdateHandler: PresenceUpdateHandler;
    rest: ApiHandler;
    constructor(options: MakePartial<WorkerManagerOptions, 'token' | 'intents' | 'info' | 'handlePayload'>);
    setCache(adapter: Adapter): void;
    setRest(rest: ApiHandler): void;
    get remaining(): number;
    get concurrency(): number;
    get totalWorkers(): number;
    get totalShards(): number;
    get shardStart(): number;
    get shardEnd(): number;
    get shardsPerWorker(): number;
    get workers(): number;
    syncLatency({ shardId, workerId }: {
        shardId?: number;
        workerId?: number;
    }): Promise<number | undefined>;
    calculateShardId(guildId: string): number;
    calculateWorkerId(shardId: number): number;
    prepareSpaces(): number[][];
    postMessage(id: number, body: any): void;
    prepareWorkers(shards: number[][]): Promise<void>;
    createWorker(workerData: WorkerData): ClusterWorker | import("worker_threads").Worker;
    spawn(workerId: number, shardId: number): void;
    handleWorkerMessage(message: WorkerMessage): Promise<void>;
    private generateNonce;
    private generateSendPromise;
    send(data: GatewaySendPayload, shardId: number): Promise<true>;
    getShardInfo(shardId: number): Promise<WorkerShardInfo>;
    getWorkerInfo(workerId: number): Promise<WorkerInfo>;
    start(): Promise<void>;
}
type CreateManagerMessage<T extends string, D extends object = {}> = {
    type: T;
} & D;
export type ManagerAllowConnect = CreateManagerMessage<'ALLOW_CONNECT', {
    shardId: number;
    presence: GatewayPresenceUpdateData;
}>;
export type ManagerSpawnShards = CreateManagerMessage<'SPAWN_SHARDS', Pick<ShardOptions, 'info' | 'properties' | 'compress'>>;
export type ManagerSendPayload = CreateManagerMessage<'SEND_PAYLOAD', GatewaySendPayload & {
    shardId: number;
    nonce: string;
}>;
export type ManagerRequestShardInfo = CreateManagerMessage<'SHARD_INFO', {
    nonce: string;
    shardId: number;
}>;
export type ManagerRequestWorkerInfo = CreateManagerMessage<'WORKER_INFO', {
    nonce: string;
}>;
export type ManagerSendCacheResult = CreateManagerMessage<'CACHE_RESULT', {
    nonce: string;
    result: any;
}>;
export type ManagerSendBotReady = CreateManagerMessage<'BOT_READY'>;
export type ManagerSendApiResponse = CreateManagerMessage<'API_RESPONSE', {
    response: any;
    error?: any;
    nonce: string;
}>;
export type ManagerExecuteEval = CreateManagerMessage<'EXECUTE_EVAL', {
    func: string;
    nonce: string;
    toWorkerId: number;
}>;
export type ManagerSendEvalResponse = CreateManagerMessage<'EVAL_RESPONSE', {
    response: any;
    nonce: string;
}>;
export type ManagerMessages = ManagerAllowConnect | ManagerSpawnShards | ManagerSendPayload | ManagerRequestShardInfo | ManagerRequestWorkerInfo | ManagerSendCacheResult | ManagerSendBotReady | ManagerSendApiResponse | ManagerSendEvalResponse | ManagerExecuteEval;
export {};
