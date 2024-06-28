import { ApplicationCommandOptionType, ApplicationCommandType, type ApplicationIntegrationType, type InteractionContextType, type APIApplicationCommandBasicOption, type APIApplicationCommandOption, type LocaleString } from 'discord-api-types/v10';
import type { PermissionStrings, SeyfertNumberOption, SeyfertStringOption } from '../..';
import type { Attachment } from '../../builders';
import { type Awaitable, type FlatObjectKeys } from '../../common';
import type { AllChannels, AutocompleteInteraction } from '../../structures';
import type { Groups, RegisteredMiddlewares } from '../decorators';
import type { CommandContext } from './chatcontext';
import type { DefaultLocale, ExtraProps, IgnoreCommand, OKFunction, OnOptionsReturnObject, StopFunction, UsingClient } from './shared';
import type { GuildRoleStructure, InteractionGuildMemberStructure, UserStructure } from '../../client/transformers';
export interface ReturnOptionsTypes {
    1: never;
    2: never;
    3: string;
    4: number;
    5: boolean;
    6: InteractionGuildMemberStructure | UserStructure;
    7: AllChannels;
    8: GuildRoleStructure;
    9: GuildRoleStructure | AllChannels | UserStructure;
    10: number;
    11: Attachment;
}
type Wrap<N extends ApplicationCommandOptionType> = N extends ApplicationCommandOptionType.Subcommand | ApplicationCommandOptionType.SubcommandGroup ? never : {
    required?: boolean;
    value?(data: {
        context: CommandContext;
        value: ReturnOptionsTypes[N];
    }, ok: OKFunction<any>, fail: StopFunction): Awaitable<void>;
} & {
    description: string;
    description_localizations?: APIApplicationCommandBasicOption['description_localizations'];
    name_localizations?: APIApplicationCommandBasicOption['name_localizations'];
    locales?: {
        name?: FlatObjectKeys<DefaultLocale>;
        description?: FlatObjectKeys<DefaultLocale>;
    };
};
export type __TypeWrapper<T extends ApplicationCommandOptionType> = Wrap<T>;
export type __TypesWrapper = {
    [P in keyof typeof ApplicationCommandOptionType]: `${(typeof ApplicationCommandOptionType)[P]}` extends `${infer D extends number}` ? Wrap<D> : never;
};
export type AutocompleteCallback = (interaction: AutocompleteInteraction) => any;
export type OnAutocompleteErrorCallback = (interaction: AutocompleteInteraction, error: unknown) => any;
export type CommandBaseOption = __TypesWrapper[keyof __TypesWrapper];
export type CommandBaseAutocompleteOption = __TypesWrapper[keyof __TypesWrapper] & {
    autocomplete: AutocompleteCallback;
    onAutocompleteError?: OnAutocompleteErrorCallback;
};
export type CommandAutocompleteOption = CommandBaseAutocompleteOption & {
    name: string;
};
export type __CommandOption = CommandBaseOption;
export type CommandOption = __CommandOption & {
    name: string;
};
export type OptionsRecord = Record<string, __CommandOption & {
    type: ApplicationCommandOptionType;
}>;
type KeysWithoutRequired<T extends OptionsRecord> = {
    [K in keyof T]-?: T[K]['required'] extends true ? never : K;
}[keyof T];
type ContextOptionsAux<T extends OptionsRecord> = {
    [K in Exclude<keyof T, KeysWithoutRequired<T>>]: T[K]['value'] extends (...args: any) => any ? Parameters<Parameters<T[K]['value']>[1]>[0] : T[K] extends SeyfertStringOption | SeyfertNumberOption ? T[K]['choices'] extends NonNullable<SeyfertStringOption['choices'] | SeyfertNumberOption['choices']> ? T[K]['choices'][number]['value'] : ReturnOptionsTypes[T[K]['type']] : ReturnOptionsTypes[T[K]['type']];
} & {
    [K in KeysWithoutRequired<T>]?: T[K]['value'] extends (...args: any) => any ? Parameters<Parameters<T[K]['value']>[1]>[0] : T[K] extends SeyfertStringOption | SeyfertNumberOption ? T[K]['choices'] extends NonNullable<SeyfertStringOption['choices'] | SeyfertNumberOption['choices']> ? T[K]['choices'][number]['value'] : ReturnOptionsTypes[T[K]['type']] : ReturnOptionsTypes[T[K]['type']];
};
export type ContextOptions<T extends OptionsRecord> = ContextOptionsAux<T>;
export declare class BaseCommand {
    middlewares: (keyof RegisteredMiddlewares)[];
    __filePath?: string;
    __t?: {
        name: string | undefined;
        description: string | undefined;
    };
    __autoload?: true;
    guildId?: string[];
    name: string;
    type: number;
    nsfw?: boolean;
    description: string;
    defaultMemberPermissions?: bigint;
    integrationTypes: ApplicationIntegrationType[];
    contexts: InteractionContextType[];
    botPermissions?: bigint;
    name_localizations?: Partial<Record<LocaleString, string>>;
    description_localizations?: Partial<Record<LocaleString, string>>;
    options?: CommandOption[] | SubCommand[];
    ignore?: IgnoreCommand;
    aliases?: string[];
    props: ExtraProps;
    toJSON(): {
        name: BaseCommand["name"];
        type: BaseCommand["type"];
        nsfw: BaseCommand["nsfw"];
        description: BaseCommand["description"];
        name_localizations: BaseCommand["name_localizations"];
        description_localizations: BaseCommand["description_localizations"];
        guild_id: BaseCommand["guildId"];
        default_member_permissions: string;
        contexts: BaseCommand["contexts"];
        integration_types: BaseCommand["integrationTypes"];
    };
    reload(): Promise<void>;
    run?(context: CommandContext): any;
    onAfterRun?(context: CommandContext, error: unknown | undefined): any;
    onRunError?(context: CommandContext, error: unknown): any;
    onOptionsError?(context: CommandContext, metadata: OnOptionsReturnObject): any;
    onMiddlewaresError?(context: CommandContext, error: string): any;
    onBotPermissionsFail?(context: CommandContext, permissions: PermissionStrings): any;
    onPermissionsFail?(context: CommandContext, permissions: PermissionStrings): any;
    onInternalError?(client: UsingClient, command: Command | SubCommand, error?: unknown): any;
}
export declare class Command extends BaseCommand {
    type: ApplicationCommandType;
    groups?: Parameters<typeof Groups>[0];
    groupsAliases?: Record<string, string>;
    __tGroups?: Record<string, {
        name: string | undefined;
        description: string | undefined;
        defaultDescription: string;
    }>;
    toJSON(): {
        options: APIApplicationCommandOption[];
        name: BaseCommand["name"];
        type: BaseCommand["type"];
        nsfw: BaseCommand["nsfw"];
        description: BaseCommand["description"];
        name_localizations: BaseCommand["name_localizations"];
        description_localizations: BaseCommand["description_localizations"];
        guild_id: BaseCommand["guildId"];
        default_member_permissions: string;
        contexts: BaseCommand["contexts"];
        integration_types: BaseCommand["integrationTypes"];
    };
}
export declare abstract class SubCommand extends BaseCommand {
    type: ApplicationCommandOptionType;
    group?: string;
    options?: CommandOption[];
    toJSON(): {
        options: APIApplicationCommandBasicOption[];
        name: BaseCommand["name"];
        type: BaseCommand["type"];
        nsfw: BaseCommand["nsfw"];
        description: BaseCommand["description"];
        name_localizations: BaseCommand["name_localizations"];
        description_localizations: BaseCommand["description_localizations"];
        guild_id: BaseCommand["guildId"];
        default_member_permissions: string;
        contexts: BaseCommand["contexts"];
        integration_types: BaseCommand["integrationTypes"];
    };
    abstract run(context: CommandContext<any>): any;
}
export {};
