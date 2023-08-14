import type {
  GatewayDispatchPayload,
  GatewayHeartbeatRequest,
  GatewayHello,
  GatewayReceivePayload,
  GatewaySendPayload,
  When,
} from "@biscuitland/common";

import {
  GATEWAY_BASE_URL,
  GatewayVersion as GATEWAY_VERSION,
  GatewayCloseCodes,
  GatewayDispatchEvents,
  GatewayOpcodes,
  Logger,
} from "@biscuitland/common";
import { inflateSync } from "node:zlib";
import { WebSocket, type MessageEvent } from "ws";
import { COMPRESS, ShardState, properties } from "../constants/index";
import { DynamicBucket, PriorityQueue } from "../structures/index";
import type { ShardData, ShardOptions } from "./shared";

export interface ShardHeart {
  /** Whether or not the heartbeat was acknowledged by Discord in time. */
  ack: boolean;
  /** Interval between heartbeats requested by Discord. */
  interval: number;
  /** Id of the interval, which is used for sending the heartbeats. */
  intervalId?: NodeJS.Timer;
  /** Unix (in milliseconds) timestamp when the last heartbeat ACK was received from Discord. */
  lastAck?: number;
  /** Unix timestamp (in milliseconds) when the last heartbeat was sent. */
  lastBeat?: number;
  /** Round trip time (in milliseconds) from Shard to Discord and back.
   * Calculated using the heartbeat system.
   * Note: this value is undefined until the first heartbeat to Discord has happened.
   */
  rtt?: number;
  /** Id of the timeout which is used for sending the first heartbeat to Discord since it's "special". */
  timeoutId?: NodeJS.Timeout;
  /** internal value */
  toString(): string;
}

export class ShardHeartbeater {
  shard: Shard<true>;
  heart: ShardHeart;

  constructor(shard: Shard<true>) {
    this.shard = shard;
    this.heart = {
      ack: false,
      interval: 30_000,
    };
  }

  acknowledge(ack = true) {
    this.heart.ack = ack;
  }

  async handleHeartbeat(_packet: Extract<GatewayReceivePayload, GatewayHeartbeatRequest>) {
    this.shard.logger.debug("received hearbeat event");
    this.heartbeat(false);
  }

  async handleHello(packet: GatewayHello) {
    if (packet.d.heartbeat_interval > 0) {
      if (this.heart.interval != null) {
        this.stopHeartbeating();
      }

      this.heart.interval = packet.d.heartbeat_interval;
      this.heart.intervalId = setInterval(() => {
        this.acknowledge(false);
        this.heartbeat(false);
      }, this.heart.interval);
    }

    const interval: number = packet.d.heartbeat_interval;
    return this.startHeartbeating(interval);
  }

  async onpacket(packet: GatewayReceivePayload) {
    switch (packet.op) {
      case GatewayOpcodes.Hello: {
        return this.handleHello(packet);
      }
      case GatewayOpcodes.Heartbeat: {
        return this.handleHeartbeat(packet);
      }
      case GatewayOpcodes.HeartbeatAck: {
        this.acknowledge();
        return (this.heart.lastAck = Date.now());
      }
    }
  }

  /**
   * sends a heartbeat whenever its needed
   * fails if heart.interval is null
   */
  heartbeat(acknowledgeAck: boolean) {
    if (acknowledgeAck) {
      if (!this.heart.lastAck) this.shard.disconnect({ reconnect: () => this.shard.resume() });
      this.heart.lastAck = undefined;
    }

    this.heart.lastBeat = Date.now();

    // avoid creating a bucket here
    this.shard.websocket.send(
      JSON.stringify({
        op: GatewayOpcodes.Heartbeat,
        d: this.shard.data.resumeSeq,
      }),
    );
  }

  /**
   * wait the first interval upon receiving the hello event, then start heartbiting
   * interval * jitter
   * @param interval the packet interval
   */
  async startHeartbeating(interval: number) {
    this.heart.interval = interval;
    this.shard.logger.debug("scheduling heartbeat!");

    // The first heartbeat needs to be send with a random delay between `0` and `interval`
    // Using a `setTimeout(_, jitter)` here to accomplish that.
    // `Math.random()` can be `0` so we use `0.5` if this happens
    // Reference: https://discord.com/developers/docs/topics/gateway#heartbeating
    const jitter = Math.ceil(this.heart.interval * (Math.random() || 0.5));

    return (this.heart.timeoutId = setTimeout(() => {
      // send a heartbeat
      this.heartbeat(false);
      this.heart.intervalId = setInterval(() => {
        this.acknowledge(false);
        this.heartbeat(false);
      }, this.heart.interval);
    }, jitter));
  }

  stopHeartbeating() {
    clearTimeout(this.heart.intervalId);
    return clearTimeout(this.heart.timeoutId);
  }
}

