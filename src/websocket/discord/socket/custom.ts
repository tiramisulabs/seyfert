import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { request } from 'node:https';
import type { Socket } from 'node:net';

export class SeyfertWebSocket {
	socket?: Socket = undefined;
	hostname: string;
	path: string;
	__stored: Buffer[] = [];
	__opcode = 0;
	__promises = new Map<
		string,
		{
			resolve: () => void;
			reject: (reason?: any) => void;
		}
	>();
	__lastError: null | {
		code: number;
		reason: string;
	} = null;
	__closeCalled?: boolean;

	constructor(url: string) {
		const urlParts = new URL(url);
		this.hostname = urlParts.hostname || '';
		this.path = `${urlParts.pathname}${urlParts.search || ''}`;
		this.connect();
	}

	private connect(retries = 0) {
		return new Promise<void>((resolve, rej) => {
			const key = randomBytes(16).toString('base64');
			const req = request({
				//discord gateway hostname
				hostname: this.hostname,
				path: this.path,
				headers: {
					Connection: 'Upgrade',
					Upgrade: 'websocket',
					'Sec-WebSocket-Key': key,
					'Sec-WebSocket-Version': '13',
				},
			});

			req.on('upgrade', (res, socket) => {
				const hash = createHash('sha1').update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest('base64');
				const accept = res.headers['sec-websocket-accept'];
				if (accept !== hash) {
					socket.end(() => {
						rej(new Error('Invalid sec-websocket-accept header'));
					});
					return;
				}
				this.socket = socket;

				socket.on('readable', this.handleReadable.bind(this));

				socket.on('close', this.handleClose.bind(this));

				socket.on('error', err => this.onerror(err));
				resolve();
				this.onopen();
			});

			req.on('close', () => {
				req.removeAllListeners();
			});

			req.on('error', e => {
				if (retries < 5) {
					setTimeout(() => {
						resolve(this.connect(retries + 1));
					}, 500);
				} else {
					rej(e);
				}
			});

			req.end();
		});
	}

	handleReadable() {
		// Keep reading until no data, this is useful when two payloads merges.
		while (this.socket!.readableLength > 0) {
			// Read length without consuming the buffer
			let length = this.readBytes(1, 1) & 127;
			const slice = length === 126 ? 4 : length === 127 ? 10 : 2;
			// Check if frame/data is complete
			if (this.socket!.readableLength < slice) return; // Wait to next cycle if not
			if (length > 125) {
				// https://datatracker.ietf.org/doc/html/rfc6455#section-5.2
				// If length is 126/127, read extended payload length instead
				// Equivalent to readUint32BE
				length = this.readBytes(2, slice - 2);
			}
			const payloadLength = slice + length;
			// Read the frame, ignore data next to it, leave it to next `while` cycle
			const frame = this.socket!.read(payloadLength) as Buffer | null;
			// unfinished object when socket closes while reading the data
			if (!frame || frame.length !== payloadLength) return;
			// Get fin (0 | 1)
			const fin = frame[0] >> 7;
			// Read opcode (continuation, text, binary, close, ping, pong)
			let opcode = frame[0] & 15;
			// Cut frame to get payload
			let payload = frame.subarray(slice);
			// If fin is 0, store the data and wait to next `while` cycle to be fin=1
			if (fin === 0) {
				this.__stored.push(payload);
				// Only store opcode when is not 0 (continuation)
				if (opcode !== 0) {
					this.__opcode = opcode;
				}
				return;
			}
			// When the message is from ws fragmentation, opcode of last message is 0
			// If so, merge all messages.
			if (opcode === 0) {
				this.__stored.push(payload);
				payload = Buffer.concat(this.__stored);
				opcode = this.__opcode;
				// Reset body
				this.__stored = [];
				// Reset opcode, should set as -1?
				this.__opcode = 0;
			}
			// Handle opcodes
			this.handleEvent(payload, opcode);
		}
	}

	handleEvent(body: Buffer, opcode: number) {
		switch (opcode) {
			// text
			case 0x1:
				this.onmessage({ data: body.toString() });
				break;
			// binary
			case 0x2:
				{
					if (body[1] === 80) body = body.subarray(6);
					this.onmessage({ data: body });
				}
				break;
			// pong
			case 0x9:
				this.onping(body.toString());
				break;
			// ping
			case 0xa:
				this.onpong(body.toString());
				break;
			// close
			case 0x8:
				this.__lastError = {
					code: body.readUInt16BE(0),
					reason: body.subarray(2).toString(),
				};
				break;
		}
	}

