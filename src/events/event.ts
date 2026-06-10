import type { PluginLoadedMetadata, PluginUploadCommandsMetadata } from '../client/plugins';
import type { Command, ContextMenuCommand, UsingClient } from '../commands';
import type { ComponentCommands } from '../components/handler';
import type { ClientEvents } from './hooks';

export interface CustomEvents {
	commandsLoaded: (metadata: PluginLoadedMetadata<'commands', Command | ContextMenuCommand>) => void;
	componentsLoaded: (metadata: PluginLoadedMetadata<'components', ComponentCommands>) => void;
	uploadCommands: (metadata: PluginUploadCommandsMetadata) => void;
}
export type ClientNameEvents = Extract<keyof ClientEvents, string>;
export type CustomEventsKeys = Extract<keyof CustomEvents, string>;

export interface ClientDataEvent {
	name: ClientNameEvents | CustomEventsKeys;
	once: boolean;
}

export type CallbackEventHandler = {
	[K in keyof ClientEvents]: (...data: [Awaited<ClientEvents[K]>, UsingClient, number]) => unknown;
} & {
	[K in keyof CustomEvents]: (...data: [...Parameters<CustomEvents[K]>, UsingClient, number]) => unknown;
};
export type EventContext<T extends { data: { name: ClientNameEvents | CustomEventsKeys } }> = Parameters<
	CallbackEventHandler[T['data']['name']]
>;
export interface ClientEvent {
	data: ClientDataEvent;
	run(...args: EventContext<any>): any;
	/**@internal */
	__filePath?: string;
}
