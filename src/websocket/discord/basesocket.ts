import { randomUUID } from 'node:crypto';
// import { SeyfertWebSocket } from './socket/custom';
import { WebSocket as NodeJSWebSocket } from 'ws';

export class BaseSocket {
	private internal: NodeJSWebSocket | WebSocket;

	ping?: () => Promise<number>;

	constructor(kind: 'ws' | 'bun', url: string) {
		this.internal = kind === 'ws' ? new NodeJSWebSocket(url) : new WebSocket(url);
		// this.internal = kind === 'ws' ? new SeyfertWebSocket(url) : new WebSocket(url);

		// if (kind === 'ws') {
		// 	const ws = this.internal as NodeJSWebSocket;
		// 	this.ping = ws.waitPing.bind(ws);
		// 	ws.onpong = data => {
		// 		const promise = ws.__promises.get(data);
		// 		if (promise) {
		// 			ws.__promises.delete(data);
		// 			promise?.resolve();
		// 		}
		// 	};
		// } else {
		const ws = this.internal as WebSocket;
		this.ping = () => {
			return new Promise<number>(res => {
				const nonce = randomUUID();
				const start = performance.now();
				const listener = (data: Buffer) => {
					if (data.toString() !== nonce) return;
					//@ts-expect-error bun support
					ws.removeListener('pong', listener);
					res(performance.now() - start);
				};
				//@ts-expect-error bun support
				ws.on('pong', listener);
				//@ts-expect-error bun support
				ws.ping(nonce);
			});
		};
		// }
	}

	set onopen(callback: NodeJSWebSocket['onopen']) {
		this.internal.onopen = callback;
	}

	set onmessage(callback: NodeJSWebSocket['onmessage']) {
		this.internal.onmessage = callback;
	}

	set onclose(callback: NodeJSWebSocket['onclose']) {
		this.internal.onclose = callback;
	}

	set onerror(callback: NodeJSWebSocket['onerror']) {
		this.internal.onerror = callback;
	}

	send(data: string) {
		return this.internal.send(data);
	}

	close(...args: Parameters<NodeJSWebSocket['close']>) {
		//@ts-expect-error
		return this.internal.close(...args);
	}

	get readyState() {
		return this.internal.readyState;
	}
}
