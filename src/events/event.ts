import type { UsingClient } from '../commands';
import type { ClientEvents } from './hooks';

export interface DeclareEventsOptions {
	name: ClientNameEvents;
	once?: boolean;
}
export type ClientNameEvents = Extract<keyof ClientEvents, string>;

export type ClientDataEvent = Required<DeclareEventsOptions>;

export type CallbackEventHandler = {
	[K in ClientNameEvents]: (...data: [Awaited<ClientEvents[K]>, UsingClient, number]) => unknown;
};

export type EventContext<T extends { data: { name: ClientNameEvents } }> = Parameters<
	CallbackEventHandler[T['data']['name']]
>;

export interface ClientEvent {
	data: ClientDataEvent;
	run(...args: EventContext<any>): any;
	/**@internal */
	__filePath?: string;
}

export interface CustomEvents {}
