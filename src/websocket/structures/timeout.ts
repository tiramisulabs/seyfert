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
	readonly queue: { cb: (() => any) | undefined }[] = [];
	protected interval?: NodeJS.Timeout = undefined;

	constructor(
		public intervalTime = 5000,
		public concurrency = 1,
	) {}

	async push(callback: () => any) {
		this.queue.push({ cb: callback });
		if (this.queue.length === this.concurrency) {
			for (let i = 0; i < this.concurrency; i++) {
				await this.queue[i].cb?.();
				this.queue[i].cb = undefined;
			}
			this.interval = setInterval(() => {
				for (let i = 0; i < this.concurrency; i++) {
					this.shift();
				}
			}, this.intervalTime);
		}
	}

	async shift(): Promise<any> {
		const shift = this.queue.shift();
		if (!shift) {
			if (!this.queue.length) {
				clearInterval(this.interval);
				this.interval = undefined;
			}
			return;
		}
		if (!shift.cb) return this.shift();
		await shift.cb?.();
		if (!this.queue.length) {
			clearInterval(this.interval);
			this.interval = undefined;
		}
	}
}
