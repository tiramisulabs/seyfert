import { Logger, delay } from "@biscuitland/common";
import { PriorityQueue } from "./lists";

/**
 * just any kind of request to queue and resolve later
 */
export type QueuedRequest = (value: void | Promise<void>) => Promise<unknown> | any;

/**
 * options of the dynamic bucket
 */
export interface DynamicBucketOptions {
  limit: number;
  refillInterval: number;
  refillAmount: number;
  debug?: boolean;
}

/**
 * generally useless for interaction based bots
 * ideally this would only be triggered on certain paths
 * example: a huge amount of messages being spammed
 *
 * a dynamic bucket is just a priority queue implemented using linked lists
 * we create an empty bucket for every path
 * dynamically allocating memory improves the final memory footprint
 */
export class DynamicBucket {
  limit: number;
  refillInterval: number;
  refillAmount: number;

  /** The queue of requests to acquire an available request. Mapped by <shardId, resolve()> */
  queue: PriorityQueue<QueuedRequest> = new PriorityQueue();

  /** The amount of requests that have been used up already. */
  used = 0;

  /** Whether or not the queue is already processing. */
  processing = false;

  /** The timeout id for the timer to reduce the used amount by the refill amount.  */
  timeoutId?: NodeJS.Timeout;

  /** The timestamp in milliseconds when the next refill is scheduled. */
  refillsAt?: number;

  logger: Logger;

  constructor(options: DynamicBucketOptions) {
    this.limit = options.limit;
    this.refillInterval = options.refillInterval;
    this.refillAmount = options.refillAmount;
    this.logger = new Logger({
      name: "[Gateway]",
      active: options.debug,
      logLevel: 0,
    });
  }

  get remaining(): number {
    if (this.limit < this.used) return 0;
    else return this.limit - this.used;
  }

  refill(): void {
    // Lower the used amount by the refill amount
    this.used = this.refillAmount > this.used ? 0 : this.used - this.refillAmount;

    // Reset the refillsAt timestamp since it just got refilled
    this.refillsAt = undefined;

    if (this.used > 0) {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      this.timeoutId = setTimeout(() => {
        this.refill();
      }, this.refillInterval);
      this.refillsAt = Date.now() + this.refillInterval;
    }
  }

  /** Begin processing the queue. */
  async processQueue(): Promise<void> {
    // There is already a queue that is processing
    if (this.processing) {
      return;
    }

    // Begin going through the queue.
    while (!this.queue.isEmpty()) {
      if (this.remaining) {
        this.logger.debug(`Processing queue. Remaining: ${this.remaining} Length: ${this.queue.size()}`);
        // Resolves the promise allowing the paused execution of this request to resolve and continue.
        this.queue.peek()();
        this.queue.pop();

        // A request can be made
        this.used++;

        // Create a new timeout for this request if none exists.
        if (!this.timeoutId) {
          this.timeoutId = setTimeout(() => {
            this.refill();
          }, this.refillInterval);

          // Set the time for when this refill will occur.
          this.refillsAt = Date.now() + this.refillInterval;
        }
      }

      // Check if a refill is scheduled, since we have used up all available requests
      else if (this.refillsAt) {
        const now = Date.now();
        // If there is time left until next refill, just delay execution.
        if (this.refillsAt > now) {
          await delay(this.refillsAt - now);
        }
      }
    }

    // Loop has ended mark false so it can restart later when needed
    this.processing = false;
  }

  /** Pauses the execution until the request is available to be made. */
  async acquire(priority: number): Promise<void> {
    return await new Promise((resolve) => {
      this.queue.push(resolve, priority);
      void this.processQueue();
    });
  }

  toString() {
    return [...this.queue].toString();
  }
}
