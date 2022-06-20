import type {
	DiscordGatewayPayload,
	Shard,
} from "../vendor/external.ts";

export type DiscordRawEventHandler = (shard: Shard, data: DiscordGatewayPayload) => unknown;