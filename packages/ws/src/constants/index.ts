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

export { COMPRESS, ShardManagerDefaults, properties };
