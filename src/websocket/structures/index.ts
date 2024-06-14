import { delay, type Logger } from '../../common';

/**
 * options of the dynamic bucket
 */
export interface DynamicBucketOptions {
	limit: number;
	refillInterval: number;
	debugger?: Logger;
}

export class DynamicBucket {
	queue: ((value?: unknown) => any)[] = [];
	used = 0;
	processing?: boolean;
	refillsAt?: number;
	timeoutId?: NodeJS.Timeout;

	constructor(public options: DynamicBucketOptions) {}

	get remaining(): number {
		if (this.options.limit < this.used) {
			return 0;
		}
		return this.options.limit - this.used;
	}

	refill() {
		this.refillsAt = undefined;
		if (this.timeoutId) {
			clearTimeout(this.timeoutId);
			this.timeoutId = undefined;
		}
		if (this.used > 0) {
			this.used = 0;
			this.timeoutId = setTimeout(() => {
				this.refill();
			}, this.options.refillInterval);
			this.refillsAt = Date.now() + this.options.refillInterval;
		}
	}

	async processQueue() {
		if (this.processing) return;
		this.processing = true;
		while (this.queue.length) {
			if (this.remaining) {
				this.options.debugger?.debug(`Processing queue. Remaining: ${this.remaining} Length: ${this.queue.length}`);
				this.queue.shift()!();
				this.used++;
				if (!this.timeoutId) {
					this.timeoutId = setTimeout(() => {
						this.refill();
					}, this.options.refillInterval);
					this.refillsAt = Date.now() + this.options.refillInterval;
				}
			} else if (this.refillsAt) {
				const now = Date.now();
				if (this.refillsAt > now) {
					this.options.debugger?.info(`Waiting ${this.refillsAt - now}ms to process queue`);
					await delay(this.refillsAt - now);
					this.used = 0;
				}
			}
		}
		this.processing = false;
	}

	acquire(force = false) {
		return new Promise(res => {
			this.queue[force ? 'unshift' : 'push'](res);
			void this.processQueue();
		});
	}

	static chunk<T>(array: T[], chunks: number): T[][] {
		let index = 0;
		let resIndex = 0;
		const result = new Array<T[]>(Math.ceil(array.length / chunks));

		while (index < array.length) {
			result[resIndex] = array.slice(index, (index += chunks));
			resIndex++;
		}

		return result;
	}
}
