import type { DiscordGatewayPayload } from '@biscuitland/api-types';
import type { ShardOptions, SO, ShardStatus } from '../types';

import type { LeakyBucket } from '../utils/bucket';

import { GatewayOpcodes } from '@biscuitland/api-types';
import { createLeakyBucket } from '../utils/bucket';

import { WebSocket } from 'ws';
import { Options } from '../utils/options';

const textDecoder = new TextDecoder();

export class Shard {
	static readonly DEFAULTS = {
		//
	};

	readonly options: SO;

	heartbeatInterval: any | null = null;
	heartbeatAck = false;

	heartbeatAt = -1;
	interval = 45000;

	resumeURL: string | null = null;
	sessionID: string | null = null;

	sequence = 0 ;

	resolves: Map<string, (payload?: unknown) => void> = new Map();

	status: ShardStatus = 'Disconnected';

	bucket: LeakyBucket;

	trace: any = null;

	ws: WebSocket | null = null;

	constructor(options: ShardOptions) {
		this.options = Options({}, Shard.DEFAULTS, options);

		this.bucket = createLeakyBucket({
			max: 120,
			refillInterval: 60000,
			refillAmount: 120,
		});
	}

	resume() {
		this.status = 'Resuming';

		this.send({
			op: GatewayOpcodes.Resume,
			d: {
				token: `Bot ${this.options.config.token}`,
				session_id: this.sessionID,
				seq: this.sequence,
			}
		});
	}

	destroy() {
		this.ws = null;

		this.bucket = createLeakyBucket({
			max: 120,
			refillInterval: 60000,
			refillAmount: 120,
		});

		this.sequence = 0;
		this.resumeURL = null;
		this.sessionID = null;

		this.heartbeatInterval = null;
	}

    connect() {
		if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
			return;
		}

		this.status = 'Connecting';

		if (this.sessionID && this.resumeURL) {
			this.ws = new WebSocket(this.resumeURL);
		} else {
			this.ws = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json');
		}

		this.ws.on('message', this.onMessage.bind(this));
		this.ws.on('close', this.onClose.bind(this));
		this.ws.on('error', this.onError.bind(this));
		this.ws.on('open', this.onOpen.bind(this));

