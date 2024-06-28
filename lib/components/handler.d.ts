import type { ComponentCallback, ListenerOptions, ModalSubmitCallback } from '../builders/types';
import { LimitedCollection } from '../collection';
import { type UsingClient } from '../commands';
import type { FileLoaded } from '../commands/handler';
import { BaseHandler, type Logger, type OnFailCallback } from '../common';
import type { ComponentInteraction, ModalSubmitInteraction, StringSelectMenuInteraction } from '../structures';
import { ComponentCommand } from './componentcommand';
import type { ComponentContext } from './componentcontext';
import { ModalCommand } from './modalcommand';
import type { ModalContext } from './modalcontext';
type COMPONENTS = {
    components: {
        match: string | string[] | RegExp;
        callback: ComponentCallback;
    }[];
    options?: ListenerOptions;
    messageId?: string;
    idle?: NodeJS.Timeout;
    timeout?: NodeJS.Timeout;
    __run: (customId: string | string[] | RegExp, callback: ComponentCallback) => any;
};
export type CollectorInteraction = ComponentInteraction | StringSelectMenuInteraction;
export type ComponentCommands = ComponentCommand | ModalCommand;
export declare class ComponentHandler extends BaseHandler {
    protected client: UsingClient;
    onFail: OnFailCallback;
    readonly values: Map<string, COMPONENTS>;
    readonly modals: LimitedCollection<string, ModalSubmitCallback>;
    readonly commands: ComponentCommands[];
    protected filter: (path: string) => boolean;
    constructor(logger: Logger, client: UsingClient);
    createComponentCollector(messageId: string, options?: ListenerOptions): {
        run<T extends CollectorInteraction = CollectorInteraction>(customId: string | string[] | RegExp, callback: ComponentCallback<T>): any;
        stop(reason?: string): any;
    };
    onComponent(id: string, interaction: ComponentInteraction): Promise<void>;
    hasComponent(id: string, customId: string): boolean;
    resetTimeouts(id: string): void;
    hasModal(interaction: ModalSubmitInteraction): boolean;
    onModalSubmit(interaction: ModalSubmitInteraction): any;
    deleteValue(id: string, reason?: string): void;
    onMessageDelete(id: string): void;
    stablishDefaults(component: ComponentCommands): void;
    load(componentsDir: string): Promise<void>;
    reload(path: string): Promise<any>;
    reloadAll(stopIfFail?: boolean): Promise<void>;
    execute(i: ComponentCommands, context: ComponentContext | ModalContext): Promise<any>;
    executeComponent(context: ComponentContext): Promise<void>;
    executeModal(context: ModalContext): Promise<void>;
    onFile(file: FileLoaded<new () => ComponentCommands>): (new () => ComponentCommands)[] | undefined;
    callback(file: {
        new (): ComponentCommands;
    }): ComponentCommands | false;
}
export {};