	async handleClose() {
		this.socket?.removeAllListeners();
		this.socket?.destroy();
		this.socket = undefined;
		if (this.__closeCalled) return;
		if (!this.__lastError) return this.connect();
		this.onclose(this.__lastError);
		this.__lastError = null;
	}

	send(data: string) {
		this._write(Buffer.from(data), 1);
	}

	private _write(buffer: Buffer, opcode: number) {
		if (!this.socket?.writable) return;
		const length = buffer.length;
		let frame: Buffer;
		// Kinda same logic as above, but client-side
		if (length < 126) {
			frame = Buffer.allocUnsafe(6 + length);
			frame[1] = 128 + length;
		} else if (length < 65536) {
			frame = Buffer.allocUnsafe(8 + length);
			frame[1] = 254;
			frame[2] = (length >> 8) & 255;
			frame[3] = length & 255;
		} else {
			frame = Buffer.allocUnsafe(14 + length);
			frame[1] = 255;
			frame.writeBigUint64BE(BigInt(length), 2);
		}
		frame[0] = 128 + opcode;
		frame.writeUint32BE(0, frame.length - length - 4);
		frame.set(buffer, frame.length - length);
		this.socket?.write(frame);
	}

	onping(_data: string) {
		//
	}

	onpong(_data: string) {
		//
	}

	onopen() {
		//
	}

	onmessage(_payload: { data: string | Buffer }) {
		//
	}

	onclose(_close: { code: number; reason: string }) {
		//
	}

	onerror(_err: unknown) {
		//
	}

	close(code: number, reason: string) {
		this.__closeCalled = true;
		// alloc payload length
		const buffer = Buffer.alloc(2 + Buffer.byteLength(reason));
		// gateway close code
		buffer.writeUInt16BE(code, 0);
		// reason
		buffer.write(reason, 2);
		// message, close opcode
		this._write(buffer, 0x8);
		this.socket?.end();
	}

	pong(data: string) {
		//send pong opcode (10)
		this._write(Buffer.from(data), 0xa);
	}

	ping(data: string) {
		//send ping opcode (9)
		this._write(Buffer.from(data), 0x9);
	}

	waitPing() {
		const id = this.#randomUUID();
		let timeout: NodeJS.Timeout | undefined;

		const start = performance.now();
		this.ping(id);

		return new Promise<void>((resolve, reject) => {
			this.__promises.set(id, {
				reject,
				resolve,
			});
			timeout = setTimeout(() => {
				resolve();
			}, 60e3);
		})
			.then(() => {
				return performance.now() - start;
			})
			.finally(() => {
				clearTimeout(timeout);
			});
	}

	#randomUUID(): string {
		const id = randomUUID();
		if (this.__promises.has(id)) return this.#randomUUID();
		return id;
	}

	get readyState() {
		return ['opening', 'open', 'closed', 'closed'].indexOf(this.socket?.readyState ?? 'closed');
	}

	/**
	 *
	 * @param start Start calculating bytes from `start`
	 * @param bits Num of bits since `start`
	 * @returns
	 */

	private readBytes(start: number, bits: number): number {
		// @ts-expect-error this is private, thanks nodejs
		const readable = this.socket._readableState as
			| {
					bufferIndex: number;
					buffer: Buffer[];
			  }
			| {
					buffer: {
						head: ReadableHeadData;
					};
			  };
		// Num of bit read
		let bitIndex = 0;
		// Num of bit read counting since start
		let read = 0;
		// Bytes value
		let value = 0;
		// Node v20
		if ('bufferIndex' in readable) {
			// actual index of the buffer to read
			let blockIndex = readable.bufferIndex;
			// Buffer to read
			let block: Buffer | undefined;
			while ((block = readable.buffer[blockIndex++])) {
				for (let i = 0; i < block.length; i++) {
					if (++bitIndex > start) {
						value *= 256; // shift 8 bits (1 byte) `*= 256 is faster than <<= 8`
						value += block[i]; // sum value to bits
						// Read until read all bits
						if (++read === bits) {
							return value;
						}
					}
				}
			}
		} /* Support for olders versions*/ else {
			// readable.buffer is kinda a LinkedList
			let head: ReadableHeadData | undefined = readable.buffer.head;
			while (head) {
				for (let i = 0; i < head.data.length; i++) {
					if (++bitIndex > start) {
						value *= 256; // shift 8 bits (1 byte) `*= 256 is faster than <<= 8`
						value += head.data[i]; // sum value to bits
						// Read until read all bits
						if (++read === bits) {
							return value;
						}
					}
				}
				// continue with next node
				head = head.next;
			}
		}
		return 0;
	}
}

export type ReadableHeadData = {
	next?: ReadableHeadData;
	data: Buffer;
};
