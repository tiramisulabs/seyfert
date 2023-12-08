import {
  GATEWAY_BASE_URL,
  GatewayCloseCodes,
  GatewayDispatchEvents,
  GatewayDispatchPayload,
  GatewayOpcodes,
  GatewayReadyDispatchData,
  GatewayReceivePayload,
  GatewaySendPayload,
  type Logger,
} from "@biscuitland/common";
import { setTimeout as delay } from "node:timers/promises";
import { inflateSync } from "node:zlib";
import WS, { WebSocket, type CloseEvent } from "ws";
import { ShardState, properties } from "../constants";
import { DynamicBucket, PriorityQueue } from "../structures";
import { ShardHeartBeater } from "./heartbeater.js";
import { ShardData, ShardOptions, ShardSocketCloseCodes } from "./shared.js";

export class Shard {
  logger: Logger;
  data: Partial<ShardData> | ShardData;
  websocket: WebSocket | null = null;
  heartbeater: ShardHeartBeater;
  bucket: DynamicBucket;
  offlineSendQueue = new PriorityQueue<(_?: unknown) => void>();
  constructor(public id: number, protected options: ShardOptions) {
    this.options.ratelimitOptions ??= {
      rateLimitResetInterval: 60_000,
      maxRequestsPerRateLimitTick: 120,
    };
    this.logger = options.logger;
    this.data = {
      resumeSeq: null,
      resume_gateway_url: GATEWAY_BASE_URL,
    };

    this.heartbeater = new ShardHeartBeater(this);

    const safe = this.calculateSafeRequests();
    this.bucket = new DynamicBucket({
      limit: safe,
      refillAmount: safe,
      refillInterval: 6e4,
      logger: this.logger,
    });
  }

  isOpen() {
    return this.websocket?.readyState === WebSocket.OPEN;
  }

  /**
   * the state of the current shard
   */
  get state() {
    return this.data.shardState ?? ShardState.Offline;
  }

  set state(st: ShardState) {
    this.data.shardState = st;
  }

  get gatewayURL() {
    return this.data.resume_gateway_url ?? this.options.info.url;
  }

  connect() {
    if (![ShardState.Resuming, ShardState.Identifying].includes(this.state)) {
      this.state = ShardState.Connecting;
    }

    this.websocket = new WebSocket(this.gatewayURL);

    this.websocket!.onmessage = (event) => this.handleMessage(event);

    this.websocket!.onclose = (event) => this.handleClosed(event);

    this.websocket!.onerror = (event) => this.logger.error(event);

    return new Promise<Shard>((resolve, reject) => {
      const timer = setTimeout(reject, 30_000);
      this.websocket!.onopen = () => {
        if (![ShardState.Resuming, ShardState.Identifying].includes(this.state)) {
          this.state = ShardState.Unidentified;
        }

        clearTimeout(timer);
        resolve(this);
      };

      this.heartbeater = new ShardHeartBeater(this);
    });
  }

  checkOffline(priority: number) {
    if (!this.isOpen()) {
      return new Promise((resolve) => this.offlineSendQueue.push(resolve, priority));
    }
    return Promise.resolve();
  }

  async identify() {
    this.logger.debug(`[Shard #${this.id}] on identify ${this.isOpen()}`);

    this.state = ShardState.Identifying;

    this.send(0, {
      op: GatewayOpcodes.Identify,
      d: {
        token: `Bot ${this.options.token}`,
        compress: this.options.compress,
        properties,
        shard: [this.id, this.options.info.shards],
        intents: this.options.intents,
      },
    });
  }

  reconnect() {
    this.heartbeater.stopHeartbeating()
    this.disconnect();
    return this.connect();
  }

  resume() {
    this.state = ShardState.Resuming;
    const data = {
      seq: this.data.resumeSeq!,
      session_id: this.data.session_id!,
      token: `Bot ${this.options.token}`,
    };
    return this.send(0, { d: data, op: GatewayOpcodes.Resume });
  }

  /**
   * Send a message to Discord Gateway.
   * sets up the buckets aswell for every path
   * these buckets are dynamic memory however a good practice is to use 'WebSocket.send' directly
   * in simpler terms, do not use where we don't want buckets
   */
  async send<T extends GatewaySendPayload = GatewaySendPayload>(priority: number, message: T) {
    // Before acquiring a token from the bucket, check whether the shard is currently offline or not.
    // Else bucket and token wait time just get wasted.
    await this.checkOffline(priority);

    // pause the function execution for the bucket to be acquired
    await this.bucket.acquire(priority);

    // It's possible, that the shard went offline after a token has been acquired from the bucket.
    await this.checkOffline(priority);

    // send the payload at last
    this.websocket?.send(JSON.stringify(message));
  }

