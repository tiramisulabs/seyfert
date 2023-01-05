import { GATEWAY_BASE_URL } from '@biscuitland/common';
import {
	GatewayDispatchEvents,
	GatewayOpcodes,
} from 'discord-api-types/v10';
import type {
	GatewayHeartbeat,
	GatewayResume,
	GatewayReceivePayload,
	GatewaySendPayload,
	GatewayIdentifyData,
	GatewayIdentify,
} from 'discord-api-types/v10';
import type { RawData } from 'ws';
import { WebSocket } from 'ws';
import type { ShardManager } from './ShardManager';
import type { LeakyBucket } from './utils/Bucket';
import { createLeakyBucket } from './utils/Bucket';

export class Shard {
	static readonly DEFAULTS = {
		timeout: 15000
	};

	private readonly decoder = new TextDecoder();
	private status: ShardStatus = 'Disconnected';
	private lastHeartbeatAt = -1;
	private heartbeatAck = false;
	private sessionID: string | null = null;
	private sequence = 0;

	websocket: WebSocket | null = null;
	interval = 45000;
	heartbeatInterval: NodeJS.Timer | null = null;
	resolves: Map<string, (payload?: unknown) => void> = new Map();
	bucket: LeakyBucket;
	resumeURL: string | null = null;

	get state(): ShardStatus {
		return this.status;
	}

	constructor(public readonly manager: ShardManager, public readonly options: ShardOptions) {
		this.bucket = createLeakyBucket({
			max: 120,
			refillInterval: 60000,
			refillAmount: 120,
		});
	}

	async connect() {
		if (this.websocket && this.websocket.readyState !== WebSocket.CLOSED) {
			return;
		}

		this.status = 'Connecting';

		const url = this.resumeURL ?? GATEWAY_BASE_URL;
		this.debug('Debug', this.options.id, [`Connecting to ${url}`]);
		this.websocket = new WebSocket(url);

		this.websocket.on('open', this.onOpen.bind(this));
		this.websocket.on('message', this.onMessage.bind(this));
		this.websocket.on('error', err => this.debug('Error', this.options.id, [...Object.values(err)]));
		this.websocket.on('close', this.onClose.bind(this));

		return new Promise(resolve => {
			this.resolves.set('READY', () => {
				setTimeout(() => resolve(true), this.options.timeout);
			});
		});
	}

	async identify() {
		this.debug('Debug', this.options.id, [
			'Identifying',
			`Intents: ${this.manager.options.intents}`,
		]);

		this.status = 'Identifying';

		const d: GatewayIdentifyData = {
			token: this.manager.options.token,
			intents: this.manager.options.intents,
			large_threshold: this.manager.options.largeThreshold,
			properties: {
				os: 'linux',
				device: 'Biscuit',
				browser: 'Biscuit',
			},
			shard: [this.options.id, this.manager.options.gateway.shards],
		};

		await this.send<GatewayIdentify>({
			op: GatewayOpcodes.Identify,
			d,
		});
	}

	async resume() {
		this.debug('Resumed', this.options.id);
		this.status = 'Resuming';

		await this.send<GatewayResume>({
			op: GatewayOpcodes.Resume,
			d: {
				token: `Bot ${this.manager.options.token}`,
				session_id: this.sessionID!,
				seq: this.sequence,
			},
		});
	}

	destroy() {
		this.websocket = null;

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

	disconnect(reconnect = false) {
		if (!this.websocket) {
			return;
		}

		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
			this.heartbeatInterval = null;
		}

		if (this.websocket.readyState !== WebSocket.CLOSED) {
			this.websocket.removeAllListeners();

			if (this.sessionID && reconnect) {
				if (this.websocket.readyState !== WebSocket.OPEN) {
					this.websocket.close(4999, 'Reconnect');
				} else {
					this.websocket.terminate();
				}
			} else {
				this.websocket.close(1000, 'Normal Close');
			}
		}

		this.websocket = null;

		this.status = 'Disconnected';

		this.resolves = new Map();
		this.heartbeatAck = true;

		if (reconnect) {
			if (this.sessionID) {
				this.connect();
			}
			return;
		}

		this.destroy();
	}

