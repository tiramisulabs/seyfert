import { randomUUID } from 'node:crypto';
import NodeWebSocket from 'ws';

export class BaseSocket {
	private internal: NodeWebSocket | WebSocket;

	constructor(kind: 'ws' | 'bun', url: string) {
		this.internal = kind === 'ws' ? new NodeWebSocket(url) : new WebSocket(url);
	}

	set onopen(callback: NodeWebSocket['onopen']) {
		this.internal.onopen = callback;
	}

	set onmessage(callback: NodeWebSocket['onmessage']) {
		this.internal.onmessage = callback;
	}

	set onclose(callback: NodeWebSocket['onclose']) {
		this.internal.onclose = callback;
	}

	set onerror(callback: NodeWebSocket['onerror']) {
		this.internal.onerror = callback;
	}

	send(data: string) {
		return this.internal.send(data);
	}

	close(...args: Parameters<NodeWebSocket['close']>) {
		// @ts-expect-error
		return this.internal.close(...args);
	}

	async ping() {
		if (!('ping' in this.internal)) throw new Error('Unexpected: Method ping not implemented');
		return new Promise<number>(res => {
			const nonce = randomUUID();
			const start = performance.now();
			const listener = (data: Buffer) => {
				if (data.toString() !== nonce) return;
				(this.internal as NodeWebSocket).removeListener('pong', listener);
				res(performance.now() - start);
			};
			(this.internal as NodeWebSocket).on('pong', listener);
			(this.internal as NodeWebSocket).ping(nonce);
		});
	}

	get readyState() {
		return this.internal.readyState;
	}
}
