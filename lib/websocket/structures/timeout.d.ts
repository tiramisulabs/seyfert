export declare class ConnectTimeout {
    intervalTime: number;
    readonly promises: ((x: boolean) => any)[];
    protected interval?: NodeJS.Timeout;
    constructor(intervalTime?: number);
    wait(): Promise<boolean>;
    shift(): void;
}
export declare class ConnectQueue {
    intervalTime: number;
    concurrency: number;
    readonly queue: {
        cb: (() => any) | undefined;
    }[];
    protected interval?: NodeJS.Timeout;
    constructor(intervalTime?: number, concurrency?: number);
    push(callback: () => any): Promise<void>;
    shift(): Promise<any>;
}
