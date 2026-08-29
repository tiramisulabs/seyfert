export class ConnectTimeout {
	readonly promises: ((x: boolean) => any)[] = [];
	protected interval?: NodeJS.Timeout = undefined;
	constructor(public intervalTime = 5000) {}

	wait() {
		return new Promise<boolean>(res => {
			if (!this.promises.length) {
				this.interval = setInterval(() => {
					this.shift();
				}, this.intervalTime);
				res(true);
			}
			this.promises.push(res);
		});
	}

	shift() {
		this.promises.shift()?.(true);
		if (!this.promises.length) {
			clearInterval(this.interval);
			this.interval = undefined;
		}
	}
}

export class ConnectQueue {
	private queue: {
		callback: () => unknown;
		resolve: (value: unknown) => void;
		reject: (reason?: unknown) => void;
	}[] = [];
	private remaining = 0;
	protected interval?: NodeJS.Timeout = undefined;

	constructor(
		public intervalTime = 5000,
		public concurrency = 1,
	) {
		this.remaining = concurrency;
	}

	push<T>(callback: () => T | PromiseLike<T>): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			const entry = { callback, reject, resolve: resolve as (value: unknown) => void };
			if (this.remaining === 0) {
				this.queue.push(entry);
				return;
			}
			this.remaining--;
			if (!this.interval) this.startInterval();
			this.run(entry);
		});
	}

	setConcurrency(concurrency: number) {
		const consumed = this.concurrency - this.remaining;
		this.concurrency = concurrency;
		this.remaining = Math.max(0, concurrency - consumed);

		while (this.remaining > 0) {
			const entry = this.queue.shift();
			if (!entry) break;
			this.remaining--;
			this.run(entry);
		}

		if (this.interval) clearInterval(this.interval);
		this.interval = undefined;
		if (this.remaining < this.concurrency || this.queue.length) this.startInterval();
	}

	private run(entry: (typeof this.queue)[number]) {
		Promise.resolve().then(entry.callback).then(entry.resolve, entry.reject);
	}

	startInterval() {
		this.interval = setInterval(() => {
			const entry = this.queue.shift();
			if (entry) {
				this.run(entry);
				return;
			}
			if (this.remaining < this.concurrency) {
				this.remaining++;
				return;
			}
			clearInterval(this.interval);
			this.interval = undefined;
		}, this.intervalTime / this.concurrency);
	}
}
