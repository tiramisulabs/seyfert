/** Create from scratch */
import type { PickPartial } from '@biscuitland/common';
export interface LeakyBucket {
    /** How many tokens this bucket can hold. */
    max: number;
    /** Amount of tokens gained per interval */
    refillAmount: number;
    /** Interval at which the bucket gains tokens. */
    refillInterval: number;
    /** Acquire tokens from the bucket. */
    acquire(amount: number, highPriority?: boolean): Promise<void>;
    /** Returns the number of milliseconds until the next refill. */
    nextRefill(): number;
    /** Current tokens in the bucket. */
    tokens(): number;
    /**
     * @private Internal track of when the last refill of tokens was.
     * DO NOT TOUCH THIS! Unless you know what you are doing ofc :P
     */
    lastRefill: number;
    /**
     * @private Internal state of whether currently it is allowed to acquire tokens.
     * DO NOT TOUCH THIS! Unless you know what you are doing ofc :P
     */
    allowAcquire: boolean;
    /**
     * @private Internal number of currently available tokens.
     * DO NOT TOUCH THIS! Unless you know what you are doing ofc :P
     */
    tokensState: number;
    /**
     * @private Internal array of promises necessary to guarantee no race conditions.
     * DO NOT TOUCH THIS! Unless you know what you are doing ofc :P
     */
    waiting: ((_?: unknown) => void)[];
}
export declare function delay(ms: number): Promise<void>;
export declare function createLeakyBucket({ max, refillInterval, refillAmount, tokens, waiting, ...rest }: Omit<PickPartial<LeakyBucket, 'max' | 'refillInterval' | 'refillAmount'>, 'tokens'> & {
    /** Current tokens in the bucket.
     * @default max
     */
    tokens?: number;
}): LeakyBucket;
