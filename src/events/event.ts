import type { UsingClient } from '../commands';
import type { ClientEvents } from './hooks';

export interface CustomEvents {}
export type ClientNameEvents = Extract<keyof ClientEvents, string>;
export type CustomEventsKeys = Extract<keyof CustomEvents, string>;

export interface ClientDataEvent {
	name: ClientNameEvents;
	once: boolean;
}

export type CallbackEventHandler = {
	[K in keyof ClientEvents]: (...data: [Awaited<ClientEvents[K]>, UsingClient, number]) => unknown;
} & {
	[K in keyof CustomEvents]: (...data: [Parameters<CustomEvents[K]>, UsingClient, number]) => unknown;
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
