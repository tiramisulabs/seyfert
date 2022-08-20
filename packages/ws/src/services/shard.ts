import type {
	DiscordGatewayPayload,
	DiscordHello,
	DiscordReady,
	PickPartial,
} from '@biscuitland/api-types';
import type { LeakyBucket } from '../utils/bucket-util';

import { createLeakyBucket } from '../utils/bucket-util';

import {
	Constants,
	GatewayOpcodes,
	GatewayCloseEventCodes,
} from '@biscuitland/api-types';

import WebSocket from 'ws';
import { inflateSync } from 'node:zlib';

export const DEFAULT_HEARTBEAT_INTERVAL = 45000;

export const MAX_GATEWAY_REQUESTS_PER_INTERVAL = 120;
export const GATEWAY_RATE_LIMIT_RESET_INTERVAL = 60_000;

export type PickOptions = Pick<
	ShardOptions,
	Exclude<keyof ShardOptions, keyof typeof Shard.DEFAULTS>
> &
	Partial<ShardOptions>;

const decoder = new TextDecoder();


export interface ShardOptions {
	/** Id of the shard which should be created. */
	id: number;

	/** Gateway configuration for the shard. */
	gatewayConfig: PickPartial<ShardGatewayConfig, 'token'>;

	/** The total amount of shards which are used to communicate with Discord. */
	totalShards: number;

	/** The maximum of requests which can be send to discord per rate limit tick. */
	maxRequestsPerRateLimitTick: number;

	/** The previous payload sequence number. */
	previousSequenceNumber: number;

	/** In which interval (in milliseconds) the gateway resets it's rate limit. */
	rateLimitResetInterval: number;

	/** Sends the discord payload to another guild. */
	handleMessage(shard: Shard, message: MessageEvent<any>): unknown;

	/** This function communicates with the management process. */
	handleIdentify: (shardId: number) => Promise<void>;
}

export interface ShardGatewayConfig {
	/** Whether incoming payloads are compressed using zlib. */
	compress: boolean;

	/** The calculated intent value of the events which the shard should receive. */
	intents: number;

	/** Identify properties to use */
	properties: {
		/** Operating system the shard runs on. */
		os: 'darwin' | 'linux' | 'windows';

		/** The "browser" where this shard is running on. */
		browser: string;

		/** The device on which the shard is running. */
		device: string;
	};

	/** Bot token which is used to connect to Discord */
	token: string;

	/** The URL of the gateway which should be connected to. */
	url: string;

	/** The gateway version which should be used.*/
	version: number;
}

export interface ShardSocketRequest {
	/** The OP-Code for the payload to send. */
	op: GatewayOpcodes;

	/** Payload data. */
	d: unknown;
}

export interface ShardEvents {
	/** A heartbeat has been send. */
	heartbeat?(shard: Shard): unknown;

	/** A heartbeat ACK was received. */
	heartbeatAck?(shard: Shard): unknown;

	/** Shard has received a Hello payload. */
	hello?(shard: Shard): unknown;

	/** The Shards session has been invalidated. */

	invalidSession?(shard: Shard, resumable: boolean): unknown;
	/** The shard has started a resume action. */
	resuming?(shard: Shard): unknown;

	/** The shard has successfully resumed an old session. */
	resumed?(shard: Shard): unknown;

	/** Discord has requested the Shard to reconnect. */
	requestedReconnect?(shard: Shard): unknown;
	/** The shard started to connect to Discord's gateway. */
	connecting?(shard: Shard): unknown;

	/** The shard is connected with Discord's gateway. */
	connected?(shard: Shard): unknown;

	/** The shard has been disconnected from Discord's gateway. */
	disconnected?(shard: Shard): unknown;

	/** The shard has started to identify itself to Discord. */
	identifying?(shard: Shard): unknown;

	/** The shard has successfully been identified itself with Discord. */
	identified?(shard: Shard): unknown;

	/** The shard has received a message from Discord. */
	message?(shard: Shard, payload: DiscordGatewayPayload): unknown;
}