  protected handleMessage({ data }: WS.MessageEvent) {
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
    if ((data as string).startsWith("{")) data = JSON.parse(data as string);

    const packet = data as unknown as GatewayReceivePayload;

    // emit other events
    this.onpacket(packet);
  }

  async onpacket(packet: GatewayReceivePayload | GatewayDispatchPayload) {
    if (packet.s !== null) {
      this.data.resumeSeq = packet.s;
    }

    this.logger.debug(`[Shard #${this.id}]`, packet.t, packet.op);

    this.heartbeater.onpacket(packet);

    switch (packet.op) {
      case GatewayOpcodes.Reconnect:
        this.reconnect();
        break;
      case GatewayOpcodes.InvalidSession: {
        const resumable = packet.d && this.data.session_id
        // We need to wait for a random amount of time between 1 and 5
        // Reference: https://discord.com/developers/docs/topics/gateway#resuming
        await delay(Math.floor((Math.random() * 4 + 1) * 1000));

        if (!resumable) {
          this.data.resumeSeq = 0;
          this.data.session_id = undefined;
          await this.connect();
          break;
        }
        await this.resume();
        break;
      }
    }

    switch (packet.t) {
      case GatewayDispatchEvents.Resumed:
        this.state = ShardState.Connected;
        this.offlineSendQueue.toArray().map((resolve: () => any) => resolve());
        break;
      case GatewayDispatchEvents.Ready: {
        const payload = packet.d as GatewayReadyDispatchData;
        this.data.resume_gateway_url = payload.resume_gateway_url;
        this.data.session_id = payload.session_id;
        this.state = ShardState.Connected;
        this.offlineSendQueue.toArray().map((resolve: () => any) => resolve());
        this.options.handlePayload(this.id, packet);
        break;
      }
      default:
        this.options.handlePayload(this.id, packet as GatewayDispatchPayload);
        break;
    }
  }

  close(code: number, reason: string) {
    if (this.websocket?.readyState !== WebSocket.OPEN) return;
    this.websocket?.close(code, reason);
  }

  disconnect() {
    this.logger.info(`[Shard #${this.id}]`, "Disconnect", ...arguments);
    this.close(ShardSocketCloseCodes.Shutdown, "Shard down request");
    this.state = ShardState.Offline;
  }

  protected async handleClosed(close: CloseEvent) {
    this.heartbeater.stopHeartbeating();

    switch (close.code) {
      case ShardSocketCloseCodes.Shutdown:
      case ShardSocketCloseCodes.ReIdentifying:
      case ShardSocketCloseCodes.Resharded:
      case ShardSocketCloseCodes.ResumeClosingOldConnection:
      case ShardSocketCloseCodes.ZombiedConnection:
        this.state = ShardState.Disconnected;
        return;

      case GatewayCloseCodes.UnknownOpcode:
      case GatewayCloseCodes.NotAuthenticated:
      case GatewayCloseCodes.InvalidSeq:
      case GatewayCloseCodes.RateLimited:
      case GatewayCloseCodes.SessionTimedOut:
        this.logger.debug(`[Shard #${this.id}] Gateway connection closing requiring re-identify. Code: ${close.code}`);
        this.state = ShardState.Identifying;

        this.connect();
        break;
      case GatewayCloseCodes.AuthenticationFailed:
      case GatewayCloseCodes.InvalidShard:
      case GatewayCloseCodes.ShardingRequired:
      case GatewayCloseCodes.InvalidAPIVersion:
      case GatewayCloseCodes.InvalidIntents:
      case GatewayCloseCodes.DisallowedIntents:
        this.state = ShardState.Offline;

        throw new Error(close.reason || "Discord gave no reason! GG! You broke Discord!");
      // Gateway connection closes on which a resume is allowed.
      default:
        this.logger.info(`[Shard #${this.id}] (${close.code}) closed shard #${this.id}. Resuming...`);
        this.state = ShardState.Resuming;

        this.disconnect();
        await this.connect();
    }
  }

  /** Calculate the amount of requests which can safely be made per rate limit interval, before the gateway gets disconnected due to an exceeded rate limit. */
  calculateSafeRequests(): number {
    // * 2 adds extra safety layer for discords OP 1 requests that we need to respond to
    const safeRequests =
      this.options.ratelimitOptions!.maxRequestsPerRateLimitTick -
      Math.ceil(this.options.ratelimitOptions!.rateLimitResetInterval / this.heartbeater!.heart.interval) * 2;

    if (safeRequests < 0) return 0;
    return safeRequests;
  }
}
