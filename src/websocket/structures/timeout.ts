export class ConnectTimeout {
	readonly promises: ((x: boolean) => any)[] = [];
	protected interval?: NodeJS.Timeout = undefined;
	constructor(public intervalTime = 5000) {}

	wait() {
		let resolve = (_x: boolean) => {
			//
		};
		const promise = new Promise<boolean>(r => (resolve = r));
		if (!this.promises.length) {
			this.interval = setInterval(() => {
				this.shift();
			}, this.intervalTime);
			resolve(true);
		}
		this.promises.push(resolve);
		return promise;
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
	readonly queue: { cb: (() => any) | undefined }[] = [];
	protected interval?: NodeJS.Timeout = undefined;

	constructor(
		public intervalTime = 5000,
		public concurrency = 1,
	) {}

	push(callback: () => any) {
		this.queue.push({ cb: callback });
		if (this.queue.length === this.concurrency) {
			for (let i = 0; i < this.concurrency; i++) {
				this.queue[i].cb?.();
				this.queue[i].cb = undefined;
			}
			this.interval = setInterval(() => {
				for (let i = 0; i < this.concurrency; i++) {
					this.shift();
				}
			}, this.intervalTime);
		}
	}

	shift(): any {
		const shift = this.queue.shift();
		if (!shift) {
			if (!this.queue.length) {
				clearInterval(this.interval);
				this.interval = undefined;
			}
			return;
		}
		if (!shift.cb) return this.shift();
		shift.cb?.();
		if (!this.queue.length) {
			clearInterval(this.interval);
			this.interval = undefined;
		}
	}
}
