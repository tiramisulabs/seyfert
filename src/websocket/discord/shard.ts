import { inflateSync } from 'node:zlib';
import { delay, hasIntent, Logger, LogLevels, type MakePresent, MergeOptions, SeyfertError } from '../../common';
import {
	type APIGuildMember,
	GatewayCloseCodes,
	GatewayDispatchEvents,
	type GatewayDispatchPayload,
	type GatewayGuildMembersChunkPresence,
	GatewayOpcodes,
	type GatewayReceivePayload,
	type GatewaySendPayload,
} from '../../types';
import type {
	GatewayRequestGuildMembersDataWithQuery,
	GatewayRequestGuildMembersDataWithUserIds,
} from '../../types/gateway';
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

	private reconnectPromise: Promise<void> | undefined;
	// Invalidates delayed connects and callbacks that belong to a replaced socket.
	private lifecycle = 0;
	private connectingLifecycle?: number;
	private handledWebsocket?: BaseSocket;
	private localClose?: { websocket: BaseSocket; applyPolicy: boolean };
	private firstHeartbeatTimeout?: NodeJS.Timeout;

	bucket: DynamicBucket;
	offlineSendQueue: ((_?: unknown) => void)[] = [];
	pendingGuilds?: Set<string>;
	options: MakePresent<ShardOptions, 'properties' | 'ratelimitOptions' | 'reconnectTimeout' | 'connectionTimeout'>;
	isReady = false;

	connectionTimeout?: NodeJS.Timeout;

	private requestGuildMembersChunk = new Map<
		string,
		{
			members: APIGuildMember[];
			presences: GatewayGuildMembersChunkPresence[];
			resolve: (value: { members: APIGuildMember[]; presences: GatewayGuildMembersChunkPresence[] }) => void;
			reject: (reason?: any) => void;
			timeout: NodeJS.Timeout;
			options:
				| Omit<GatewayRequestGuildMembersDataWithQuery, 'nonce'>
				| Omit<GatewayRequestGuildMembersDataWithUserIds, 'nonce'>;
		}
	>();

	constructor(
		public id: number,
		options: ShardOptions,
	) {
		this.options = MergeOptions<Shard['options']>(
			{
				properties,
				ratelimitOptions: {
					rateLimitResetInterval: 60_000,
					maxRequestsPerRateLimitTick: 120,
				},
				reconnectTimeout: 10e3,
				connectionTimeout: 30e3,
			} as ShardOptions,
			options,
		);

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
		return this.websocket.ping();
	}

	async connect() {
		if (this.connectingLifecycle === undefined) this.reconnectPromise = undefined;
		return this.connectSocket(false);
	}

	private async connectSocket(immediate: boolean) {
		if (this.connectingLifecycle !== undefined) {
			this.debugger?.debug(`[Shard #${this.id}] Already connecting, skipping`);
			return;
		}

		const lifecycle = ++this.lifecycle;
		this.connectingLifecycle = lifecycle;
		if (!immediate) await this.connectTimeout.wait();
		if (this.connectingLifecycle !== lifecycle) return;
		if (lifecycle !== this.lifecycle) {
			this.connectingLifecycle = undefined;
			return;
		}
		if (this.isOpen) {
			this.debugger?.debug(`[Shard #${this.id}] Attempted to connect while open`);
			this.connectingLifecycle = undefined;
			return;
		}

		this.clearHeartbeat();
		clearTimeout(this.connectionTimeout);

		const url = this.currentGatewayURL;
		this.debugger?.debug(`[Shard #${this.id}] Connecting to ${url}`);

		// @ts-expect-error Use native websocket when using Bun
		const websocket = new BaseSocket(typeof Bun === 'undefined' ? 'ws' : 'bun', url);
		this.isReady = false;
		this.handledWebsocket = undefined;
		this.localClose = undefined;
		this.websocket = websocket;

		this.connectionTimeout = setTimeout(() => {
			if (!this.isCurrentConnection(websocket)) return;
			void this.reconnectWith(
				ShardSocketCloseCodes.Timeout,
				this.options.reconnectTimeout,
				'Gateway connection timed out',
			).catch(error => this.logger.error(error));
		}, this.options.connectionTimeout);

		websocket.onmessage = ({ data }: { data: string | Buffer }) => {
			if (!this.isCurrentConnection(websocket)) return;
			try {
				void Promise.resolve(this.handleMessage(data)).catch(error => this.logger.error(error));
			} catch (error) {
				this.logger.error(error);
			}
		};

		websocket.onclose = (event: { code: number; reason: string }) => {
			if (!this.isCurrentConnection(websocket)) return;
			const localClose = this.localClose?.websocket === websocket ? this.localClose : undefined;
			void this.handleConnectionClosed(
				{
					code: event.code,
					reason: event.reason,
					locallyInitiated: !!localClose,
					applyPolicy: localClose?.applyPolicy,
				},
				websocket,
			).catch(error => this.logger.error(error));
		};

		websocket.onerror = (event: ErrorEvent) => {
			if (!this.isCurrentConnection(websocket)) return;
			this.logger.error(`Shard #${this.id}`, event);
		};

		websocket.onopen = () => {
			if (!this.isCurrentConnection(websocket)) return;
			this.connectingLifecycle = undefined;
			this.heart.ack = true;
			void this.options.onShardReconnect?.({ shardId: this.id });
		};
	}

	async send<T extends GatewaySendPayload = GatewaySendPayload>(force: boolean, message: T) {
		if (this.debugger) {
			this.debugger.info(
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
		}
		await this.checkOffline(force);
		const websocket = this.websocket;
		await this.bucket.acquire(force);
		await this.checkOffline(force);
		// Authentication is connection-scoped; never deliver an Identify or Resume
		// that finished waiting after its socket was replaced.
		if (
			(message.op === GatewayOpcodes.Identify || message.op === GatewayOpcodes.Resume) &&
			(!websocket || !this.isCurrentConnection(websocket))
		)
			return;
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

	heartbeat(requested: boolean) {
		const websocket = this.websocket;
		if (!websocket) return;
		this.debugger?.debug(
			`[Shard #${this.id}] Sending ${requested ? '' : 'un'}requested heartbeat (Ack=${this.heart.ack})`,
		);
		if (!requested && !this.heart.ack) {
			void this.reconnectWith(
				ShardSocketCloseCodes.ZombiedConnection,
				0,
				'Heartbeat ACK was not received before the next interval',
			).catch(error => this.logger.error(error));
			return;
		}
		if (websocket.readyState !== 1) return;
		if (!requested) {
			this.heart.ack = false;
		}

		this.heart.lastBeat = Date.now();

		websocket.send(
			JSON.stringify({
				op: GatewayOpcodes.Heartbeat,
				d: this.data.resume_seq ?? null,
			}),
		);
	}

	disconnect(code = ShardSocketCloseCodes.Shutdown) {
		this.lifecycle++;
		this.reconnectPromise = undefined;
		this.debugger?.info(`[Shard #${this.id}] Disconnecting`);
		this.closeConnection(code, 'Shard down request', this.shouldApplyLocalClosePolicy(code));
	}

	async reconnect(code = ShardSocketCloseCodes.Reconnect) {
		return this.reconnectWith(code, this.options.reconnectTimeout, 'Shard reconnect request');
	}

	private reconnectWith(
		code: number,
		wait: number,
		reason: string,
		immediate = code === ShardSocketCloseCodes.Timeout ? false : this.resumable,
	) {
		if (this.reconnectPromise) return this.reconnectPromise;
		const reconnect = (async () => {
			const lifecycle = ++this.lifecycle;
			this.debugger?.info(`[Shard #${this.id}] Reconnecting`);
			this.closeConnection(code, reason);
			if (code === ShardSocketCloseCodes.Timeout) this.resetSession();
			if (wait > 0) await delay(wait);
			if (lifecycle !== this.lifecycle) return;
			await this.connectSocket(immediate);
		})();
		const settled = reconnect.finally(() => {
			if (this.reconnectPromise === settled) this.reconnectPromise = undefined;
		});
		this.reconnectPromise = settled;
		return settled;
	}

	private isCurrentConnection(websocket: BaseSocket) {
		return this.websocket === websocket && this.handledWebsocket !== websocket;
	}

	private clearHeartbeat() {
		clearTimeout(this.firstHeartbeatTimeout);
		clearInterval(this.heart.nodeInterval);
		this.firstHeartbeatTimeout = undefined;
		this.heart.nodeInterval = undefined;
	}

	private resetSession() {
		this.data.resume_seq = null;
		this.data.session_id = undefined;
		this.data.resume_gateway_url = undefined;
		this.pendingGuilds = undefined;
	}

	private startHeartbeat(websocket: BaseSocket) {
		this.clearHeartbeat();
		this.heart.ack = true;
		this.firstHeartbeatTimeout = setTimeout(() => {
			if (!this.isCurrentConnection(websocket)) return;
			this.heartbeat(false);
			this.heart.nodeInterval = setInterval(() => {
				if (this.isCurrentConnection(websocket)) this.heartbeat(false);
			}, this.heart.interval);
		}, this.heart.interval * Math.random());
	}

	private closeConnection(code: number, reason: string, applyPolicy = false) {
		const websocket = this.websocket;
		if (!websocket) {
			this.connectingLifecycle = undefined;
			clearTimeout(this.connectionTimeout);
			this.connectionTimeout = undefined;
			this.clearHeartbeat();
			this.debugger?.warn(`[Shard #${this.id}] Is not open, reason:`, reason);
			return;
		}

		this.debugger?.debug(`[Shard #${this.id}] Called close with reason:`, reason);
		// Native and custom sockets report local Close frames differently. Mark the
		// owner before closing so both paths finalize the same lifecycle exactly once.
		this.localClose = { websocket, applyPolicy };
		try {
			websocket.close(code, reason);
		} catch (error) {
			this.localClose = undefined;
			throw error;
		}
		this.connectingLifecycle = undefined;
		if (this.handledWebsocket !== websocket) {
			const close = { code, reason, locallyInitiated: true, applyPolicy };
			void this.handleConnectionClosed(close, websocket).catch(error => this.logger.error(error));
		}
	}

	private flushOfflineSendQueue() {
		const queue = this.offlineSendQueue.splice(0);
		for (const resolve of queue) resolve();
	}

	onpacket(packet: GatewayReceivePayload) {
		if (packet.s !== null) {
			this.data.resume_seq = packet.s;
		}

		this.debugger?.debug(`[Shard #${this.id}]`, packet.t ? packet.t : GatewayOpcodes[packet.op], this.data.resume_seq);

		switch (packet.op) {
			case GatewayOpcodes.Hello: {
				const websocket = this.websocket;
				if (!websocket) return;
				clearTimeout(this.connectionTimeout);
				this.connectionTimeout = undefined;
				this.heart.interval = packet.d.heartbeat_interval;
				this.startHeartbeat(websocket);

				if (this.resumable) {
					return this.resume();
				}
				return this.identify();
			}
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
				return this.reconnectWith(ShardSocketCloseCodes.Reconnect, 0, 'Discord requested a reconnect', true);
			case GatewayOpcodes.InvalidSession: {
				const canResume = packet.d && this.resumable;
				if (!canResume) this.resetSession();
				return this.reconnectWith(
					ShardSocketCloseCodes.Reconnect,
					0,
					canResume ? 'Discord invalidated the resumable session' : 'Discord invalidated the session',
				);
			}
			case GatewayOpcodes.Dispatch:
				{
					switch (packet.t) {
						case GatewayDispatchEvents.Resumed:
							{
								clearTimeout(this.connectionTimeout);
								this.connectionTimeout = undefined;
								this.isReady = true;
								this.flushOfflineSendQueue();
								this.options.handlePayload(this.id, packet);
							}
							break;
						case GatewayDispatchEvents.Ready: {
							clearTimeout(this.connectionTimeout);
							this.connectionTimeout = undefined;
							if (hasIntent(this.options.intents, 'Guilds')) {
								this.pendingGuilds = new Set(packet.d.guilds.map(guild => guild.id));
							}

							this.data.resume_gateway_url = packet.d.resume_gateway_url;
							this.data.session_id = packet.d.session_id;
							this.flushOfflineSendQueue();
							this.options.handlePayload(this.id, packet);
							if (!this.pendingGuilds?.size) {
								this.isReady = true;
								this.options.handlePayload(this.id, {
									t: GatewayDispatchEvents.GuildsReady,
									op: packet.op,
									s: packet.s,
								});
							}
							break;
						}
						case GatewayDispatchEvents.GuildCreate:
						case GatewayDispatchEvents.GuildDelete:
							if (this.pendingGuilds?.delete(packet.d.id)) {
								(packet as any).t = `RAW_${packet.t}`;
								this.options.handlePayload(this.id, packet);
								if (this.pendingGuilds.size === 0) {
									this.isReady = true;
									this.options.handlePayload(this.id, {
										t: GatewayDispatchEvents.GuildsReady,
										op: packet.op,
										s: packet.s,
									});
								}
							} else {
								this.options.handlePayload(this.id, packet);
							}
							break;
						case GatewayDispatchEvents.GuildMembersChunk:
							{
								if (!packet.d.nonce) {
									this.options.handlePayload(this.id, packet);
									break;
								}
								const guildMemberChunk = this.requestGuildMembersChunk.get(packet.d.nonce);
								if (!guildMemberChunk) {
									this.options.handlePayload(this.id, packet);
									break;
								}
								guildMemberChunk.members.push(...packet.d.members);
								if (packet.d.presences) guildMemberChunk.presences.push(...packet.d.presences);
								guildMemberChunk.timeout.refresh();
								if (packet.d.chunk_index + 1 === packet.d.chunk_count) {
									clearTimeout(guildMemberChunk.timeout);
									this.requestGuildMembersChunk.delete(packet.d.nonce);
									guildMemberChunk.resolve({
										members: guildMemberChunk.members,
										presences: guildMemberChunk.presences,
									});
								}
								this.options.handlePayload(this.id, packet);
							}
							break;
						case GatewayDispatchEvents.RateLimited:
							{
								switch (packet.d.opcode) {
									case GatewayOpcodes.RequestGuildMembers:
										{
											const { retry_after, meta } = packet.d;
											const nonce = meta.nonce;
											if (!nonce) {
												this.options.handlePayload(this.id, packet);
												return;
											}
											if (!this.requestGuildMembersChunk.has(nonce)) {
												this.options.handlePayload(this.id, packet);
												return;
											}
											const guildMemberChunk = this.requestGuildMembersChunk.get(nonce)!;
											void delay((retry_after + 0.5) * 1e3).then(() => {
												this.send(false, {
													op: GatewayOpcodes.RequestGuildMembers,
													d: {
														...guildMemberChunk.options,
														nonce,
													},
												});
											});
										}
										break;
								}
							}
							this.options.handlePayload(this.id, packet);
							break;
						default:
							this.options.handlePayload(this.id, packet);
							break;
					}
				}
				break;
		}
		return undefined;
	}

	async requestGuildMember(
		options:
			| Omit<GatewayRequestGuildMembersDataWithQuery, 'nonce'>
			| Omit<GatewayRequestGuildMembersDataWithUserIds, 'nonce'>,
	) {
		const nonce = Date.now().toString() + Math.random().toString(36);

		let resolve: (value: { members: APIGuildMember[]; presences: GatewayGuildMembersChunkPresence[] }) => void = () => {
			//
		};
		let reject: (reason?: any) => void = () => {
			//
		};

		const promise = new Promise<{
			members: APIGuildMember[];
			presences: GatewayGuildMembersChunkPresence[];
		}>((res, rej) => {
			resolve = res;
			reject = rej;
		});
		const timeout = setTimeout(() => {
			const chunk = this.requestGuildMembersChunk.get(nonce);
			if (chunk) {
				this.requestGuildMembersChunk.delete(nonce);
				chunk.reject(
					new SeyfertError('REQUEST_GUILD_MEMBERS_TIMEOUT', { metadata: { detail: '30s without receiving a chunk' } }),
				);
			}
		}, 30_000);

		this.requestGuildMembersChunk.set(nonce, {
			members: [],
			presences: [],
			reject,
			resolve,
			timeout,
			options,
		});

		this.send(false, {
			op: GatewayOpcodes.RequestGuildMembers,
			d: {
				...options,
				nonce,
			},
		});

		return promise;
	}

	private isExpectedLocalClose(code: number) {
		return (
			code === ShardSocketCloseCodes.Shutdown ||
			code === ShardSocketCloseCodes.Reconnect ||
			code === ShardSocketCloseCodes.Resharding ||
			code === ShardSocketCloseCodes.ShutdownAll
		);
	}

	private shouldApplyLocalClosePolicy(code: number) {
		return !this.isExpectedLocalClose(code) && code !== ShardSocketCloseCodes.ZombiedConnection;
	}

	private async handleConnectionClosed(
		close: { code: number; reason: string; locallyInitiated?: boolean; applyPolicy?: boolean },
		websocket: BaseSocket | null,
	) {
		if (!websocket || !this.isCurrentConnection(websocket)) return;
		this.handledWebsocket = websocket;
		if (this.localClose?.websocket === websocket) this.localClose = undefined;
		this.isReady = false;
		this.connectingLifecycle = undefined;
		clearTimeout(this.connectionTimeout);
		this.connectionTimeout = undefined;
		this.clearHeartbeat();

		const closeMessage = `Shard #${this.id} closed: ${
			ShardSocketCloseCodes[close.code] ?? GatewayCloseCodes[close.code] ?? close.code
		} (${close.code})`;
		if (close.locallyInitiated && this.isExpectedLocalClose(close.code)) {
			this.logger.info(closeMessage, close.reason);
		} else {
			this.logger.warn(closeMessage, close.reason);
		}

		try {
			if (!close.locallyInitiated || close.applyPolicy) {
				switch (close.code) {
					case 1000:
					case GatewayCloseCodes.UnknownOpcode:
					case GatewayCloseCodes.InvalidSeq:
					case GatewayCloseCodes.SessionTimedOut:
					case ShardSocketCloseCodes.Timeout:
						{
							this.resetSession();
							await this.reconnect();
						}
						break;
					case 1001:
					case 1006:
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
						this.lifecycle++;
						this.logger.fatal(`Shard #${this.id} cannot reconnect`);
						break;
					default:
						{
							this.logger.warn(`Shard #${this.id} unknown close code (${close.code}), trying to reconnect anyways`);
							await this.reconnect();
						}
						break;
				}
			}
		} finally {
			await this.options.onShardDisconnect?.({
				shardId: this.id,
				code: close.code,
				reason: close.reason,
			});
		}
	}

	close(code: number, reason: string) {
		this.lifecycle++;
		this.reconnectPromise = undefined;
		this.closeConnection(code, reason, this.shouldApplyLocalClosePolicy(code));
	}

	protected handleMessage(data: string | Buffer) {
		let packet: GatewayDispatchPayload;
		try {
			if (data instanceof Buffer) data = inflateSync(data);
			packet = JSON.parse(data as string);
		} catch (error) {
			this.logger.error(error);
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
