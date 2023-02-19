import { GatewayReadyDispatchData } from "discord-api-types/v10";
import { Session, ClientUser } from "../index";

export const Ready: RawHandler<GatewayReadyDispatchData> = (session, shardId, payload) => {
	session.applicationId = payload.application.id;
	session.botId = payload.user.id;
	session.emit("ready", new ClientUser(session, payload.user), shardId);
};

export interface Events {
	ready: Handler<[ClientUser, number]>;
}

export type RawHandler<T> = (...args: [Session, number, T]) => void;
export type Handler<T extends [obj?: unknown, ddy?: unknown]> = (...args: T) => unknown;