export interface ShardHeart {
	/** Whether or not the heartbeat was acknowledged by Discord in time. */
	acknowledged: boolean;

	/** Interval between heartbeats requested by Discord. */
	interval: number;

	/** Id of the interval, which is used for sending the heartbeats. */
	intervalId?: number;

	/** Unix (in milliseconds) timestamp when the last heartbeat ACK was received from Discord. */
	lastAck?: number;

	/** Unix timestamp (in milliseconds) when the last heartbeat was sent. */
	lastBeat?: number;

	/** Round trip time (in milliseconds) from Shard to Discord and back. */
	rtt?: number;

	/** Id of the timeout which is used for sending the first heartbeat to Discord since it's "special". */
	timeoutId?: number;
}

export enum ShardSocketCloseCodes {
	/** A regular Shard shutdown. */
	Shutdown = 3000,

	/** A resume has been requested and therefore the old connection needs to be closed. */
	ResumeClosingOldConnection = 3024,

	/** Did not receive a heartbeat ACK in time. */
	ZombiedConnection = 3010,

	/** Discordeno's gateway tests hae been finished, therefore the Shard can be turned off. */
	TestingFinished = 3064,

	/** Special close code reserved for Discordeno's zero-downtime resharding system. */
	Resharded = 3065,

	/** Shard is re-identifying therefore the old connection needs to be closed. */
	ReIdentifying = 3066,
}

export enum ShardState {
	/** Shard is fully connected to the gateway and receiving events from Discord. */
	Connected = 0,

	/** Shard started to connect to the gateway. */
	Connecting = 1,

	/** Shard got disconnected and reconnection actions have been started. */
	Disconnected = 2,

	/** The shard is connected to the gateway but only heartbeating. */
	Unidentified = 3,

	/** Shard is trying to identify with the gateway to create a new session. */
	Identifying = 4,

	/** Shard is trying to resume a session with the gateway. */
	Resuming = 5,

	/** Shard got shut down studied or due to a not (self) fixable error and may not attempt to reconnect on its own. */
	Offline = 6,
}

export class Shard {
	static readonly DEFAULTS = {
		/** The maximum of requests which can be send to discord per rate limit tick. */
		maxRequestsPerRateLimitTick: MAX_GATEWAY_REQUESTS_PER_INTERVAL,

		/** The previous payload sequence number. */
		previousSequenceNumber: null,

		/** In which interval (in milliseconds) the gateway resets it's rate limit. */
		rateLimitResetInterval: GATEWAY_RATE_LIMIT_RESET_INTERVAL,
	};

	options: ShardOptions;

	offlineSendQueue: any[];

	totalShards: number;

	sessionId!: string;

	resolves: Map<
		'READY' | 'RESUMED' | 'INVALID_SESSION',
		(payload: DiscordGatewayPayload) => void
	>;

	socket: WebSocket | undefined;

	bucket: LeakyBucket;

	events: ShardEvents;

	state: ShardState;

	heart: ShardHeart;

	id: number;

	constructor(options: PickOptions) {
		this.options = Object.assign(options, Shard.DEFAULTS);

		if (!options.gatewayConfig) {
			this.options.gatewayConfig = {
				properties: {
					os: 'linux',
					device: 'Biscuit',
					browser: 'Biscuit',
				},

				compress: false,
				version: Constants.API_VERSION,
				intents: 0,

				token: this.options.gatewayConfig.token,

				url: 'wss://gateway.discord.gg',
			};
		}

		this.options.gatewayConfig = {
			compress: this.options.gatewayConfig.compress ?? false,
			intents: this.options.gatewayConfig.intents ?? 0,
			properties: {
				os: this.options.gatewayConfig?.properties?.os ?? 'linux',
				device:
					this.options.gatewayConfig?.properties?.device ?? 'Biscuit',
				browser:
					this.options.gatewayConfig?.properties?.browser ??
					'Biscuit',
			},
			url: this.options.gatewayConfig.url ?? 'wss://gateway.discord.gg',

			token: this.options.gatewayConfig.token,
			version:
				this.options.gatewayConfig.version ?? Constants.API_VERSION,
		};

		this.offlineSendQueue = [];

		this.resolves = new Map<
			'READY' | 'RESUMED' | 'INVALID_SESSION',
			(payload: DiscordGatewayPayload) => void
		>();

		this.bucket = createLeakyBucket({
			max: MAX_GATEWAY_REQUESTS_PER_INTERVAL,
			refillInterval: GATEWAY_RATE_LIMIT_RESET_INTERVAL,
			refillAmount: MAX_GATEWAY_REQUESTS_PER_INTERVAL,
		});

		this.events = {} as ShardEvents;

		this.heart = {
			acknowledged: false,
			interval: DEFAULT_HEARTBEAT_INTERVAL,
		};

		this.totalShards = this.options.totalShards,

		this.state = ShardState.Offline;

		this.id = options.id;
	}