export class Shard<Connected extends boolean = true> {
  constructor(id: number, protected options: ShardOptions) {
    this.options.ratelimitOptions ??= {
      rateLimitResetInterval: 60_000,
      maxRequestsPerRateLimitTick: 120,
    };
    this.data = {
      id,
      resume_gateway_url: GATEWAY_BASE_URL,
      resumeSeq: null,
    } as never;
    this.websocket = null as never;
    this.ready = false;
    this.handlePayload = (packet) => {
      // do not ->
      // decorate this function
      if (packet.t === "READY") {
        this.logger.debug("received ready event");
        this.data.resume_gateway_url = `${packet.d.resume_gateway_url}?v=${GATEWAY_VERSION}&encoding=json`;
        this.logger.debug("switch resume url");
        this.data.session_id = packet.d.session_id;
      }

      this.options.handlePayload(this.data.id ?? id, packet);
    };

    // we create an empty heartbeater just to get the interval variable
    this.heartbeater = new ShardHeartbeater(this as Shard<true>) as never;

    const safe = this.calculateSafeRequests();

    this.bucket = new DynamicBucket({
      limit: safe,
      refillAmount: safe,
      refillInterval: 6e4,
      debug: this.options.debug,
    });
    this.logger = new Logger({
      name: "[Shard]",
      active: this.options.debug,
      logLevel: 0,
    });
  }

  websocket: When<Connected, WebSocket, null>;
  heartbeater: When<Connected, ShardHeartbeater, null>;
  data: When<Connected, ShardData, Partial<ShardData>>;
  handlePayload: (packet: GatewayDispatchPayload) => unknown;
  offlineSendQueue: PriorityQueue<(_?: unknown) => void> = new PriorityQueue();
  bucket: DynamicBucket;
  logger: Logger;
  resolves: Map<"READY" | "RESUMED" | "INVALID_SESSION", (payload: GatewayReceivePayload) => void> = new Map();

  /** wheter the shard was already identified */
  ready: boolean;

