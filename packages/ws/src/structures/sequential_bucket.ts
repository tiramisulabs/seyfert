import { delay } from "@biscuitland/common";
import type { QueuedRequest } from "./dynamic_bucket";
import { LinkedList } from "./lists";

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
