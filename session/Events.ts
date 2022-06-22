import type { DiscordGatewayPayload, DiscordMessage, DiscordReady, Shard } from "../vendor/external.ts";

export type DiscordRawEventHandler = (shard: Shard, data: DiscordGatewayPayload) => unknown;

export interface Events {
    ready(payload: DiscordReady, shardId: number): unknown;
    messageCreate(message: DiscordMessage): unknown;
    raw(data: DiscordGatewayPayload, shardId: number): unknown;
}
