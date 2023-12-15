import { inflateSync } from 'node:zlib';
import type { GatewayReceivePayload, GatewaySendPayload, Logger } from '@biscuitland/common';
import { GatewayCloseCodes, GatewayDispatchEvents, GatewayOpcodes } from '@biscuitland/common';
import type WS from 'ws';
import { type CloseEvent, WebSocket } from 'ws';
import { properties } from '../constants';
import { ConnectTimeout, DynamicBucket, PriorityQueue } from '../structures';
import type { ShardData, ShardOptions } from './shared';
import { ShardSocketCloseCodes } from './shared';

export class Shard {
  logger: Logger;
  data: Partial<ShardData> | ShardData = {
    resumeSeq: null
  };

  websocket: WebSocket | null = null;
  connectTimeout = new ConnectTimeout();
  heart: {
    interval: number;
    nodeInterval?: NodeJS.Timeout;
    lastAck?: number;
    lastBeat?: number;
    ack: boolean;
  } = {
    interval: 30e3,
    ack: true
  };

  bucket: DynamicBucket;
  offlineSendQueue = new PriorityQueue<(_?: unknown) => void>();

  constructor(public id: number, protected options: ShardOptions) {
    this.options.ratelimitOptions ??= {
      rateLimitResetInterval: 60_000,
      maxRequestsPerRateLimitTick: 120
    };
    this.logger = options.logger;

    const safe = this.calculateSafeRequests();
    this.bucket = new DynamicBucket({
      limit: safe,
      refillAmount: safe,
      refillInterval: 6e4,
      logger: this.logger
    });
  }

  get latency() {
    return this.heart.lastAck && this.heart.lastBeat ? this.heart.lastAck - this.heart.lastBeat : Infinity;
  }

  get isOpen() {
    return this.websocket?.readyState === WebSocket.OPEN;
  }

  get gatewayURL() {
    return this.options.info.url;
  }

  get resumeGatewayURL() {
    return this.data.resume_gateway_url;
  }

  get currentGatewayURL() {
    return this.resumeGatewayURL ?? this.options.info.url;
  }

  async connect() {
    await this.connectTimeout.wait();

    this.logger.debug(`[Shard #${this.id}] Connecting to ${this.currentGatewayURL}`);

    this.websocket = new WebSocket(this.currentGatewayURL);

    this.websocket!.onmessage = (event) => this.handleMessage(event);

    this.websocket!.onclose = (event) => this.handleClosed(event);

    this.websocket!.onerror = (event) => this.logger.error(event);

    this.websocket!.onopen = () => {
      this.heart.ack = true;
    };
  }

  async send<T extends GatewaySendPayload = GatewaySendPayload>(priority: number, message: T) {
    this.logger.info(`[Shard #${this.id}] Sending: ${GatewayOpcodes[message.op]} ${JSON.stringify(message.d, null, 1)}`);
    await this.checkOffline(priority);
    await this.bucket.acquire(priority);
    await this.checkOffline(priority);
    this.websocket?.send(JSON.stringify(message));
  }

  async identify() {
    await this.send(0, {
      op: GatewayOpcodes.Identify,
      d: {
        token: `Bot ${this.options.token}`,
        compress: this.options.compress,
        properties,
        shard: [this.id, this.options.info.shards],
        intents: this.options.intents,
        presence: this.options.presence
      }
    });
  }

  get resumable() {
    return !!(this.data.resume_gateway_url && this.data.session_id && this.data.resumeSeq !== null);
  }

  async resume() {
    await this.send(0, {
      op: GatewayOpcodes.Resume,
      d: {
        seq: this.data.resumeSeq!,
        session_id: this.data.session_id!,
        token: `Bot ${this.options.token}`
      }
    });
  }