	/**
	 * @inheritDoc
	 */

	async startHeartbeating(interval: number) {
		this.heart.interval = interval;

		if (
			[ShardState.Disconnected, ShardState.Offline].includes(this.state)
		) {
			this.state = ShardState.Unidentified;
		}

		const jitter = Math.ceil(this.heart.interval * (Math.random() || 0.5));

		const it1: any = setTimeout(() => {
			this.socket?.send(
				JSON.stringify({
					op: GatewayOpcodes.Heartbeat,
					d: this.options.previousSequenceNumber,
				})
			);

			this.heart.lastBeat = Date.now();
			this.heart.acknowledged = false;

			const it: any = setInterval(async () => {
				if (!this.heart.acknowledged) {
					this.close(
						ShardSocketCloseCodes.ZombiedConnection,
						'Zombied connection, did not receive an heartbeat ACK in time.'
					);

					return await this.identify();
				}

				this.heart.acknowledged = false;

				this.socket?.send(
					JSON.stringify({
						op: GatewayOpcodes.Heartbeat,
						d: this.options.previousSequenceNumber,
					})
				);

				this.heart.lastBeat = Date.now();

				this.events.heartbeat?.(this);
			}, this.heart.interval);

			this.heart.intervalId = it;
		}, jitter);

		this.heart.timeoutId = it1;
	}

	/**
	 * @inheritDoc
	 */

	async stopHeartbeating() {
		clearInterval(this.heart.intervalId);

		clearTimeout(this.heart.timeoutId);
	}

	/**
	 * @inheritDoc
	 */

	async handleMessage(message: MessageEvent): Promise<void> {
		let data = message.data;

		if (this.options.gatewayConfig.compress && data instanceof Blob) {
			// @ts-ignore
			data = decoder.decode(inflateSync(new Uint8Array(await message.arrayBuffer())));
		}

		if (typeof data !== 'string') {
			return;
		}

		const messageData = JSON.parse(data) as DiscordGatewayPayload;

		switch (messageData.op) {
			case GatewayOpcodes.Heartbeat: {
				if (!this.isOpen()) {
					return;
				}

				this.heart.lastBeat = Date.now();

				this.socket?.send(
					JSON.stringify({
						op: GatewayOpcodes.Heartbeat,
						d: this.options.previousSequenceNumber,
					}),
				);
				this.events.heartbeat?.(this);

				break;
			}
			case GatewayOpcodes.Hello: {
				const interval = (messageData.d as DiscordHello).heartbeat_interval;

				this.startHeartbeating(interval);

				if (this.state !== ShardState.Resuming) {

					this.bucket = createLeakyBucket({
						max: this.safe(),
						refillInterval: GATEWAY_RATE_LIMIT_RESET_INTERVAL,
						refillAmount: this.safe(),
						waiting: this.bucket.waiting,
					});
				}

				this.events.hello?.(this);

				break;
			}
			case GatewayOpcodes.HeartbeatACK: {
				this.heart.acknowledged = true;
				this.heart.lastAck = Date.now();

				if (this.heart.lastBeat) {
					this.heart.rtt = this.heart.lastAck - this.heart.lastBeat;
				}

				this.events.heartbeatAck?.(this);

				break;
			}
			case GatewayOpcodes.Reconnect: {
				this.events.requestedReconnect?.(this);

				await this.resume();

				break;
			}
			case GatewayOpcodes.InvalidSession: {
				const resumable = messageData.d as boolean;

				this.events.invalidSession?.(this, resumable);

				await this.delay(Math.floor((Math.random() * 4 + 1) * 1000));

				this.resolves.get('INVALID_SESSION')?.(messageData);
				this.resolves.delete('INVALID_SESSION');

				if (!resumable) {
					await this.identify();

					break;
				}

				await this.resume();

				break;
			}
		}

		if (messageData.t === 'RESUMED') {

			this.state = ShardState.Connected;
			this.events.resumed?.(this);

			this.offlineSendQueue.map(resolve => resolve());

			this.resolves.get('RESUMED')?.(messageData);
			this.resolves.delete('RESUMED');
		} else if (messageData.t === 'READY') {
			const payload = messageData.d as DiscordReady;

			this.sessionId = payload.session_id;
			this.state = ShardState.Connected;

			this.offlineSendQueue.map(resolve => resolve());

			this.resolves.get('READY')?.(messageData);
			this.resolves.delete('READY');
		}

		if (messageData.s !== null) {
			this.options.previousSequenceNumber = messageData.s;
		}

		this.events.message?.(this, messageData);
		this.options.handleMessage(this, messageData as any);
	}

