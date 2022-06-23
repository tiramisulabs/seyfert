import type { DiscordGatewayPayload, DiscordReady, Shard } from "../vendor/external.ts";
import type { Message } from "../structures/Message.ts";

export type DiscordRawEventHandler = (shard: Shard, data: DiscordGatewayPayload) => unknown;

export interface Events {
    ready(shardId: number, payload: DiscordReady): unknown;
    messageCreate(message: Message): unknown;
    raw(data: DiscordGatewayPayload, shardId: number): unknown;
}
