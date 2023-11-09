import type { GatewayDispatchPayload } from '@biscuitland/common';
import { ShardManagerOptions } from '../discord';

const COMPRESS = false;

const properties = {
  os: process.platform,
  browser: 'Biscuit',
  device: 'Biscuit'
};

const ShardManagerDefaults: Partial<ShardManagerOptions> = {
  totalShards: 1,
  spawnShardDelay: 5300,
  debug: false,
  intents: 0,
  properties: properties,
  version: 10,
  handlePayload: (shardId: number, packet: GatewayDispatchPayload): void => {
    console.info(`Packet ${packet.t} on shard ${shardId}`);
  }
};

export interface IdentifyProperties {
  /**
   * Operating system the shard runs on.
   * @default "darwin" | "linux" | "windows"
   */
  os: string;
  /**
   * The "browser" where this shard is running on.
   */
  browser: string;
  /**
   * The device on which the shard is running.
   */
  device: string;
}

enum ShardState {
  /** Shard is fully connected to the gateway and receiving events from Discord. */
  Connected = 0,
  /** Shard started to connect to the gateway. This is only used if the shard is not currently trying to identify or resume. */
  Connecting = 1,
  /** Shard got disconnected and reconnection actions have been started. */
  Disconnected = 2,
  /** The shard is connected to the gateway but only heartbeating. At this state the shard has not been identified with discord. */
  Unidentified = 3,
  /** Shard is trying to identify with the gateway to create a new session. */
  Identifying = 4,
  /** Shard is trying to resume a session with the gateway. */
  Resuming = 5,
  /** Shard got shut down studied or due to a not (self) fixable error and may not attempt to reconnect on its own. */
  Offline = 6
}

export { COMPRESS, ShardManagerDefaults, ShardState, properties };
