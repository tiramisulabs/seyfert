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
	private queue: ((() => unknown) | undefined)[] = [];
	private remaining = 0;
	protected interval?: NodeJS.Timeout = undefined;

	constructor(
		public intervalTime = 5000,
		public concurrency = 1,
	) {
		this.remaining = concurrency;
	}

	push(callback: () => unknown) {
		if (this.remaining === 0) return this.queue.push(callback);
		this.remaining--;
		if (!this.interval) {
			this.startInterval();
		}

		if (this.queue.length < this.concurrency) {
			return callback();
		}
		return this.queue.push(callback);
	}

	startInterval() {
		this.interval = setInterval(() => {
			let cb: (() => void) | undefined;
			while (this.queue.length && !(cb = this.queue.shift())) {
				//
			}
			if (cb) return cb?.();
			if (this.remaining < this.concurrency) return this.remaining++;
			if (!this.queue.length) {
				clearInterval(this.interval);
				this.interval = undefined;
			}
		}, this.intervalTime / this.concurrency);
	}
}
