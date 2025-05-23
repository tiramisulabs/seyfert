import type { Awaitable } from '../../common';

export type WorkerHeartbeaterMessages = SendHeartbeat;

export type CreateHeartbeaterMessage<T extends string, D extends object = object> = { type: T } & D;

export type SendHeartbeat = CreateHeartbeaterMessage<'HEARTBEAT'>;

export class Heartbeater {
	store = new Map<
		number,
		{
			ack: boolean;
			interval: NodeJS.Timeout;
		}
	>();
	constructor(
		public sendMethod: (workerId: number, data: WorkerHeartbeaterMessages) => Awaitable<void>,
		public interval: number,
	) {}

	register(workerId: number, recreate: (workerId: number) => Awaitable<void>) {
		if (this.interval <= 0) return;
		this.store.set(workerId, {
			ack: true,
			interval: setInterval(() => {
				const heartbeat = this.store.get(workerId)!;
				if (!heartbeat.ack) {
					heartbeat.ack = true;
					return recreate(workerId);
				}
				heartbeat.ack = false;
				this.sendMethod(workerId, { type: 'HEARTBEAT' });
			}, this.interval),
		});
	}

	acknowledge(workerId: number) {
		const heartbeat = this.store.get(workerId);
		if (!heartbeat) return;
		heartbeat.ack = true;
	}
}
