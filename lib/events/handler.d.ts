import type { GatewayDispatchPayload } from 'discord-api-types/v10';
import type { Client, WorkerClient } from '../client';
import { BaseHandler, type MakeRequired, type SnakeCase } from '../common';
import type { ClientEvents } from '../events/hooks';
import type { ClientEvent, CustomEvents, CustomEventsKeys } from './event';
import type { FileLoaded } from '../commands/handler';
export type EventValue = MakeRequired<ClientEvent, '__filePath'> & {
    fired?: boolean;
};
export type GatewayEvents = Uppercase<SnakeCase<keyof ClientEvents>>;
export declare class EventHandler extends BaseHandler {
    protected client: Client | WorkerClient;
    constructor(client: Client | WorkerClient);
    onFail: (event: GatewayEvents | CustomEventsKeys, err: unknown) => void;
    protected filter: (path: string) => boolean;
    values: Partial<Record<GatewayEvents | CustomEventsKeys, EventValue>>;
    load(eventsDir: string): Promise<void>;
    execute(name: GatewayEvents, ...args: [GatewayDispatchPayload, Client<true> | WorkerClient<true>, number]): Promise<void>;
    runEvent(name: GatewayEvents, client: Client | WorkerClient, packet: any, shardId: number, runCache?: boolean): Promise<void>;
    runCustom<T extends CustomEventsKeys>(name: T, ...args: Parameters<CustomEvents[T]>): Promise<void>;
    reload(name: GatewayEvents | CustomEventsKeys): Promise<any>;
    reloadAll(stopIfFail?: boolean): Promise<void>;
    onFile(file: FileLoaded<ClientEvent>): ClientEvent[] | undefined;
    callback: (file: ClientEvent) => ClientEvent | false;
}
