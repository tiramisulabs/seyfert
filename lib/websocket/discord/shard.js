"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Shard = void 0;
const v10_1 = require("discord-api-types/v10");
const node_zlib_1 = require("node:zlib");
const ws_1 = require("ws");
const common_1 = require("../../common");
const constants_1 = require("../constants");
const structures_1 = require("../structures");
const timeout_1 = require("../structures/timeout");
const basesocket_1 = require("./basesocket");
const shared_1 = require("./shared");
class Shard {
    id;
    debugger;
    data = {
        resumeSeq: null,
    };
    websocket = null;
    connectTimeout = new timeout_1.ConnectTimeout();
    heart = {
        interval: 30e3,
        ack: true,
    };
    bucket;
    offlineSendQueue = [];
    options;
    constructor(id, options) {
        this.id = id;
        this.options = (0, common_1.MergeOptions)(options, {
            properties: constants_1.properties,
            ratelimitOptions: {
                rateLimitResetInterval: 60_000,
                maxRequestsPerRateLimitTick: 120,
            },
        });
        if (options.debugger)
            this.debugger = options.debugger;
        const safe = this.calculateSafeRequests();
        this.bucket = new structures_1.DynamicBucket({ refillInterval: 6e4, limit: safe, debugger: options.debugger });
    }
    get latency() {
        return this.heart.lastAck && this.heart.lastBeat
            ? this.heart.lastAck - this.heart.lastBeat
            : Number.POSITIVE_INFINITY;
    }
    get isOpen() {
        return this.websocket?.readyState === ws_1.WebSocket.OPEN;
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
        if (!this.websocket)
            return Promise.resolve(Number.POSITIVE_INFINITY);
        return this.websocket.ping();
    }
    async connect() {
        await this.connectTimeout.wait();
        if (this.isOpen) {
            this.debugger?.debug(`[Shard #${this.id}] attempted to connect while open`);
            return;
        }
        this.debugger?.debug(`[Shard #${this.id}] Connecting to ${this.currentGatewayURL}`);
        // @ts-expect-error @types/bun cause erros in compile
        // biome-ignore lint/correctness/noUndeclaredVariables: /\ bun lol
        this.websocket = new basesocket_1.BaseSocket(typeof Bun === 'undefined' ? 'ws' : 'bun', this.currentGatewayURL);
        this.websocket.onmessage = (event) => this.handleMessage(event);
        this.websocket.onclose = (event) => this.handleClosed(event);
        this.websocket.onerror = (event) => this.debugger?.error(event);
        this.websocket.onopen = () => {
            this.heart.ack = true;
        };
    }
    async send(force, message) {
        this.debugger?.info(`[Shard #${this.id}] Sending: ${v10_1.GatewayOpcodes[message.op]} ${JSON.stringify(message.d, (_, value) => {
            if (typeof value === 'string')
                return value.replaceAll(this.options.token, v => {
                    const split = v.split('.');
                    return `${split[0]}.${'*'.repeat(split[1].length)}.${'*'.repeat(split[2].length)}`;
                });
            return value;
        }, 1)}`);
        await this.checkOffline(force);
        await this.bucket.acquire(force);
        await this.checkOffline(force);
        this.websocket?.send(JSON.stringify(message));
    }
    async identify() {
        await this.send(true, {
            op: v10_1.GatewayOpcodes.Identify,
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
        return !!(this.data.resume_gateway_url && this.data.session_id && this.data.resumeSeq !== null);
    }
    async resume() {
        await this.send(true, {
            op: v10_1.GatewayOpcodes.Resume,
            d: {
                seq: this.data.resumeSeq,
                session_id: this.data.session_id,
                token: `Bot ${this.options.token}`,
            },
        });
    }
    async heartbeat(requested) {
        this.debugger?.debug(`[Shard #${this.id}] Sending ${requested ? '' : 'un'}requested heartbeat (Ack=${this.heart.ack})`);
        if (!requested) {
            if (!this.heart.ack) {
                await this.close(shared_1.ShardSocketCloseCodes.ZombiedConnection, 'Zombied connection');
                return;
            }
            this.heart.ack = false;
        }
        this.heart.lastBeat = Date.now();
        this.websocket.send(JSON.stringify({
            op: v10_1.GatewayOpcodes.Heartbeat,
            d: this.data.resumeSeq ?? null,
        }));
    }
    async disconnect() {
        this.debugger?.info(`[Shard #${this.id}] Disconnecting`);
        await this.close(shared_1.ShardSocketCloseCodes.Shutdown, 'Shard down request');
    }
    async reconnect() {
        this.debugger?.info(`[Shard #${this.id}] Reconnecting`);
        await this.disconnect();
        await this.connect();
    }
    async onpacket(packet) {
        if (packet.s !== null) {
            this.data.resumeSeq = packet.s;
        }
        this.debugger?.debug(`[Shard #${this.id}]`, packet.t ? packet.t : v10_1.GatewayOpcodes[packet.op], this.data.resumeSeq);
        switch (packet.op) {
            case v10_1.GatewayOpcodes.Hello:
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
            case v10_1.GatewayOpcodes.HeartbeatAck:
                this.heart.ack = true;
                this.heart.lastAck = Date.now();
                break;
            case v10_1.GatewayOpcodes.Heartbeat:
                this.heartbeat(true);
                break;
            case v10_1.GatewayOpcodes.Reconnect:
                await this.reconnect();
                break;
            case v10_1.GatewayOpcodes.InvalidSession:
                if (packet.d) {
                    if (!this.resumable) {
                        return this.debugger?.fatal(`[Shard #${this.id}] This is a completely unexpected error message.`);
                    }
                    await this.resume();
                }
                else {
                    this.data.resumeSeq = 0;
                    this.data.session_id = undefined;
                    await this.identify();
                }
                break;
            case v10_1.GatewayOpcodes.Dispatch:
                {
                    switch (packet.t) {
                        case v10_1.GatewayDispatchEvents.Resumed:
                            this.offlineSendQueue.map((resolve) => resolve());
                            this.options.handlePayload(this.id, packet);
                            break;
                        case v10_1.GatewayDispatchEvents.Ready: {
                            this.data.resume_gateway_url = packet.d.resume_gateway_url;
                            this.data.session_id = packet.d.session_id;
                            this.offlineSendQueue.map((resolve) => resolve());
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
    async handleClosed(close) {
        clearInterval(this.heart.nodeInterval);
        this.debugger?.warn(`[Shard #${this.id}] ${shared_1.ShardSocketCloseCodes[close.code] ?? v10_1.GatewayCloseCodes[close.code] ?? close.code} (${close.code})`);
        switch (close.code) {
            case shared_1.ShardSocketCloseCodes.Shutdown:
                //Force disconnect, ignore
                break;
            case 1000:
            case 1001:
            case 1006:
            case shared_1.ShardSocketCloseCodes.ZombiedConnection:
            case v10_1.GatewayCloseCodes.UnknownError:
            case v10_1.GatewayCloseCodes.UnknownOpcode:
            case v10_1.GatewayCloseCodes.DecodeError:
            case v10_1.GatewayCloseCodes.NotAuthenticated:
            case v10_1.GatewayCloseCodes.AlreadyAuthenticated:
            case v10_1.GatewayCloseCodes.InvalidSeq:
            case v10_1.GatewayCloseCodes.RateLimited:
            case v10_1.GatewayCloseCodes.SessionTimedOut:
                this.debugger?.info(`[Shard #${this.id}] Trying to reconnect`);
                await this.reconnect();
                break;
            case v10_1.GatewayCloseCodes.AuthenticationFailed:
            case v10_1.GatewayCloseCodes.DisallowedIntents:
            case v10_1.GatewayCloseCodes.InvalidAPIVersion:
            case v10_1.GatewayCloseCodes.InvalidIntents:
            case v10_1.GatewayCloseCodes.InvalidShard:
            case v10_1.GatewayCloseCodes.ShardingRequired:
                this.debugger?.fatal(`[Shard #${this.id}] cannot reconnect`);
                break;
            default:
                this.debugger?.warn(`[Shard #${this.id}] Unknown close code, trying to reconnect anyways`);
                await this.reconnect();
                break;
        }
    }
    async close(code, reason) {
        if (this.websocket?.readyState !== ws_1.WebSocket.OPEN) {
            return this.debugger?.warn(`[Shard #${this.id}] Is not open`);
        }
        this.debugger?.warn(`[Shard #${this.id}] Called close`);
        this.websocket?.close(code, reason);
    }
    handleMessage({ data }) {
        if (data instanceof Buffer) {
            data = (0, node_zlib_1.inflateSync)(data);
        }
        return this.onpacket(JSON.parse(data));
    }
    checkOffline(force) {
        if (!this.isOpen) {
            return new Promise(resolve => this.offlineSendQueue[force ? 'unshift' : 'push'](resolve));
        }
        return Promise.resolve();
    }
    calculateSafeRequests() {
        const safeRequests = this.options.ratelimitOptions.maxRequestsPerRateLimitTick -
            Math.ceil(this.options.ratelimitOptions.rateLimitResetInterval / this.heart.interval) * 2;
        if (safeRequests < 0) {
            return 0;
        }
        return safeRequests;
    }
}
exports.Shard = Shard;
