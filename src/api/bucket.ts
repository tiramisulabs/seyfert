export class Bucket {
	remaining: number;
	reset = 0;
	resetAfter = 0;
	queue: {
		next: (cb: () => void, resolve: (data: any) => void, reject: (err: unknown) => void) => any;
		resolve: (data: any) => void;
		reject: (err: unknown) => void;
	}[] = [];
	processing?: NodeJS.Timeout | boolean;
	processingResetAfter?: NodeJS.Timeout | boolean;
	last?: number;
	constructor(public limit: number) {
		this.remaining = this.limit;
	}

	process(override = false) {
		if (!this.queue.length) {
			if (this.processing) {
				clearTimeout(this.processing as NodeJS.Timeout);
				this.processing = false;
			}
			return;
		}
		if (this.processing && !override) {
			return;
		}
		const now = Date.now();
		if (!this.reset || this.reset < now) {
			this.reset = now;
			this.remaining = this.limit;
		}
		this.last = now;
		if (this.remaining <= 0) {
			this.processing = setTimeout(
				() => {
					this.processing = false;
					this.process(true);
				},
				this.resetAfter ? 0.5 : Math.max(0, (this.reset || 0) - now) + 1,
			);
			return;
		}
		--this.remaining;
		this.processing = true;

		const shift = this.queue.shift()!;
		shift.next(
			() => {
				if (this.queue.length > 0) {
					this.process(true);
				} else {
					this.processing = false;
				}
			},
			shift.resolve,
			shift.reject,
		);
	}

	push(func: this['queue'][number], unshift?: boolean) {
		if (unshift) {
			this.queue.unshift(func);
		} else {
			this.queue.push(func);
		}
		this.process();
	}

	triggerResetAfter() {
		if (!this.processingResetAfter && this.resetAfter) {
			this.processingResetAfter = setTimeout(() => {
				this.remaining++;
				this.processingResetAfter = undefined;
			}, this.resetAfter * 1.5);
		}
	}
}
