import type { Awaitable, CamelCase } from '../common';
import type { CallbackEventHandler, CustomEventsKeys, GatewayEvents } from '../events';
export type AllClientEvents = CustomEventsKeys | GatewayEvents;
export type ParseClientEventName<T extends AllClientEvents> = T extends CustomEventsKeys ? T : CamelCase<T>;
type RunData<T extends AllClientEvents> = {
    options: {
        event: T;
        idle?: number;
        timeout?: number;
        onStop?: (reason: string) => unknown;
        onStopError?: (reason: string, error: unknown) => unknown;
        filter: (arg: Awaited<Parameters<CallbackEventHandler[ParseClientEventName<T>]>[0]>) => Awaitable<boolean>;
        run: (arg: Awaited<Parameters<CallbackEventHandler[ParseClientEventName<T>]>[0]>, stop: (reason?: string) => void) => unknown;
        onRunError?: (arg: Awaited<Parameters<CallbackEventHandler[ParseClientEventName<T>]>[0]>, error: unknown, stop: (reason?: string) => void) => unknown;
    };
    idle?: NodeJS.Timeout;
    timeout?: NodeJS.Timeout;
    nonce: string;
};
export declare class Collectors {
    readonly values: Map<AllClientEvents, RunData<any>[]>;
    private generateRandomUUID;
    create<T extends AllClientEvents>(options: RunData<T>['options']): {
        event: T;
        idle?: number;
        timeout?: number;
        onStop?: (reason: string) => unknown;
        onStopError?: (reason: string, error: unknown) => unknown;
        filter: (arg: Awaited<Parameters<CallbackEventHandler[ParseClientEventName<T>]>[0]>) => Awaitable<boolean>;
        run: (arg: Awaited<Parameters<CallbackEventHandler[ParseClientEventName<T>]>[0]>, stop: (reason?: string) => void) => unknown;
        onRunError?: ((arg: Awaited<Parameters<CallbackEventHandler[ParseClientEventName<T>]>[0]>, error: unknown, stop: (reason?: string) => void) => unknown) | undefined;
    };
    private delete;
}
export {};
