import { inflateSync } from 'node:zlib';
import { LogLevels, Logger, type MakeRequired, MergeOptions } from '../../common';
import {
	GatewayCloseCodes,
	GatewayDispatchEvents,
	type GatewayDispatchPayload,
	GatewayOpcodes,
	type GatewayReceivePayload,
	type GatewaySendPayload,
} from '../../types';
import { properties } from '../constants';
import { DynamicBucket } from '../structures';
import { ConnectTimeout } from '../structures/timeout';
import { BaseSocket } from './basesocket';
import type { ShardData, ShardOptions } from './shared';
import { ShardSocketCloseCodes } from './shared';

export interface ShardHeart {
	interval: number;
	nodeInterval?: NodeJS.Timeout;
	lastAck?: number;
	lastBeat?: number;
	ack: boolean;
}

export class Shard {
	logger: Logger;
	debugger?: Logger;
	data: Partial<ShardData> | ShardData = {
		resume_seq: null,
	};

	websocket: BaseSocket | null = null;
	connectTimeout = new ConnectTimeout();
	heart: ShardHeart = {
		interval: 30e3,
		ack: true,
	};

	bucket: DynamicBucket;
	offlineSendQueue: ((_?: unknown) => void)[] = [];

	options: MakeRequired<ShardOptions, 'properties' | 'ratelimitOptions'>;

	constructor(
		public id: number,
		options: ShardOptions,
	) {
		this.options = MergeOptions<Shard['options']>(options, {
			properties,
			ratelimitOptions: {
				rateLimitResetInterval: 60_000,
				maxRequestsPerRateLimitTick: 120,
			},
		} as ShardOptions);

		this.logger = new Logger({
			name: `[Shard #${id}]`,
			logLevel: LogLevels.Info,
		});

		if (options.debugger) this.debugger = options.debugger;

		const safe = this.calculateSafeRequests();
		this.bucket = new DynamicBucket({ refillInterval: 6e4, limit: safe, debugger: options.debugger });
	}

	get latency() {
		return this.heart.lastAck && this.heart.lastBeat
			? this.heart.lastAck - this.heart.lastBeat
			: Number.POSITIVE_INFINITY;
	}

	get isOpen() {
		return this.websocket?.readyState === 1 /*WebSocket.open*/;
	}

	get gatewayURL() {
		return this.options.info.url;
	}

	get resumeGatewayURL() {
		return this.data.resume_gateway_url;
	}

	get currentGatewayURL() {
		const url = new URL(this.resumeGatewayURL ?? this.options.info.url);
		url.searchParams.set('v', '10');
		return url.href;
	}

	ping() {
		if (!this.websocket) return Promise.resolve(Number.POSITIVE_INFINITY);
		//@ts-expect-error
		return this.websocket.ping();
	}

	async connect() {
		await this.connectTimeout.wait();
		if (this.isOpen) {
			this.debugger?.debug(`[Shard #${this.id}] Attempted to connect while open`);
			return;
		}

		clearTimeout(this.heart.nodeInterval);

		this.debugger?.debug(`[Shard #${this.id}] Connecting to ${this.currentGatewayURL}`);

		// @ts-expect-error @types/bun cause erros in compile
		// biome-ignore lint/correctness/noUndeclaredVariables: /\ bun lol
		this.websocket = new BaseSocket(typeof Bun === 'undefined' ? 'ws' : 'bun', this.currentGatewayURL);

		this.websocket.onmessage = ({ data }: { data: string | Buffer }) => {
			this.handleMessage(data);
		};

		this.websocket.onclose = (event: { code: number; reason: string }) => this.handleClosed(event);

		this.websocket.onerror = (event: ErrorEvent) => this.logger.error(event);

		this.websocket.onopen = () => {
			this.heart.ack = true;
		};
	}

	async send<T extends GatewaySendPayload = GatewaySendPayload>(force: boolean, message: T) {
		this.debugger?.info(
			`[Shard #${this.id}] Sending: ${GatewayOpcodes[message.op]} ${JSON.stringify(
				message.d,
				(_, value) => {
					if (typeof value === 'string')
						return value.replaceAll(this.options.token, v => {
							const split = v.split('.');
							return `${split[0]}.${'*'.repeat(split[1].length)}.${'*'.repeat(split[2].length)}`;
						});
					return value;
				},
				1,
			)}`,
		);
		await this.checkOffline(force);
		await this.bucket.acquire(force);
		await this.checkOffline(force);
		this.websocket?.send(JSON.stringify(message));
	}

	async identify() {
		await this.send(true, {
			op: GatewayOpcodes.Identify,
			d: {
				token: `Bot ${this.options.token}`,
				compress: this.options.compress,
				properties: this.options.properties,
				shard: [this.id, this.options.info.shards],
				intents: this.options.intents,
				presence: this.options.presence,
			},
		});
	}

	get resumable() {
		return !!(this.data.resume_gateway_url && this.data.session_id && this.data.resume_seq !== null);
	}

	async resume() {
		await this.send(true, {
			op: GatewayOpcodes.Resume,
			d: {
				seq: this.data.resume_seq!,
				session_id: this.data.session_id!,
				token: `Bot ${this.options.token}`,
			},
		});
	}

	async heartbeat(requested: boolean) {
		this.debugger?.debug(
			`[Shard #${this.id}] Sending ${requested ? '' : 'un'}requested heartbeat (Ack=${this.heart.ack})`,
		);
		if (!requested) {
			if (!this.heart.ack) {
				await this.close(ShardSocketCloseCodes.ZombiedConnection, 'Zombied connection');
				return;
			}
			this.heart.ack = false;
		}

		this.heart.lastBeat = Date.now();

		this.websocket!.send(
			JSON.stringify({
				op: GatewayOpcodes.Heartbeat,
				d: this.data.resume_seq ?? null,
			}),
		);
	}

