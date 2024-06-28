import { type Logger } from '../../common';
/**
 * options of the dynamic bucket
 */
export interface DynamicBucketOptions {
    limit: number;
    refillInterval: number;
    debugger?: Logger;
}
export declare class DynamicBucket {
    options: DynamicBucketOptions;
    queue: ((value?: unknown) => any)[];
    used: number;
    processing?: boolean;
    refillsAt?: number;
    timeoutId?: NodeJS.Timeout;
    constructor(options: DynamicBucketOptions);
    get remaining(): number;
    refill(): void;
    processQueue(): Promise<void>;
    acquire(force?: boolean): Promise<unknown>;
    static chunk<T>(array: T[], chunks: number): T[][];
}
