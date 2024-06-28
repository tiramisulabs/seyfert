import type { ShardManagerOptions, WorkerManagerOptions } from '../discord';
declare const COMPRESS = false;
declare const properties: {
    os: NodeJS.Platform;
    browser: string;
    device: string;
};
declare const ShardManagerDefaults: Partial<ShardManagerOptions>;
declare const WorkerManagerDefaults: Partial<WorkerManagerOptions>;
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
