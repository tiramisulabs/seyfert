import { GatewayGuildCreateDispatchData, GatewayReadyDispatchData } from '@biscuitland/common';
import { Session, ClientUser, Guild } from '../index';

export const READY: RawHandler<GatewayReadyDispatchData> = (session, shardId, payload) => {
	session.applicationId = payload.application.id;
	session.botId = payload.user.id;
	session.emit('ready', new ClientUser(session, payload.user), shardId);
};

export const GUILD_CREATE: RawHandler<GatewayGuildCreateDispatchData> = (session, shardId, payload) => {
	session.emit('guildCreate', new Guild(session, payload), shardId);
};

export interface Events {
	ready: Handler<[ClientUser, number]>;
	guildCreate: Handler<[Guild, number]>;
}

export type RawHandler<T> = (...args: [Session, number, T]) => void;
export type Handler<T extends [obj?: unknown, ddy?: unknown]> = (...args: T) => unknown;