	/**
	 * @inheritDoc
	 */

	async shutdown(): Promise<void> {
		this.close(ShardSocketCloseCodes.Shutdown, 'Shard shutting down.');

		this.state = ShardState.Offline;
	}

	/**
	 * @inheritDoc
	 */
	async handleIdentify(): Promise<void> {
		return await this.options.handleIdentify(this.id);
	}

	/**
	 * @inheritDoc
	 */

	async identify(): Promise<void> {
		if (this.state === ShardState.Connected) {
			this.close(
				ShardSocketCloseCodes.ReIdentifying,
				'Re-identifying closure of old connection.'
			);
		}

		this.state = ShardState.Identifying;
		this.events.identifying?.(this);

		if (!this.isOpen()) {
			await this.connect();
		}

		await this.handleIdentify();

		this.send(
			{
				op: GatewayOpcodes.Identify,
				d: {
					token: `Bot ${this.options.gatewayConfig.token}`,
					compress: this.options.gatewayConfig.compress,
					properties: this.options.gatewayConfig.properties,
					intents: this.options.gatewayConfig.intents,
					shard: [this.id, this.totalShards]
				},
			},
			true
		);

		return new Promise(resolve => {
			this.resolves.set('READY', () => {
				this.events.identified?.(this);
				resolve();
			});

			this.resolves.set('INVALID_SESSION', () => {
				this.resolves.delete('READY');
				resolve();
			});
		});
	}

	/**
	 * @inheritDoc
	 */

	async connect(): Promise<void> {
		if (
			![ShardState.Identifying, ShardState.Resuming].includes(this.state!)
		) {
			this.state = ShardState.Connecting;
		}

		this.events.connecting?.(this);

		const socket = new WebSocket(
			`${this.options.gatewayConfig.url}/?v=${this.options.gatewayConfig.version}&encoding=json`
		);

		this.socket = socket;

		socket.onerror = (event: any) => console.log(event);

		socket.onclose = (event: any) => this.handleClose(event);

		socket.onmessage = (message: any) => {
			this.handleMessage(message);
		};

		return new Promise(resolve => {
			socket.onopen = () => {
			if (![ShardState.Identifying, ShardState.Resuming].includes(this.state)) {
				this.state = ShardState.Unidentified;
			}

			this.events.connected?.(this);

			resolve();
			};
		});
	}

	/**
	 * @inheritDoc
	 */