	heartbeat(called = false) {
		if (this.status === 'Resuming' || this.status === 'Identifying') {
			return;
		}

		if (!called) {
			if (!this.lastHeartbeatAt) {
				this.debug('Debug', this.options.id, [
					JSON.stringify({
						heartbeatInterval: this.heartbeatInterval,
						heartbeatAck: this.heartbeatAck,
						timestamp: Date.now(),
						status: this.status,
					}),
				]);
				this.disconnect();
				return;
			}

			this.heartbeatAck = false;
		}

		this.lastHeartbeatAt = Date.now();

		this.send<GatewayHeartbeat>(
			{
				op: GatewayOpcodes.Heartbeat,
				d: this.sequence,
			},
			true
		);
	}

	async send<T extends GatewaySendPayload>(payload: T, priority = false) {
		if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
			await this.bucket.acquire(1, priority);

			this.websocket.send(JSON.stringify(payload));
		}
	}

	private async onMessage(data: RawData) {
		const payload = this.unPack(data as ArrayBuffer | Buffer);

		if (payload.s != null) {
			this.sequence = payload.s;
		}

		switch (payload.op) {
			case GatewayOpcodes.Dispatch:
				switch (payload.t) {
					case GatewayDispatchEvents.Ready:
						this.debug('Ready', this.options.id, [
							'Shard is ready',
						]);

						this.status = 'Ready';
						this.resumeURL = `${payload.d.resume_gateway_url}/?v=10&encoding=json`;
						this.sessionID = payload.d.session_id;
						this.sequence = 0;

						this.resolves.get('READY')?.(payload);
						this.resolves.delete('READY');

						break;
					case GatewayDispatchEvents.Resumed:
						this.debug('Resumed', this.options.id, [
							'Shard has been resumed',
						]);
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
				this.debug('Debug', this.options.id, [
					'Invalid session recieved',
				]);
				if (payload.d) {
					this.resume();
				} else {
					this.sessionID = null;
					this.sequence = 0;

					this.identify();
				}
				break;
			case GatewayOpcodes.Hello:
				if (payload.d.heartbeat_interval > 0) {
					if (this.heartbeatInterval) {
						clearInterval(this.heartbeatInterval);
					}

					this.heartbeatInterval = setInterval(
						() => this.heartbeat(),
						payload.d.heartbeat_interval
					);
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
					await this.resume();
				} else {
					await this.identify();
					this.heartbeat();
				}
				break;

			case GatewayOpcodes.HeartbeatAck:
				this.heartbeatAck = true;
				break;
		}

		this.manager.emit('payload', this, payload);
	}

	private onClose(code: number) {
		this.debug('Close', this.options.id, ['Shard has been closed']);
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

	private async onOpen() {
		this.debug('Open', this.options.id, ['Shard handshaking']);
		this.status = 'Handshaking';
		this.heartbeatAck = true;
	}

	private unPack(data: ArrayBuffer | Buffer) {
		return JSON.parse(
			this.decoder.decode(new Uint8Array(data))
		) as GatewayReceivePayload;
	}

	private debug(
		event: keyof typeof ShardEvents,
		shardId: number,
		messages?: string[]
	) {
		this.manager.emit(`shard${event}`, shardId, messages);
	}

	safe() {
		const requests = 120 - Math.ceil(60000 / this.interval) * 2;

		return requests < 0 ? 0 : requests;
	}
}

export interface SO {
	id: number;
	timeout: number;
}

export type ShardOptions = Pick<SO, Exclude<keyof SO, keyof typeof Shard.DEFAULTS>> & Partial<SO>;

export type ShardStatus = 'Disconnected' | 'Handshaking' | 'Connecting' | 'Heartbeating' | 'Identifying' | 'Resuming' | 'Ready';

export const enum ShardEvents {
	Open,
	Message,
	Close,
	Error,
	Ready,
	Resumed,
	Send,
	Debug,
}
