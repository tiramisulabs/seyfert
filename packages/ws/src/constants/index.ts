import type { GatewayDispatchPayload } from "@biscuitland/common";
import type { GatewayManagerOptions } from "../gateway";

const COMPRESS = false;

const properties = {
  os: process.platform,
  browser: "Biscuit",
  device: "Biscuit",
};

const GatewayManagerDefaults: Partial<GatewayManagerOptions> = {
  totalShards: 1,
  spawnShardDelay: 5300,
  debug: false,
  intents: 0,
  properties: properties,
  version: 10,
  handlePayload: function (shardId: number, packet: GatewayDispatchPayload): void {
    console.info(`Packet ${packet.t} on shard ${shardId}`);
  },
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
  Offline = 6,
}

function isObject(o: any) {
  return o && typeof o === "object" && !Array.isArray(o);
}

function Options<T>(defaults: any, ...options: any[]): T {
  const option = options.shift();
  if (!option) return defaults;

  return Options(
    {
      ...option,
      ...Object.fromEntries(
        Object.entries(defaults).map(([key, value]) => [
          key,
          isObject(value) ? Options(value, option?.[key] || {}) : option?.[key] || value,
        ]),
      ),
    },
    ...options,
  );
}

// nutella truco
function OptionsD<O extends Record<any, any>>(o: O) {
  return function (target: { new (...args: any[]): any }) {
    return class extends target {
      constructor(...args: any[]) {
        super();
        this.options = Options(o, ...args.filter(isObject));
      }
    };
  };
}

export { COMPRESS, GatewayManagerDefaults, Options, OptionsD, ShardState, isObject, properties };
