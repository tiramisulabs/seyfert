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
	private _concurrency: number;
	private remaining = 0;
	private lastTickAt?: number;
	protected interval?: NodeJS.Timeout = undefined;

	constructor(
		public intervalTime = 5000,
		concurrency = 1,
	) {
		this._concurrency = concurrency;
		this.remaining = concurrency;
	}

	get concurrency() {
		return this._concurrency;
	}

	set concurrency(concurrency: number) {
		if (concurrency === this._concurrency) return;
		const consumed = this._concurrency - this.remaining;
		this._concurrency = concurrency;
		this.remaining = concurrency - consumed;

		while (this.remaining > 0) {
			const callback = this.queue.shift();
			if (!callback) break;
			this.remaining--;
			callback();
		}

		if (this.interval) clearTimeout(this.interval);
		this.interval = undefined;
		if (this.remaining < this._concurrency || this.queue.length) this.startInterval();
		else this.lastTickAt = undefined;
	}

	push(callback: () => unknown) {
		if (this.remaining <= 0) return this.queue.push(callback);
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
		this.lastTickAt ??= Date.now();
		const delay = Math.max(0, this.lastTickAt + this.intervalTime / this.concurrency - Date.now());
		this.interval = setTimeout(() => {
			this.lastTickAt = Date.now();
			this.interval = undefined;
			if (this.remaining < 0) {
				this.remaining++;
				this.startInterval();
				return;
			}
			let cb: (() => void) | undefined;
			while (this.queue.length && !(cb = this.queue.shift())) {
				//
			}
			if (cb) {
				this.startInterval();
				return cb?.();
			}
			if (this.remaining < this.concurrency) {
				this.remaining++;
				this.startInterval();
				return;
			}
			this.lastTickAt = undefined;
		}, delay);
	}
}
