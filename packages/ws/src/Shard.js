"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShardEvents = exports.Shard = void 0;
const common_1 = require("@biscuitland/common");
const v10_1 = require("discord-api-types/v10");
const ws_1 = require("ws");
const Bucket_1 = require("./utils/Bucket");
class Shard {
    constructor(manager, options) {
        this.manager = manager;
        this.options = options;
        this.decoder = new TextDecoder();
        this.status = 'Disconnected';
        this.lastHeartbeatAt = -1;
        this.heartbeatAck = false;
        this.sessionID = null;
        this.sequence = 0;
        this.websocket = null;
        this.interval = 45000;
        this.heartbeatInterval = null;
        this.resolves = new Map();
        this.resumeURL = null;
        this.bucket = (0, Bucket_1.createLeakyBucket)({
            max: 120,
            refillInterval: 60000,
            refillAmount: 120,
        });
    }
    get state() {
        return this.status;
    }
    async connect() {
        if (this.websocket && this.websocket.readyState !== ws_1.WebSocket.CLOSED) {
            return;
        }
        this.status = 'Connecting';
        const url = this.resumeURL ?? common_1.GATEWAY_BASE_URL;
        this.debug('Debug', this.options.id, [`Connecting to ${url}`]);
        this.websocket = new ws_1.WebSocket(url);
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
        const d = {
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
        await this.send({
            op: v10_1.GatewayOpcodes.Identify,
            d,
        });
    }
    async resume() {
        this.debug('Resumed', this.options.id);
        this.status = 'Resuming';
        await this.send({
            op: v10_1.GatewayOpcodes.Resume,
            d: {
                token: `Bot ${this.manager.options.token}`,
                session_id: this.sessionID,
                seq: this.sequence,
            },
        });
    }
    destroy() {
        this.websocket = null;
        this.bucket = (0, Bucket_1.createLeakyBucket)({
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
        if (this.websocket.readyState !== ws_1.WebSocket.CLOSED) {
            this.websocket.removeAllListeners();
            if (this.sessionID && reconnect) {
                if (this.websocket.readyState !== ws_1.WebSocket.OPEN) {
                    this.websocket.close(4999, 'Reconnect');
                }
                else {
                    this.websocket.terminate();
                }
            }
            else {
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
        this.send({
            op: v10_1.GatewayOpcodes.Heartbeat,
            d: this.sequence,
        }, true);
    }
    async send(payload, priority = false) {
        if (this.websocket && this.websocket.readyState === ws_1.WebSocket.OPEN) {
            await this.bucket.acquire(1, priority);
            this.websocket.send(JSON.stringify(payload));
        }
    }
    async onMessage(data) {
        const payload = this.unPack(data);
        if (payload.s != null) {
            this.sequence = payload.s;
        }
        switch (payload.op) {
            case v10_1.GatewayOpcodes.Dispatch:
                switch (payload.t) {
                    case v10_1.GatewayDispatchEvents.Ready:
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
                    case v10_1.GatewayDispatchEvents.Resumed:
                        this.debug('Resumed', this.options.id, [
                            'Shard has been resumed',
                        ]);
                        this.status = 'Ready';
                        this.resolves.get('RESUMED')?.(payload);
                        this.resolves.delete('RESUMED');
                        break;
                }
                break;
            case v10_1.GatewayOpcodes.Heartbeat:
                this.heartbeat(true);
                break;
            case v10_1.GatewayOpcodes.Reconnect:
                this.disconnect(true);
                break;
            case v10_1.GatewayOpcodes.InvalidSession:
                this.debug('Debug', this.options.id, [
                    'Invalid session recieved',
                ]);
                if (payload.d) {
                    this.resume();
                }
                else {
                    this.sessionID = null;
                    this.sequence = 0;
                    this.identify();
                }
                break;
            case v10_1.GatewayOpcodes.Hello:
                if (payload.d.heartbeat_interval > 0) {
                    if (this.heartbeatInterval) {
                        clearInterval(this.heartbeatInterval);
                    }
                    this.heartbeatInterval = setInterval(() => this.heartbeat(), payload.d.heartbeat_interval);
                    this.interval = payload.d.heartbeat_interval;
                }
                if (this.status !== 'Resuming') {
                    this.bucket = (0, Bucket_1.createLeakyBucket)({
                        max: this.safe(),
                        refillInterval: 60000,
                        refillAmount: this.safe(),
                        waiting: this.bucket.waiting,
                    });
                }
                if (this.sessionID) {
                    await this.resume();
                }
                else {
                    await this.identify();
                    this.heartbeat();
                }
                break;
            case v10_1.GatewayOpcodes.HeartbeatAck:
                this.heartbeatAck = true;
                break;
        }
        this.manager.emit('payload', this, payload);
    }
    onClose(code) {
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
    async onOpen() {
        this.debug('Open', this.options.id, ['Shard handshaking']);
        this.status = 'Handshaking';
        this.heartbeatAck = true;
    }
    unPack(data) {
        return JSON.parse(this.decoder.decode(new Uint8Array(data)));
    }
    debug(event, shardId, messages) {
        this.manager.emit(`shard${event}`, shardId, messages);
    }
    safe() {
        const requests = 120 - Math.ceil(60000 / this.interval) * 2;
        return requests < 0 ? 0 : requests;
    }
}
exports.Shard = Shard;
Shard.DEFAULTS = {
    timeout: 15000
};
var ShardEvents;
(function (ShardEvents) {
    ShardEvents[ShardEvents["Open"] = 0] = "Open";
    ShardEvents[ShardEvents["Message"] = 1] = "Message";
    ShardEvents[ShardEvents["Close"] = 2] = "Close";
    ShardEvents[ShardEvents["Error"] = 3] = "Error";
    ShardEvents[ShardEvents["Ready"] = 4] = "Ready";
    ShardEvents[ShardEvents["Resumed"] = 5] = "Resumed";
    ShardEvents[ShardEvents["Send"] = 6] = "Send";
    ShardEvents[ShardEvents["Debug"] = 7] = "Debug";
})(ShardEvents = exports.ShardEvents || (exports.ShardEvents = {}));
