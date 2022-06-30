import type { DiscordMessage, DiscordReady } from "../vendor/external.ts";
import type { Snowflake } from "../util/Snowflake.ts";
import type { Session } from "../session/Session.ts";
import Message from "../structures/Message.ts";

export type RawHandler<T extends unknown[]> = (...args: [Session, number, ...T]) => void;
export type Handler<T extends unknown[]> = (...args: T) => unknown;

export type Ready = [DiscordReady];
export const READY: RawHandler<Ready> = (session, shardId, payload) => {
    session.emit("ready", payload, shardId);
};

export type MessageCreate = [DiscordMessage];
export const MESSAGE_CREATE: RawHandler<MessageCreate> = (session, _shardId, message) => {
    session.emit("messageCreate", new Message(session, message));
};

export type MessageUpdate = [DiscordMessage];
export const MESSAGE_UPDATE: RawHandler<MessageUpdate> = (session, _shardId, new_message) => {
    session.emit("messageUpdate", new Message(session, new_message));
};

export type MessageDelete = [Snowflake];
export const MESSAGE_DELETE: RawHandler<MessageDelete> = (session, _shardId, deleted_message_id) => {
    session.emit("messageDelete", deleted_message_id);
}

export const raw: RawHandler<[unknown]> = (session, shardId, data) => {
    session.emit("raw", data, shardId);
};

export interface Events {
    "ready": Handler<[DiscordReady, number]>;
    "messageCreate": Handler<[Message]>;
    "messageUpdate": Handler<[Message]>;
    "messageDelete": Handler<[Snowflake]>;
    "raw": Handler<[unknown]>;
}
