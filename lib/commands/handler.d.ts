import { type APIApplicationCommandOption, type LocalizationMap } from 'discord-api-types/v10';
import type { Logger, MakeRequired, NulleableCoalising, OmitInsert } from '../common';
import { BaseHandler } from '../common';
import { Command, type CommandOption, SubCommand } from './applications/chat';
import { ContextMenuCommand } from './applications/menu';
import type { UsingClient } from './applications/shared';
export declare class CommandHandler extends BaseHandler {
    protected logger: Logger;
    protected client: UsingClient;
    values: (Command | ContextMenuCommand)[];
    protected filter: (path: string) => boolean;
    constructor(logger: Logger, client: UsingClient);
    reload(resolve: string | Command): Promise<void>;
    reloadAll(stopIfFail?: boolean): Promise<void>;
    protected shouldUploadLocales(locales?: LocalizationMap | null, cachedLocales?: LocalizationMap | null): boolean;
    protected shouldUploadOption(option: APIApplicationCommandOption, cached: APIApplicationCommandOption): boolean | undefined;
    shouldUpload(file: string, guildId?: string): Promise<boolean>;
    load(commandsDir: string, client: UsingClient): Promise<(Command | ContextMenuCommand)[]>;
    parseLocales(command: Command | SubCommand | ContextMenuCommand): Command | ContextMenuCommand | SubCommand;
    parseGlobalLocales(command: Command | SubCommand | ContextMenuCommand): void;
    parseCommandOptionLocales(option: MakeRequired<CommandOption, 'locales'>): void;
    parseCommandLocales(command: Command): void;
    parseContextMenuLocales(command: ContextMenuCommand): ContextMenuCommand;
    parseSubCommandLocales(command: SubCommand): SubCommand;
    stablishContextCommandDefaults(commandInstance: InstanceType<HandleableCommand>): ContextMenuCommand | false;
    stablishCommandDefaults(commandInstance: InstanceType<HandleableCommand>): OmitInsert<Command, 'options', {
        options: NonNullable<Command['options']>;
    }> | false;
    stablishSubCommandDefaults(commandInstance: Command, option: SubCommand): SubCommand;
    onFile(file: FileLoaded): HandleableCommand[] | undefined;
    onCommand(file: HandleableCommand): Command | SubCommand | ContextMenuCommand | false;
    onSubCommand(file: HandleableSubCommand): SubCommand | false;
}
export type FileLoaded<T = null> = {
    default?: NulleableCoalising<T, HandleableCommand>;
} & Record<string, NulleableCoalising<T, HandleableCommand>>;
export type HandleableCommand = new () => Command | SubCommand | ContextMenuCommand;
export type HandleableSubCommand = new () => SubCommand;
