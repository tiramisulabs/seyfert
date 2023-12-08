import { GatewayHeartbeatRequest, GatewayHello, GatewayOpcodes, GatewayReceivePayload } from '@biscuitland/common';
import { Shard } from './shard.js';
import { ShardSocketCloseCodes } from './shared.js';

export interface ShardHeart {
  /** Whether or not the heartbeat was acknowledged by Discord in time. */
  ack: boolean;
  /** Interval between heartbeats requested by Discord. */
  interval: number;
  /** Id of the interval, which is used for sending the heartbeats. */
  intervalId?: NodeJS.Timeout;
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

export class ShardHeartBeater {
  heart: ShardHeart = {
    ack: false,
    interval: 30_000
  };
  // biome-ignore lint/nursery/noEmptyBlockStatements: <explanation>
  constructor(public shard: Shard) { }

  acknowledge(ack = true) {
    this.heart.ack = ack;
  }

  handleHeartbeat(_packet: Extract<GatewayReceivePayload, GatewayHeartbeatRequest>) {
    this.shard.logger.debug(`[Shard #${this.shard.id}] received hearbeat event`);
    this.heartbeat(false);
  }

  /**
   * sends a heartbeat whenever its needed
   *  fails if heart.interval is null
   */
  heartbeat(acknowledgeAck: boolean) {
    if (acknowledgeAck) {
      if (!this.heart.lastAck) {
        this.shard.logger.debug(`[Shard #${this.shard.id}] Heartbeat not acknowledged.`);
        this.shard.close(ShardSocketCloseCodes.ZombiedConnection, 'Zombied connection, did not receive an heartbeat ACK in time.');
        this.shard.identify(true);
      }
      this.heart.lastAck = undefined;
    }

    this.heart.lastBeat = Date.now();

    // avoid creating a bucket here
    this.shard.websocket?.send(
      JSON.stringify({
        op: GatewayOpcodes.Heartbeat,
        d: this.shard.data.resumeSeq
      })
    );
  }

  stopHeartbeating() {
    clearInterval(this.heart.intervalId);
    clearTimeout(this.heart.timeoutId);
  }

  startHeartBeating() {
    this.shard.logger.debug(`[Shard #${this.shard.id}] scheduling heartbeat!`);

    if (!this.shard.isOpen()) return;

    // The first heartbeat needs to be send with a random delay between `0` and `interval`
    // Using a `setTimeout(_, jitter)` here to accomplish that.
    // `Math.random()` can be `0` so we use `0.5` if this happens
    // Reference: https://discord.com/developers/docs/topics/gateway#heartbeating
    const jitter = Math.ceil(this.heart.interval * (Math.random() || 0.5));

    this.heart.timeoutId = setTimeout(() => {
      // send a heartbeat
      this.heartbeat(false);
      this.heart.intervalId = setInterval(() => {
        this.acknowledge(false);
        this.heartbeat(false);
      }, this.heart.interval);
    }, jitter);
  }

  handleHello(packet: GatewayHello) {
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

    this.startHeartBeating();

    if (this.shard.data.session_id) {
      this.shard.resume();
    } else {
      this.shard.identify()
    }
  }

  onpacket(packet: GatewayReceivePayload,) {
    switch (packet.op) {
      case GatewayOpcodes.Heartbeat:
        return this.handleHeartbeat(packet);
      case GatewayOpcodes.Hello:
        return this.handleHello(packet);
      case GatewayOpcodes.HeartbeatAck:
        this.acknowledge();
        return (this.heart.lastAck = Date.now());
    }
  }
}
