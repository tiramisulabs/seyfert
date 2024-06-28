import type { GatewayReceivePayload, GatewaySendPayload } from 'discord-api-types/v10';
import type WS from 'ws';
import { type CloseEvent } from 'ws';
import { type MakeRequired, type Logger } from '../../common';
import { DynamicBucket } from '../structures';
import { ConnectTimeout } from '../structures/timeout';
import { BaseSocket } from './basesocket';
import type { ShardData, ShardOptions } from './shared';
export interface ShardHeart {
    interval: number;
    nodeInterval?: NodeJS.Timeout;
    lastAck?: number;
    lastBeat?: number;
    ack: boolean;
}
export declare class Shard {
    id: number;
    debugger?: Logger;
    data: Partial<ShardData> | ShardData;
    websocket: BaseSocket | null;
    connectTimeout: ConnectTimeout;
    heart: ShardHeart;
    bucket: DynamicBucket;
    offlineSendQueue: ((_?: unknown) => void)[];
    options: MakeRequired<ShardOptions, 'properties' | 'ratelimitOptions'>;
    constructor(id: number, options: ShardOptions);
    get latency(): number;
    get isOpen(): boolean;
    get gatewayURL(): string;
    get resumeGatewayURL(): string | undefined;
    get currentGatewayURL(): string;
    ping(): Promise<number>;
    connect(): Promise<void>;
    send<T extends GatewaySendPayload = GatewaySendPayload>(force: boolean, message: T): Promise<void>;
    identify(): Promise<void>;
    get resumable(): boolean;
    resume(): Promise<void>;
    heartbeat(requested: boolean): Promise<void>;
    disconnect(): Promise<void>;
    reconnect(): Promise<void>;
    onpacket(packet: GatewayReceivePayload): Promise<void>;
    protected handleClosed(close: CloseEvent): Promise<void>;
    close(code: number, reason: string): Promise<void>;
    protected handleMessage({ data }: WS.MessageEvent): Promise<void>;
    checkOffline(force: boolean): Promise<unknown>;
    calculateSafeRequests(): number;
}
