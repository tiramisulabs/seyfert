import type { GatewayDispatchPayload } from 'discord-api-types/v10';
import type { ShardManagerOptions, WorkerManagerOptions } from '../discord';

const COMPRESS = false;

const properties = {
	os: process.platform,
	browser: 'Seyfert',
	device: 'Seyfert',
};

const ShardManagerDefaults: Partial<ShardManagerOptions> = {
	totalShards: 1,
	spawnShardDelay: 5300,
	debug: false,
	intents: 0,
	properties,
	version: 10,
	shardStart: 0,
	handlePayload: (shardId: number, packet: GatewayDispatchPayload): void => {
		console.info(`Packet ${packet.t} on shard ${shardId}`);
	},
};

const WorkerManagerDefaults: Partial<WorkerManagerOptions> = {
	...ShardManagerDefaults,
	shardsPerWorker: 32,
	handlePayload: (_shardId: number, _workerId: number, _packet: GatewayDispatchPayload): void => {},
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

export { COMPRESS, ShardManagerDefaults, WorkerManagerDefaults, properties };
