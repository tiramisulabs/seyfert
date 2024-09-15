import type { DeepPartial } from '../../common';
import type { ShardManagerOptions, WorkerManagerOptions } from '../discord';

const COMPRESS = false;

const properties = {
	os: process.platform,
	browser: 'Seyfert',
	device: 'Seyfert',
};

const ShardManagerDefaults: DeepPartial<ShardManagerOptions> = {
	totalShards: 1,
	spawnShardDelay: 5300,
	debug: false,
	intents: 0,
	properties,
	version: 10,
	shardStart: 0,
	resharding: {
		interval: 8 * 60 * 60 * 1e3, // 8h
		percentage: 80,
		reloadGuilds() {
			throw new Error('Unexpected to run <reloadGuilds>');
		},
		onGuild() {
			throw new Error('Unexpected to run <onGuild>');
		},
	},
};

const WorkerManagerDefaults: DeepPartial<WorkerManagerOptions> = {
	...ShardManagerDefaults,
	shardsPerWorker: 16,
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