	async resume(): Promise<void> {
		if (this.isOpen()) {
			this.close(
				ShardSocketCloseCodes.ResumeClosingOldConnection,
				'Reconnecting the shard, closing old connection.'
			);
		}

		if (!this.sessionId) {
			return await this.identify();
		}

		this.state = ShardState.Resuming;

		await this.connect();

		this.send(
			{
				op: GatewayOpcodes.Resume,
				d: {
					token: `Bot ${this.options.gatewayConfig.token}`,
					session_id: this.sessionId,
					seq: this.options.previousSequenceNumber ?? 0,
				},
			},
			true
		);

		return new Promise(resolve => {
			this.resolves.set('RESUMED', () => resolve());

			this.resolves.set('INVALID_SESSION', () => {
				this.resolves.delete('RESUMED');
				resolve();
			});
		});
	}

	/**
	 * @inheritDoc
	 */

	async send(message: ShardSocketRequest, highPriority: boolean) {
		await this.checkOffline(highPriority);

		await this.bucket.acquire(1, highPriority);

		await this.checkOffline(highPriority);

		this.socket?.send(JSON.stringify(message));
	}

	/**
	 * @inheritDoc
	 */

	async handleClose(close: CloseEvent): Promise<void> {
		this.stopHeartbeating();

		switch (close.code) {
			case ShardSocketCloseCodes.TestingFinished: {
				this.state = ShardState.Offline;
				this.events.disconnected?.(this);

				return;
			}

			case ShardSocketCloseCodes.Shutdown:
			case ShardSocketCloseCodes.ReIdentifying:
			case ShardSocketCloseCodes.Resharded:
			case ShardSocketCloseCodes.ResumeClosingOldConnection:
			case ShardSocketCloseCodes.ZombiedConnection: {
				this.state = ShardState.Disconnected;
				this.events.disconnected?.(this);

				return;
			}

			case GatewayCloseEventCodes.UnknownOpcode:
			case GatewayCloseEventCodes.NotAuthenticated:
			case GatewayCloseEventCodes.InvalidSeq:
			case GatewayCloseEventCodes.RateLimited:
			case GatewayCloseEventCodes.SessionTimedOut: {
				this.state = ShardState.Identifying;
				this.events.disconnected?.(this);

				return await this.identify();
			}

			case GatewayCloseEventCodes.AuthenticationFailed:
			case GatewayCloseEventCodes.InvalidShard:
			case GatewayCloseEventCodes.ShardingRequired:
			case GatewayCloseEventCodes.InvalidApiVersion:
			case GatewayCloseEventCodes.InvalidIntents:
			case GatewayCloseEventCodes.DisallowedIntents: {
				this.state = ShardState.Offline;
				this.events.disconnected?.(this);

				throw new Error(
					close.reason ||
						'Discord gave no reason! GG! You broke Discord!'
				);
			}

			case GatewayCloseEventCodes.UnknownError:
			case GatewayCloseEventCodes.DecodeError:
			case GatewayCloseEventCodes.AlreadyAuthenticated:
			default: {
				this.state = ShardState.Resuming;
				this.events.disconnected?.(this);

				return await this.resume();
			}
		}
	}

	/**
	 * @inheritDoc
	 */

	async checkOffline(highPriority: boolean): Promise<void> {
		if (!this.isOpen()) {
			await new Promise(resolve => {
				if (highPriority) {
					this.offlineSendQueue.unshift(resolve);
				} else {
					this.offlineSendQueue.push(resolve);
				}
			});
		}
	}

	/**
	 * @inheritDoc
	 */

	close(code: number, reason: string): void {
		if (this.socket?.readyState !== WebSocket.OPEN) {
			return;
		}

		return this.socket?.close(code, reason);
	}

	/**
	 * @inheritDoc
	 */

	isOpen(): boolean {
		return this.socket?.readyState === WebSocket.OPEN;
	}

	/**
	 * @inheritDoc
	 */

	async delay(ms: number): Promise<void> {
		return new Promise((res): any =>
			setTimeout((): void => {
				res();
			}, ms)
		);
	}

	/**
	 * @inheritDoc
	 */

	safe(): number {
		const requests =
			this.options.maxRequestsPerRateLimitTick -
			Math.ceil(
				this.options.rateLimitResetInterval / this.heart.interval
			) *
				2;

		return requests < 0 ? 0 : requests;
	}
}
