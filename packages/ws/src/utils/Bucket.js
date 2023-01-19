"use strict";
/** Create from scratch */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLeakyBucket = exports.delay = void 0;
function delay(ms) {
    return new Promise(result => setTimeout(() => {
        result();
    }, ms));
}
exports.delay = delay;
/** Update the tokens of that bucket.
 * @returns {number} The amount of current available tokens.
 */
function updateTokens(bucket) {
    const timePassed = performance.now() - bucket.lastRefill;
    const missedRefills = Math.floor(timePassed / bucket.refillInterval);
    // The refill shall not exceed the max amount of tokens.
    bucket.tokensState = Math.min(bucket.tokensState + bucket.refillAmount * missedRefills, bucket.max);
    bucket.lastRefill += bucket.refillInterval * missedRefills;
    return bucket.tokensState;
}
function nextRefill(bucket) {
    // Since this bucket is lazy update the tokens before calculating the next refill.
    updateTokens(bucket);
    return performance.now() - bucket.lastRefill + bucket.refillInterval;
}
async function acquire(bucket, amount, highPriority = false) {
    // To prevent the race condition of 2 acquires happening at once,
    // check whether its currently allowed to acquire.
    if (!bucket.allowAcquire) {
        // create, push, and wait until the current running acquiring is finished.
        await new Promise(resolve => {
            if (highPriority) {
                bucket.waiting.unshift(resolve);
            }
            else {
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
function createLeakyBucket({ max, refillInterval, refillAmount, tokens, waiting, ...rest }) {
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
exports.createLeakyBucket = createLeakyBucket;
