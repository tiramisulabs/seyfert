import { GatewayGuildCreateDispatchData, GatewayReadyDispatchData } from "@biscuitland/common";
import { ClientUser, Session } from "../index";

export const READY: RawHandler<GatewayReadyDispatchData & { user: ClientUser }> = (session, shardId, payload) => {
	session.applicationId = payload.application.id;
	session.botId = payload.user.id;
	session.emit("ready", payload.user, shardId);
};

export const GUILD_CREATE: RawHandler<GatewayGuildCreateDispatchData> = (session, shardId, payload) => {
	session.emit("guildCreate", payload, shardId);
};

export interface Events {
	ready: Handler<[ClientUser, number]>;
	guildCreate: Handler<[GatewayGuildCreateDispatchData, number]>;
}

export type RawHandler<T> = (...args: [Session, number, T]) => void;
export type Handler<T extends [obj?: unknown, ddy?: unknown]> = (...args: T) => unknown;