  async heartbeat(requested: boolean) {
    this.logger.debug(`[Shard #${this.id}] Sending ${requested ? '' : 'un'}requested heartbeat (Ack=${this.heart.ack})`);
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
        d: this.data.resumeSeq ?? null
      })
    );
  }

  async disconnect() {
    this.logger.info(`[Shard #${this.id}] Disconnecting`);
    await this.close(ShardSocketCloseCodes.Shutdown, 'Shard down request');
  }

  async reconnect() {
    this.logger.info(`[Shard #${this.id}] Reconnecting`);
    await this.disconnect();
    await this.connect();
  }

  async onpacket(packet: GatewayReceivePayload) {
    if (packet.s !== null) {
      this.data.resumeSeq = packet.s;
    }

    this.logger.debug(`[Shard #${this.id}]`, packet.t ? packet.t : GatewayOpcodes[packet.op], this.data.resumeSeq);

    switch (packet.op) {
      case GatewayOpcodes.Hello:
        clearInterval(this.heart.nodeInterval);

        this.heart.interval = packet.d.heartbeat_interval;

        // await delay(Math.ceil(this.heart.interval * (Math.random() || 0.5)));
        await this.heartbeat(false);
        this.heart.nodeInterval = setInterval(() => this.heartbeat(false), this.heart.interval);

        if (this.resumable) {
          return this.resume();
        }
        await this.identify();
        break;
      case GatewayOpcodes.HeartbeatAck:
        this.heart.ack = true;
        this.heart.lastAck = Date.now();
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
            return this.logger.fatal(`[Shard #${this.id}] This is a completely unexpected error message.`);
          }
          await this.resume();
        } else {
          this.data.resumeSeq = 0;
          this.data.session_id = undefined;
          await this.identify();
        }
        break;
      case GatewayOpcodes.Dispatch:
        switch (packet.t) {
          case GatewayDispatchEvents.Resumed:
            this.offlineSendQueue.toArray().map((resolve: () => any) => resolve());
            break;
          case GatewayDispatchEvents.Ready:
            this.data.resume_gateway_url = packet.d.resume_gateway_url;
            this.data.session_id = packet.d.session_id;
            this.offlineSendQueue.toArray().map((resolve: () => any) => resolve());
            this.options.handlePayload(this.id, packet);
            break;
          default:
            this.options.handlePayload(this.id, packet);
            break;
        }
        break;
    }
  }

  protected async handleClosed(close: CloseEvent) {
    clearInterval(this.heart.nodeInterval);
    this.logger.warn(`[Shard #${this.id}] ${GatewayCloseCodes[close.code] ?? close.code}`);

    switch (close.code) {
      case ShardSocketCloseCodes.Shutdown:
        break;
      case 1000:
      case 1001:
      case 1006:
      case ShardSocketCloseCodes.ZombiedConnection:
      case GatewayCloseCodes.UnknownError:
      case GatewayCloseCodes.UnknownOpcode:
      case GatewayCloseCodes.DecodeError:
      case GatewayCloseCodes.NotAuthenticated:
      case GatewayCloseCodes.AlreadyAuthenticated:
      case GatewayCloseCodes.InvalidSeq:
      case GatewayCloseCodes.RateLimited:
      case GatewayCloseCodes.SessionTimedOut:
        this.logger.info(`[Shard #${this.id}] Trying to reconnect`);
        await this.reconnect();
        break;

      case GatewayCloseCodes.AuthenticationFailed:
      case GatewayCloseCodes.DisallowedIntents:
      case GatewayCloseCodes.InvalidAPIVersion:
      case GatewayCloseCodes.InvalidIntents:
      case GatewayCloseCodes.InvalidShard:
      case GatewayCloseCodes.ShardingRequired:
        this.logger.fatal(`[Shard #${this.id}] cannot reconnect`);
        break;

      default:
        this.logger.warn(`[Shard #${this.id}] Unknown close code, trying to reconnect anyways`);
        await this.reconnect();
        break;
    }
  }

  async close(code: number, reason: string) {
    if (this.websocket?.readyState !== WebSocket.OPEN) {
      return this.logger.warn(`${new Error('418').stack} [Shard #${this.id}] Is not open`);
    }
    this.logger.warn(`${new Error('418').stack} [Shard #${this.id}] Called close`);
    this.websocket?.close(code, reason);
  }

  protected async handleMessage({ data }: WS.MessageEvent) {
    if (data instanceof Buffer) {
      data = inflateSync(data);
    }
    /**
     * Idk why, but Bun sends this event when websocket connects.
     * MessageEvent {
     *  type: "message",
     *  data: "Already authenticated."
     * }
     */
    if ((data as string).startsWith('{')) {
      data = JSON.parse(data as string);
    }

    const packet = data as unknown as GatewayReceivePayload;

    return this.onpacket(packet);
  }

  checkOffline(priority: number) {
    if (!this.isOpen) {
      return new Promise((resolve) => this.offlineSendQueue.push(resolve, priority));
    }
    return Promise.resolve();
  }

  calculateSafeRequests(): number {
    const safeRequests =
      this.options.ratelimitOptions!.maxRequestsPerRateLimitTick -
      Math.ceil(this.options.ratelimitOptions!.rateLimitResetInterval / this.heart.interval) * 2;

    if (safeRequests < 0) {
      return 0;
    }
    return safeRequests;
  }
}
