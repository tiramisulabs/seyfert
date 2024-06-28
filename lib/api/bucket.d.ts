export declare class Bucket {
    limit: number;
    remaining: number;
    reset: number;
    resetAfter: number;
    queue: {
        next: (cb: () => void, resolve: (data: any) => void, reject: (err: unknown) => void) => any;
        resolve: (data: any) => void;
        reject: (err: unknown) => void;
    }[];
    processing?: NodeJS.Timeout | boolean;
    processingResetAfter?: NodeJS.Timeout | boolean;
    last?: number;
    constructor(limit: number);
    process(override?: boolean): void;
    push(func: this['queue'][number], unshift?: boolean): void;
    triggerResetAfter(): void;
}