  /**
   * a guard of wheter is connected or not
   */
  isConnected(): this is Shard<true> {
    {
      return this.websocket?.readyState === WebSocket.OPEN;
    }
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

  /**
   * pushes dead requests for the bot to resolve later on send payload
   * this is a remanecent of the old gateway but I (Yuzu) decided to let it untouched
   */
  async checkOffline(priority: number) {
    if (!this.isConnected()) {
      return new Promise((resolve) => this.offlineSendQueue.push(resolve, priority));
    }
    return;
  }

  /**
   * Send a message to Discord Gateway.
   * sets up the buckets aswell for every path
   * these buckets are dynamic memory however a good practice is to use 'WebSocket.send' directly
   * in simpler terms, do not use where we don't want buckets
   */
  async send(this: Shard<true>, priority: number, message: GatewaySendPayload) {
    // Before acquiring a token from the bucket, check whether the shard is currently offline or not.
    // Else bucket and token wait time just get wasted.
    await this.checkOffline(priority);

    // pause the function execution for the bucket to be acquired
    await this.bucket.acquire(priority);

    // It's possible, that the shard went offline after a token has been acquired from the bucket.
    await this.checkOffline(priority);

    // send the payload at last
    this.websocket.send(JSON.stringify(message));
  }

  /** starts the ws connection */
  async connect(): Promise<Shard<true>> {
    if (this.state === ShardState.Resuming) {
      this.state = ShardState.Connecting;
    }
    if (this.state === ShardState.Identifying) {
      this.state = ShardState.Connecting;
    }

    // set client
    const websocket = new WebSocket(this.data.session_id ? this.gatewayURL : this.options.info.url);
    this.websocket = websocket as When<Connected, WebSocket>;

    this.websocket.onmessage = async (event) => {
      return await (this as Shard<true>).handleMessage(event);
    };

    this.websocket.onerror = (event) => {
      return this.logger.error({ error: event, shardId: this.data.id });
    };

    this.websocket.onclose = async (event) => {
      return await (this as Shard<true>).handleClose(event.code, event.reason);
    };

    return new Promise<Shard<true>>((resolve, _reject) => {
      this.websocket!.onopen = () => {
        if (this.state === ShardState.Resuming) {
          this.state = ShardState.Unidentified;
        }
        if (this.state === ShardState.Identifying) {
          this.state = ShardState.Unidentified;
        }
        resolve(this as Shard<true>);
      };

      // set hearbeater
      const heartbeater = new ShardHeartbeater(this as Shard<true>);
      this.heartbeater = heartbeater as When<Connected, ShardHeartbeater, null>;
    });
  }

  /** Handle an incoming gateway message. */
  async handleMessage(this: Shard<true>, event: MessageEvent) {
    let preProcessMessage = event.data;

    if (preProcessMessage instanceof Buffer) {
      preProcessMessage = inflateSync(preProcessMessage);
    }

    if (typeof preProcessMessage === "string") {
      const packet = JSON.parse(preProcessMessage);

      // emit heartbeat events
      this.heartbeater.onpacket(packet);

      // try to identify
      if (packet.op === GatewayOpcodes.Hello) {
        this.identify();
      }

      // emit other events
      this.onpacket(packet);
    }
    return;
  }

  async handleClose(this: Shard<true>, code: number, reason: string) {
    this.heartbeater.stopHeartbeating();

    switch (code) {
      case 1000: {
        this.logger.info("Uknown error code trying to resume");
        return this.resume();
      }
      case GatewayCloseCodes.UnknownOpcode:
      case GatewayCloseCodes.NotAuthenticated:
      case GatewayCloseCodes.InvalidSeq:
      case GatewayCloseCodes.RateLimited:
      case GatewayCloseCodes.SessionTimedOut:
        this.logger.info(`Gateway connection closing requiring re-identify. Code: ${code}`);
        this.state = ShardState.Identifying;
        return this.identify();
      case GatewayCloseCodes.AuthenticationFailed:
      case GatewayCloseCodes.InvalidShard:
      case GatewayCloseCodes.ShardingRequired:
      case GatewayCloseCodes.InvalidAPIVersion:
      case GatewayCloseCodes.InvalidIntents:
      case GatewayCloseCodes.DisallowedIntents:
        this.state = ShardState.Offline;
        // disconnected event
        throw new Error(reason || "Discord gave no reason! GG! You broke Discord!");
      default:
        return this.disconnect({ reconnect: () => this.resume() });
    }
  }

  async resume(this: Shard<true>) {
    this.state = ShardState.Resuming;

    if (!this.ready) return;

    return await this.send(0, {
      op: GatewayOpcodes.Resume,
      d: {
        token: this.options.token,
        session_id: this.data.session_id!,
        seq: this.data.resumeSeq!,
      },
    });
  }

  resetState() {
    this.ready = false;
  }

  disconnect(options?: { reconnect?: () => unknown }) {
    this.logger.error("closing connection");

    if (!this.websocket) {
      return;
    }

    if (!options?.reconnect) {
      this.websocket.close(1012, "BiscuitWS: close");
    } else {
      this.logger.error("trying to reconnect");
      options.reconnect();
    }

    this.websocket.terminate();

    this.resetState();
  }

  async onpacket(this: Shard<true>, packet: GatewayDispatchPayload | GatewayReceivePayload) {
    if (packet.s) this.data.resumeSeq = packet.s;

    switch (packet.op) {
      case GatewayOpcodes.InvalidSession:
        this.logger.debug("got invalid session, trying to identify back");
        this.data.resumeSeq = null;
        this.data.session_id = undefined;
        this.data.resume_gateway_url = undefined;
        this.resetState();
        await this.identify();
        break;
      case GatewayOpcodes.Reconnect:
        this.disconnect({
          reconnect: () => {
            this.resume();
          },
        });
        break;
    }

    switch (packet.t) {
      case GatewayDispatchEvents.Resumed:
        this.heartbeater.heartbeat(false);
        break;
      default:
        this.handlePayload(packet as any);
    }
  }

  /** do the handshake with discord */
  async identify() {
    if (!this.isConnected()) {
      await this.connect().then((shardThis: Shard<true>) => {
        this.identify.call(shardThis);
      });
      return;
    }

    if (!this.ready) {
      this.logger.debug(`identifying shard ${this.data.id} with a total of ${this.options.info.shards}`);
      this.data.shardState = ShardState.Identifying;
      await this.send(0, {
        op: GatewayOpcodes.Identify,
        d: {
          token: this.options.token,
          intents: this.options.intents,
          properties: properties,
          shard: [this.data.id, this.options.info.shards],
          compress: COMPRESS,
        },
      }).then(() => {
        this.logger.debug("finished identifying");
      });
      // ^if we don't get this message start preocupating

      this.ready = true;
    }
    // ^we make sure we can no longer identify unless invalid session

    return new Promise<void>((resolve) => {
      return this.shardIsReady?.().then(() => {
        resolve();
      });
    });
  }

  get gatewayURL() {
    return this.data.resume_gateway_url ?? this.options.info.url;
  }

  /** Calculate the amount of requests which can safely be made per rate limit interval, before the gateway gets disconnected due to an exceeded rate limit. */
  calculateSafeRequests(): number {
    // * 2 adds extra safety layer for discords OP 1 requests that we need to respond to
    const safeRequests =
      this.options.ratelimitOptions!.maxRequestsPerRateLimitTick -
      Math.ceil(this.options.ratelimitOptions!.rateLimitResetInterval / this.heartbeater!.heart.interval) * 2;

    if (safeRequests < 0) return 0;
    else return safeRequests;
  }

  shardIsReady?: () => Promise<void>;
}