		return new Promise(resolve => {
			this.resolves.set('READY', () => {
				setTimeout(() => resolve(true), this.options.shards.timeout);
			});
		});
    }

	identify() {
		this.status = 'Identifying';

		this.send({
			op: GatewayOpcodes.Identify,
			d: {
				token: `Bot ${this.options.config.token}`,
                compress: false,
                properties: {
                    os: 'linux',
                    device: 'Biscuit',
                    browser: 'Biscuit'
                },
                intents: this.options.config.intents,
                shard: [this.options.id, this.options.gateway.shards],
			}
		});
	}

	heartbeat(requested = false) {
		if (this.status === 'Resuming' || this.status === 'Identifying') {
			return;
		}

		if (!requested) {
			if (!this.heartbeatAt) {
				// eslint-disable-next-line no-console
				console.log(JSON.stringify({
					heartbeatInterval: this.heartbeatInterval,
					heartbeatAck: this.heartbeatAck,
					timestamp: Date.now(),
					status: this.status
				}));

				this.disconnect();
				return;
			}

			this.heartbeatAck = false;
		}

		this.heartbeatAt = Date.now();

		this.send({
			op: GatewayOpcodes.Heartbeat,
			d: this.sequence,
		}, true);
	}

	disconnect(reconnect = false) {
		if (!this.ws) {
			return;
		}

		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
			this.heartbeatInterval = null;
		}

		if (this.ws.readyState !== WebSocket.CLOSED) {
			this.ws.removeAllListeners();

			if (this.sessionID && reconnect) {
				if (this.ws.readyState !== WebSocket.OPEN) {
					this.ws.close(4999, 'Reconnect');
				} else {
					this.ws.terminate();
				}
			} else {
				this.ws.close(1000, 'Normal Close');
			}
		}

		this.ws = null;

		this.status = 'Disconnected';

		this.resolves = new Map();
		this.heartbeatAck = true;

		if (reconnect) {
			if (this.sessionID) {
				this.connect();
			} else {
				// this.connect();
			}
		} else {
			this.destroy();
		}
	}

	async send(payload: Partial<DiscordGatewayPayload>, priority = false) {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			await this.bucket.acquire(1, priority);

			this.ws.send(JSON.stringify(payload));
		}
	}

	private async onMessage(data: any, isBinary: boolean) {
        const payload = this.pack(data as Buffer | ArrayBuffer, isBinary);

		if (payload.s != null) {
			this.sequence = payload.s;
		}

		switch (payload.op) {
			case GatewayOpcodes.Dispatch:

				switch (payload.t) {
					case 'READY':
						this.debug([`[READY] shard id: ${this.options.id}`]);

						this.status = 'Ready';

						// @ts-ignore
						this.resumeURL = `${payload.d.resume_gateway_url}/?v=10&encoding=json`;

						// @ts-ignore
						this.sessionID = payload.d.session_id;

						// @ts-ignore
						this.sequence = 0;

						this.resolves.get('READY')?.(payload);
						this.resolves.delete('READY');

						break;

					case 'RESUMED':
						this.status = 'Ready';

						this.resolves.get('RESUMED')?.(payload);
						this.resolves.delete('RESUMED');

						break;
				}

				break;

			case GatewayOpcodes.Heartbeat:
				this.heartbeat(true);

				break;

			case GatewayOpcodes.Reconnect:
				this.disconnect(true);
				break;

			case GatewayOpcodes.InvalidSession:

				if (payload.d) {
					this.resume();
				} else {
					this.sessionID = null;
					this.sequence = 0;

					this.identify();
				}

				break;

			case GatewayOpcodes.Hello:

				// @ts-ignore
				if (payload.d.heartbeat_interval > 0) {
					if (this.heartbeatInterval) {
						clearInterval(this.heartbeatInterval);
					}

					// @ts-ignore
					this.heartbeatInterval = setInterval(() => this.heartbeat(), payload.d.heartbeat_interval);

					// @ts-ignore
					this.interval = payload.d.heartbeat_interval;
				}

				if (this.status !== 'Resuming') {
					this.bucket = createLeakyBucket({
						max: this.safe(),
						refillInterval: 60000,
						refillAmount: this.safe(),
						waiting: this.bucket.waiting,
					});
				}

				if (this.sessionID) {
					this.resume();
				} else {
					this.identify();
					this.heartbeat();
				}

				break;
			case GatewayOpcodes.HeartbeatACK:
				this.heartbeatAck = true;

				break;

		}

		// @ts-ignore
		if (payload?.d?._trace) {
			// @ts-ignore
			this.trace = JSON.parse(payload.d._trace);
		}

		this.options.handlePayloads(this, payload);
	}

	private async onClose(code: number) {
		this.debug([`[onClose] shard id: ${this.options.id}`, code]);

		switch (code) {
			case 1001:
				// Discord WebSocket requesting client reconnect
				this.disconnect(true);
				break;

			case 1006:
				// problems with connections
				this.disconnect(true);
				break;

			case 4000:
				// Unknown error
				this.disconnect();
				break;

			case 4001:
				// Unknown opcode
				this.disconnect();
				break;

			case 4002:
				// Decode error
				this.disconnect();
				break;

			case 4003:
				// Not authenticated
				this.sessionID = null;
				this.disconnect();
				break;

			case 4004:
				// Authentication failed
				this.sessionID = null;
				this.disconnect();
				break;

			case 4005:
				// Already authenticated
				this.sessionID = null;
				this.disconnect();
				break;

			case 4007:
				// Invalid sequence
				this.sequence = 0;
				this.disconnect();
				break;

			case 4008:
				// Rate limited
				this.disconnect();
				break;

			case 4009:
				// Session timed out
				this.disconnect();
				break;

			case 4010:
				// Invalid shard
				this.sessionID = null;
				this.disconnect();
				break;

			case 4011:
				// Sharding required
				this.sessionID = null;
				this.disconnect();
				break;

			case 4012:
				// Invalid API version
				this.sessionID = null;
				this.disconnect();
				break;

			case 4013:
				// Invalid intent(s)
				this.sessionID = null;
				this.disconnect();
				break;

			case 4014:
				// Disallowed intent(s)
				this.sessionID = null;
				this.disconnect();
				break;

			default:
				this.disconnect();
				break;
		}
	}

	private async onError(error: Error) {
		this.debug([`[onError] shard id: ${this.options.id}`, error]);
	}

	private async onOpen() {
		this.status = 'Handshaking';
		this.heartbeatAck = true;
	}

	/** temporal */
	debug(_messages: unknown[]) {
		// for (let index = 0; index < messages.length; index++) {
		// 	const message = messages[index];

		// 	// eslint-disable-next-line no-console
		// 	console.log(message);
		// }
	}

	/** temporal */
	pack(data: Buffer | ArrayBuffer, _isBinary: boolean): DiscordGatewayPayload {
		return JSON.parse(textDecoder.decode(new Uint8Array(data))) as DiscordGatewayPayload;
	}

	/** temporal */
	safe() {
		const requests = 120 - Math.ceil(60000 / this.interval) * 2;

		return requests < 0 ? 0 : requests;
	}
}
