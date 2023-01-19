/// <reference types="node" />
import type { GatewaySendPayload } from 'discord-api-types/v10';
import { WebSocket } from 'ws';
import type { ShardManager } from './ShardManager';
import type { LeakyBucket } from './utils/Bucket';
export declare class Shard {
    readonly manager: ShardManager;
    readonly options: ShardOptions;
    static readonly DEFAULTS: {
        timeout: number;
    };
    private readonly decoder;
    private status;
    private lastHeartbeatAt;
    private heartbeatAck;
    private sessionID;
    private sequence;
    websocket: WebSocket | null;
    interval: number;
    heartbeatInterval: NodeJS.Timer | null;
    resolves: Map<string, (payload?: unknown) => void>;
    bucket: LeakyBucket;
    resumeURL: string | null;
    get state(): ShardStatus;
    constructor(manager: ShardManager, options: ShardOptions);
    connect(): Promise<unknown>;
    identify(): Promise<void>;
    resume(): Promise<void>;
    destroy(): void;
    disconnect(reconnect?: boolean): void;
    heartbeat(called?: boolean): void;
    send<T extends GatewaySendPayload>(payload: T, priority?: boolean): Promise<void>;
    private onMessage;
    private onClose;
    private onOpen;
    private unPack;
    private debug;
    safe(): number;
}
export interface SO {
    id: number;
    timeout: number;
}
export declare type ShardOptions = Pick<SO, Exclude<keyof SO, keyof typeof Shard.DEFAULTS>> & Partial<SO>;
export declare type ShardStatus = 'Disconnected' | 'Handshaking' | 'Connecting' | 'Heartbeating' | 'Identifying' | 'Resuming' | 'Ready';
export declare const enum ShardEvents {
    Open = 0,
    Message = 1,
    Close = 2,
    Error = 3,
    Ready = 4,
    Resumed = 5,
    Send = 6,
    Debug = 7
}
