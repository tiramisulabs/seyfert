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
				return new Promise<number>((resolve, reject) => {
					const nonce = randomUUID();
					const start = performance.now();
					let timeout: ReturnType<typeof setTimeout>;
					const cleanup = () => {
						clearTimeout(timeout);
						// @ts-expect-error Bun WebSocket exposes pong events.
						ws.removeEventListener('pong', listener);
						ws.removeEventListener('close', onClose);
						ws.removeEventListener('error', onError);
					};
					const listener = ({ data }: MessageEvent) => {
						if (data.toString() !== nonce) return;
						cleanup();
						resolve(performance.now() - start);
					};
					const onClose = () => {
						cleanup();
						reject(new Error('WebSocket closed while waiting for pong'));
					};
					const onError = () => {
						cleanup();
						reject(new Error('WebSocket errored while waiting for pong'));
					};
					// @ts-expect-error Bun WebSocket exposes pong events.
					ws.addEventListener('pong', listener);
					ws.addEventListener('close', onClose);
					ws.addEventListener('error', onError);
					timeout = setTimeout(() => {
						cleanup();
						resolve(Number.POSITIVE_INFINITY);
					}, 60e3);
					try {
						// @ts-expect-error Bun WebSocket exposes ping().
						ws.ping(nonce);
					} catch (error) {
						cleanup();
						reject(error);
					}
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
