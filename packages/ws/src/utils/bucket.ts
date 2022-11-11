/** Create from scratch */

import type { PickPartial } from '../types';

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

	/** @private Internal track of when the last refill of tokens was.
	 * DO NOT TOUCH THIS! Unless you know what you are doing ofc :P
	 */
	lastRefill: number;

	/** @private Internal state of whether currently it is allowed to acquire tokens.
	 * DO NOT TOUCH THIS! Unless you know what you are doing ofc :P
	 */
	allowAcquire: boolean;

	/** @private Internal number of currently available tokens.
	 * DO NOT TOUCH THIS! Unless you know what you are doing ofc :P
	 */
	tokensState: number;

	/** @private Internal array of promises necessary to guarantee no race conditions.
	 * DO NOT TOUCH THIS! Unless you know what you are doing ofc :P
	 */
	waiting: ((_?: unknown) => void)[];
}

export function delay(ms: number): Promise<void> {
  return new Promise(result =>
    setTimeout(() => {
      result();
    }, ms)
  );
}

/** Update the tokens of that bucket.
 * @returns {number} The amount of current available tokens.
 */
function updateTokens(bucket: LeakyBucket): number {
	const timePassed = performance.now() - bucket.lastRefill;
	const missedRefills = Math.floor(timePassed / bucket.refillInterval);

	// The refill shall not exceed the max amount of tokens.
	bucket.tokensState = Math.min(
		bucket.tokensState + bucket.refillAmount * missedRefills,
		bucket.max
	);
	bucket.lastRefill += bucket.refillInterval * missedRefills;

	return bucket.tokensState;
}

function nextRefill(bucket: LeakyBucket): number {
	// Since this bucket is lazy update the tokens before calculating the next refill.
	updateTokens(bucket);

	return performance.now() - bucket.lastRefill + bucket.refillInterval;
}

async function acquire(
	bucket: LeakyBucket,
	amount: number,
	highPriority = false
): Promise<void> {
	// To prevent the race condition of 2 acquires happening at once,
	// check whether its currently allowed to acquire.
	if (!bucket.allowAcquire) {
		// create, push, and wait until the current running acquiring is finished.
		await new Promise(resolve => {
			if (highPriority) {
				bucket.waiting.unshift(resolve);
			} else {
				bucket.waiting.push(resolve);
			}
		});

		// Somehow another acquire has started,
		// so need to wait again.
		if (!bucket.allowAcquire) {
			return await acquire(bucket, amount);
		}
	}

	bucket.allowAcquire = false;
	// Since the bucket is lazy update the tokens now,
	// and also get the current amount of available tokens
	const currentTokens = updateTokens(bucket);

	// It's possible that more than available tokens have been acquired,
	// so calculate the amount of milliseconds to wait until this acquire is good to go.
	if (currentTokens < amount) {
		const tokensNeeded = amount - currentTokens;
		const refillsNeeded = Math.ceil(tokensNeeded / bucket.refillAmount);

		const waitTime = bucket.refillInterval * refillsNeeded;
		await delay(waitTime);

		// Update the tokens again to ensure nothing has been missed.
		updateTokens(bucket);
	}

	// In order to not subtract too much from the tokens,
	// calculate what is actually needed to subtract.
	const toSubtract = amount % bucket.refillAmount || amount;
	bucket.tokensState -= toSubtract;

	// Allow the next acquire to happen.
	bucket.allowAcquire = true;
	// If there is an acquire waiting, let it continue.
	bucket.waiting.shift()?.();
}

export function createLeakyBucket({
	max,
	refillInterval,
	refillAmount,
	tokens,
	waiting,
	...rest
}: Omit<
	PickPartial<LeakyBucket, 'max' | 'refillInterval' | 'refillAmount'>,
	'tokens'
> & {
	/** Current tokens in the bucket.
	 * @default max
	 */
	tokens?: number;
}): LeakyBucket {
	return {
		max,
		refillInterval,
		refillAmount: refillAmount > max ? max : refillAmount,
		lastRefill: performance.now(),
		allowAcquire: true,

		nextRefill() {
			return nextRefill(this);
		},

		tokens() {
			return updateTokens(this);
		},

		async acquire(amount, highPriority) {
			return await acquire(this, amount, highPriority);
		},

		tokensState: tokens ?? max,
		waiting: waiting ?? [],

		...rest,
	};
}
