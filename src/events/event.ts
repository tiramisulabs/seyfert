import type { UsingClient } from '../commands';
import type { ClientEvents } from './hooks';

export interface DeclareEventsOptions {
	name: `${keyof ClientEvents}`;
	once?: boolean;
}
export type ClientNameEvents = Extract<keyof ClientEvents, string>;

export interface ClientDataEvent {
	name: ClientNameEvents;
	once: boolean;
}

export type CallbackEventHandler = {
	[K in keyof ClientEvents]: (...data: [Awaited<ClientEvents[K]>, UsingClient, number]) => unknown;
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
