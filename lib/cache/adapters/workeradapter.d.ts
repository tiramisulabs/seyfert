import type { WorkerData } from '../../websocket';
import type { WorkerSendCacheRequest } from '../../websocket/discord/worker';
import type { Adapter } from './types';
export declare class WorkerAdapter implements Adapter {
    workerData: WorkerData;
    isAsync: boolean;
    promises: Map<string, {
        resolve: (value: unknown) => void;
        timeout: NodeJS.Timeout;
    }>;
    constructor(workerData: WorkerData);
    postMessage(body: any): boolean | void;
    protected send(method: WorkerSendCacheRequest['method'], ...args: any[]): Promise<any>;
    scan(...rest: any[]): Promise<any>;
    bulkGet(...rest: any[]): Promise<any>;
    get(...rest: any[]): Promise<any>;
    bulkSet(...rest: any[]): Promise<any>;
    set(...rest: any[]): Promise<any>;
    bulkPatch(...rest: any[]): Promise<any>;
    patch(...rest: any[]): Promise<any>;
    values(...rest: any[]): Promise<any>;
    keys(...rest: any[]): Promise<any>;
    count(...rest: any[]): Promise<any>;
    bulkRemove(...rest: any[]): Promise<any>;
    remove(...rest: any[]): Promise<any>;
    flush(): Promise<any>;
    contains(...rest: any[]): Promise<any>;
    getToRelationship(...rest: any[]): Promise<any>;
    bulkAddToRelationShip(...rest: any[]): Promise<any>;
    addToRelationship(...rest: any[]): Promise<any>;
    removeToRelationship(...rest: any[]): Promise<any>;
    removeRelationship(...rest: any[]): Promise<any>;
}
