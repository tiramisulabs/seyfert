import { randomUUID } from 'node:crypto';
import { SeyfertWebSocket } from './socket/custom';

export class BaseSocket {
	private internal: SeyfertWebSocket | WebSocket;

	ping: () => Promise<number>;

	constructor(kind: 'ws' | 'bun', url: string) {
		this.internal = kind === 'ws' ? new SeyfertWebSocket(url) : new WebSocket(url);

		if (kind === 'ws') {
			const ws = this.internal as SeyfertWebSocket;
			this.ping = ws.waitPing.bind(ws);
			ws.onpong = data => {
				const promise = ws.__promises.get(data);
				if (promise) {
					ws.__promises.delete(data);
					promise?.resolve();
				}
			};
		} else {
			const ws = this.internal as WebSocket;
			this.ping = () => {
				return new Promise<number>(res => {
					const nonce = randomUUID();
					const start = performance.now();
					const listener = (data: Buffer) => {
						if (data.toString() !== nonce) return;
						//@ts-expect-error
						ws.removeListener('pong', listener);
						res(performance.now() - start);
					};
					//@ts-expect-error
					ws.addEventListener('pong', listener);
					//@ts-expect-error
					ws.ping(nonce);
				});
			};
		}
	}

	set onopen(callback: SeyfertWebSocket['onopen']) {
		this.internal.onopen = callback;
	}

	set onmessage(callback: SeyfertWebSocket['onmessage']) {
		this.internal.onmessage = callback;
	}

	set onclose(callback: SeyfertWebSocket['onclose']) {
		this.internal.onclose = callback;
	}

	set onerror(callback: SeyfertWebSocket['onerror']) {
		this.internal.onerror = callback;
	}

	send(data: string) {
		return this.internal.send(data);
	}

	close(...args: Parameters<SeyfertWebSocket['close']>) {
		return this.internal.close(...args);
	}

	get readyState() {
		return this.internal.readyState;
	}
}
