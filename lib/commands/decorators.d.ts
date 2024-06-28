import { ApplicationCommandType, ApplicationIntegrationType, InteractionContextType, type LocaleString } from 'discord-api-types/v10';
import type { FlatObjectKeys, PermissionStrings } from '../common';
import type { CommandOption, OptionsRecord, SubCommand } from './applications/chat';
import type { DefaultLocale, ExtraProps, IgnoreCommand, MiddlewareContext } from './applications/shared';
export interface RegisteredMiddlewares {
}
type DeclareOptions = {
    name: string;
    description: string;
    botPermissions?: PermissionStrings | bigint;
    defaultMemberPermissions?: PermissionStrings | bigint;
    guildId?: string[];
    nsfw?: boolean;
    integrationTypes?: (keyof typeof ApplicationIntegrationType)[];
    contexts?: (keyof typeof InteractionContextType)[];
    ignore?: IgnoreCommand;
    aliases?: string[];
    props?: ExtraProps;
} | (Omit<{
    name: string;
    description: string;
    botPermissions?: PermissionStrings | bigint;
    defaultMemberPermissions?: PermissionStrings | bigint;
    guildId?: string[];
    nsfw?: boolean;
    integrationTypes?: (keyof typeof ApplicationIntegrationType)[];
    contexts?: (keyof typeof InteractionContextType)[];
    props?: ExtraProps;
}, 'type' | 'description'> & {
    type: ApplicationCommandType.User | ApplicationCommandType.Message;
});
export declare function Locales({ name: names, description: descriptions, }: {
    name?: [language: LocaleString, value: string][];
    description?: [language: LocaleString, value: string][];
}): <T extends {
    new (...args: any[]): {};
}>(target: T) => {
    new (...args: any[]): {
        name_localizations: {
            [k: string]: string;
        } | undefined;
        description_localizations: {
            [k: string]: string;
        } | undefined;
    };
} & T;
export declare function LocalesT(name?: FlatObjectKeys<DefaultLocale>, description?: FlatObjectKeys<DefaultLocale>): <T extends {
    new (...args: any[]): {};
}>(target: T) => {
    new (...args: any[]): {
        __t: {
            name: undefined;
            description: undefined;
        };
    };
} & T;
export declare function GroupsT(groups: Record<string, {
    name?: FlatObjectKeys<DefaultLocale>;
    description?: FlatObjectKeys<DefaultLocale>;
    defaultDescription: string;
    aliases?: string[];
}>): <T extends {
    new (...args: any[]): {};
}>(target: T) => {
    new (...args: any[]): {
        __tGroups: Record<string, {
            name?: FlatObjectKeys<DefaultLocale>;
            description?: FlatObjectKeys<DefaultLocale>;
            defaultDescription: string;
            aliases?: string[];
        }>;
        groupsAliases: Record<string, string>;
    };
} & T;
export declare function Groups(groups: Record<string, {
    name?: [language: LocaleString, value: string][];
    description?: [language: LocaleString, value: string][];
    defaultDescription: string;
    aliases?: string[];
}>): <T extends {
    new (...args: any[]): {};
}>(target: T) => {
    new (...args: any[]): {
        groups: Record<string, {
            name?: [language: LocaleString, value: string][];
            description?: [language: LocaleString, value: string][];
            defaultDescription: string;
            aliases?: string[];
        }>;
        groupsAliases: Record<string, string>;
    };
} & T;
export declare function Group(groupName: string): <T extends {
    new (...args: any[]): {};
}>(target: T) => {
    new (...args: any[]): {
        group: string;
    };
} & T;
export declare function Options(options: (new () => SubCommand)[] | OptionsRecord): <T extends {
    new (...args: any[]): {};
}>(target: T) => {
    new (...args: any[]): {
        options: SubCommand[] | CommandOption[];
    };
} & T;
export declare function AutoLoad(): <T extends {
    new (...args: any[]): {};
}>(target: T) => {
    new (...args: any[]): {
        __autoload: boolean;
    };
} & T;
export type ParseMiddlewares<T extends Record<string, MiddlewareContext>> = {
    [k in keyof T]: T[k];
};
export declare function Middlewares(cbs: readonly (keyof RegisteredMiddlewares)[]): <T extends {
    new (...args: any[]): {};
}>(target: T) => {
    new (...args: any[]): {
        middlewares: readonly never[];
    };
} & T;
export declare function Declare(declare: DeclareOptions): <T extends {
    new (...args: any[]): {};
}>(target: T) => {
    new (...args: any[]): {
        name: string;
        nsfw: boolean | undefined;
        props: ExtraProps | undefined;
        contexts: InteractionContextType[];
        integrationTypes: ApplicationIntegrationType[];
        defaultMemberPermissions: bigint | undefined;
        botPermissions: bigint | undefined;
        description: string;
        type: ApplicationCommandType;
        guildId?: string[];
        ignore?: IgnoreCommand;
        aliases?: string[];
    };
} & T;
export {};