	async disconnect() {
		this.debugger?.info(`[Shard #${this.id}] Disconnecting`);
		await this.close(ShardSocketCloseCodes.Shutdown, 'Shard down request');
	}

	async reconnect() {
		this.debugger?.info(`[Shard #${this.id}] Reconnecting`);
		await this.disconnect();
		await this.connect();
	}

	async onpacket(packet: GatewayReceivePayload) {
		if (packet.s !== null) {
			this.data.resume_seq = packet.s;
		}

		this.debugger?.debug(`[Shard #${this.id}]`, packet.t ? packet.t : GatewayOpcodes[packet.op], this.data.resume_seq);

		switch (packet.op) {
			case GatewayOpcodes.Hello:
				{
					clearInterval(this.heart.nodeInterval);

					this.heart.interval = packet.d.heartbeat_interval;

					await this.heartbeat(false);
					this.heart.nodeInterval = setInterval(() => this.heartbeat(false), this.heart.interval);

					if (this.resumable) {
						return this.resume();
					}
					await this.identify();
				}
				break;
			case GatewayOpcodes.HeartbeatAck:
				{
					this.heart.ack = true;
					this.heart.lastAck = Date.now();
				}
				break;
			case GatewayOpcodes.Heartbeat:
				this.heartbeat(true);
				break;
			case GatewayOpcodes.Reconnect:
				await this.reconnect();
				break;
			case GatewayOpcodes.InvalidSession:
				if (packet.d) {
					if (!this.resumable) {
						return this.logger.fatal('This is a completely unexpected error message.');
					}
					await this.resume();
				} else {
					this.data.resume_seq = 0;
					this.data.session_id = undefined;
					await this.identify();
				}
				break;
			case GatewayOpcodes.Dispatch:
				{
					switch (packet.t) {
						case GatewayDispatchEvents.Resumed:
							{
								this.offlineSendQueue.map((resolve: () => any) => resolve());
								this.options.handlePayload(this.id, packet);
							}
							break;
						case GatewayDispatchEvents.Ready: {
							this.data.resume_gateway_url = packet.d.resume_gateway_url;
							this.data.session_id = packet.d.session_id;
							this.offlineSendQueue.map((resolve: () => any) => resolve());
							this.options.handlePayload(this.id, packet);
							break;
						}
						default:
							this.options.handlePayload(this.id, packet);
							break;
					}
				}
				break;
		}
	}

	protected async handleClosed(close: { code: number; reason: string }) {
		clearInterval(this.heart.nodeInterval);
		this.logger.warn(
			`${ShardSocketCloseCodes[close.code] ?? GatewayCloseCodes[close.code] ?? close.code} (${close.code})`,
			close.reason,
		);

		switch (close.code) {
			case ShardSocketCloseCodes.Shutdown:
				//Force disconnect, ignore
				break;
			case 1000:
			case GatewayCloseCodes.UnknownOpcode:
			case GatewayCloseCodes.InvalidSeq:
			case GatewayCloseCodes.SessionTimedOut:
				{
					this.data.resume_seq = 0;
					this.data.session_id = undefined;
					this.data.resume_gateway_url = undefined;
					await this.reconnect();
				}
				break;
			case 1001:
			case 1006:
			case ShardSocketCloseCodes.ZombiedConnection:
			case GatewayCloseCodes.UnknownError:
			case GatewayCloseCodes.DecodeError:
			case GatewayCloseCodes.NotAuthenticated:
			case GatewayCloseCodes.AlreadyAuthenticated:
			case GatewayCloseCodes.RateLimited:
				{
					this.logger.info('Trying to reconnect');
					await this.reconnect();
				}
				break;

			case GatewayCloseCodes.AuthenticationFailed:
			case GatewayCloseCodes.DisallowedIntents:
			case GatewayCloseCodes.InvalidAPIVersion:
			case GatewayCloseCodes.InvalidIntents:
			case GatewayCloseCodes.InvalidShard:
			case GatewayCloseCodes.ShardingRequired:
				this.logger.fatal('Cannot reconnect');
				break;

			default:
				{
					this.logger.warn('Unknown close code, trying to reconnect anyways');
					await this.reconnect();
				}
				break;
		}
	}

	async close(code: number, reason: string) {
		clearInterval(this.heart.nodeInterval);
		if (!this.isOpen) {
			return this.debugger?.warn(`[Shard #${this.id}] Is not open, reason:`, reason);
		}
		this.debugger?.debug(`[Shard #${this.id}] Called close with reason:`, reason);
		this.websocket?.close(code, reason);
	}

	protected handleMessage(data: string | Buffer) {
		let packet: GatewayDispatchPayload;
		try {
			if (data instanceof Buffer) {
				data = inflateSync(data);
			}
			packet = JSON.parse(data as string);
		} catch (e) {
			this.logger.error(e);
			return;
		}
		return this.onpacket(packet);
	}

	checkOffline(force: boolean) {
		if (!this.isOpen) {
			return new Promise(resolve => this.offlineSendQueue[force ? 'unshift' : 'push'](resolve));
		}
		return Promise.resolve();
	}

	calculateSafeRequests(): number {
		const safeRequests =
			this.options.ratelimitOptions.maxRequestsPerRateLimitTick -
			Math.ceil(this.options.ratelimitOptions.rateLimitResetInterval / this.heart.interval) * 2;

		if (safeRequests < 0) {
			return 0;
		}
		return safeRequests;
	}
}
