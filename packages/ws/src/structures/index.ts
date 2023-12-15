import type { Logger } from '@biscuitland/common';
import { delay } from '@biscuitland/common';

export * from './timeout';

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
  logger: Logger;
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
  queue = new PriorityQueue<QueuedRequest>();

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
    this.logger = options.logger;
  }

  get remaining(): number {
    if (this.limit < this.used) {
      return 0;
    }
    return this.limit - this.used;
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
        // Check if a refill is scheduled, since we have used up all available requests
      } else if (this.refillsAt) {
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
    return await new Promise((_resolve) => {
      this.queue.push(_resolve, priority);
      // biome-ignore lint/complexity/noVoid: <explanation>
      void this.processQueue();
    });
  }

  toString() {
    return [...this.queue].toString();
  }
}

/**
 * abstract node lol
 */
export interface AbstractNode<T> {
  data: T;
  next: this | null;
}

export interface QueuePusher<T> {
  push(data: T): NonNullable<TNode<T>>;
}

export interface QueuePusherWithPriority<T> {
  push(data: T, priority: number): NonNullable<PNode<T>>;
}

export class TNode<T> implements AbstractNode<T> {
  data: T;
  next: this | null;

  constructor(data: T) {
    this.data = data;
    this.next = null;
  }

  static null<T>(list: AbstractNode<T> | null): list is null {
    return !list;
  }
}

export class PNode<T> extends TNode<T> {
  priority: number;

  constructor(data: T, priority: number) {
    super(data);
    this.priority = priority;
  }
}

export abstract class Queue<T> {
  protected abstract head: AbstractNode<T> | null;

  /**
   * O(1)
   */
  public pop() {
    if (TNode.null(this.head)) {
      throw new Error('cannot pop a list without elements');
    }

    return (this.head = this.head.next);
  }

  /**
   * O(1)
   */
  public peek(): T {
    if (TNode.null(this.head)) {
      throw new Error('cannot peek an empty list');
    }

    return this.head.data;
  }

  /**
   * O(n)
   */
  public size(): number {
    let aux = this.head;

    if (TNode.null(aux)) {
      return 0;
    }

    let count = 1;

    while (aux.next !== null) {
      count++;
      aux = aux.next;
    }

    return count;
  }

  /**
   * O(1)
   */
  public isEmpty() {
    return TNode.null(this.head);
  }

  *[Symbol.iterator](): IterableIterator<T> {
    let temp = this.head;
    while (temp !== null) {
      yield temp.data;
      temp = temp.next;
    }
  }

  public toArray(): T[] {
    return Array.from(this);
  }

  public toString() {
    return this.head?.toString() || '';
  }
}

export class LinkedList<T> extends Queue<T> implements QueuePusher<T> {
  protected head: TNode<T> | null = null;

  /**
   * O(1)
   */
  public push(data: T): NonNullable<TNode<T>> {
    const temp = new TNode<T>(data);
    temp.next = this.head;
    this.head = temp;

    return this.head;
  }
}

export class PriorityQueue<T> extends Queue<T> implements QueuePusherWithPriority<T> {
  protected head: PNode<T> | null = null;

  /**
   * O(#priorities)
   */
  public push(data: T, priority: number): NonNullable<PNode<T>> {
    let start = this.head;
    const temp = new PNode(data, priority);

    if (TNode.null(this.head) || TNode.null(start)) {
      this.head = temp;
      return this.head;
    }

    if (this.head.priority > priority) {
      temp.next = this.head;
      this.head = temp;
      return this.head;
    }

    while (start.next !== null && start.next.priority < priority) {
      start = start.next;
    }

    temp.next = start.next as PNode<T>;
    start.next = temp;

    return this.head;
  }
}

export class SequentialBucket {
  private connections: LinkedList<QueuedRequest>;
  private capacity: number; // max_concurrency
  private spawnTimeout: number;

  constructor(maxCapacity: number) {
    this.connections = new LinkedList();
    this.capacity = maxCapacity;
    this.spawnTimeout = 5000;
  }

  public async destroy() {
    this.connections = new LinkedList();
  }

  public async push(promise: QueuedRequest) {
    this.connections.push(promise);

    if (this.capacity <= this.connections.size()) {
      await this.acquire();
      await delay(this.spawnTimeout);
    }
    return;
  }

  public async acquire(promises = this.connections) {
    while (!promises.isEmpty()) {
      const item = promises.peek();
      item().catch((...args: any[]) => {
        Promise.reject(...args);
      });
      promises.pop();
    }

    return Promise.resolve(true);
  }

  public static chunk<T>(array: T[], chunks: number): T[][] {
    let index = 0;
    let resIndex = 0;
    const result = Array(Math.ceil(array.length / chunks));

    while (index < array.length) {
      result[resIndex] = array.slice(index, (index += chunks));
      resIndex++;
    }

    return result;
  }
}
