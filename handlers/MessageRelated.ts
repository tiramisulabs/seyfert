import type { DiscordMessage, DiscordReady } from "../vendor/external.ts";
import type { Session } from "../session/Session.ts";
import { Message } from "../structures/Message.ts";

type Handler<T> = (...args: [ Session, number, T ]) => void;

// TODO: move this lol
export const READY: Handler<DiscordReady> = (session, shardId, payload) => {
	session.emit("ready", shardId, payload);
};

export const MESSAGE_CREATE: Handler<DiscordMessage> = (session, _shardId, message) => {
	session.emit("messageCreate", new Message(session, message));
};

export const raw: Handler<unknown> = (session, shardId, data) => {
	session.emit("raw", data, shardId);
}