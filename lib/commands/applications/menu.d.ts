import type { ApplicationCommandType, ApplicationIntegrationType, InteractionContextType, LocaleString } from 'discord-api-types/v10';
import { type PermissionStrings } from '../../common';
import type { RegisteredMiddlewares } from '../decorators';
import type { MenuCommandContext } from './menucontext';
import type { ExtraProps, UsingClient } from './shared';
export declare abstract class ContextMenuCommand {
    middlewares: (keyof RegisteredMiddlewares)[];
    __filePath?: string;
    __t?: {
        name: string | undefined;
        description: string | undefined;
    };
    guildId?: string[];
    name: string;
    type: ApplicationCommandType.User | ApplicationCommandType.Message;
    nsfw?: boolean;
    integrationTypes: ApplicationIntegrationType[];
    contexts: InteractionContextType[];
    description: string;
    defaultMemberPermissions?: bigint;
    botPermissions?: bigint;
    dm?: boolean;
    name_localizations?: Partial<Record<LocaleString, string>>;
    description_localizations?: Partial<Record<LocaleString, string>>;
    props: ExtraProps;
    toJSON(): {
        name: string;
        type: ApplicationCommandType.User | ApplicationCommandType.Message;
        nsfw: boolean | undefined;
        description: string;
        name_localizations: Partial<Record<"id" | "en-US" | "en-GB" | "bg" | "zh-CN" | "zh-TW" | "hr" | "cs" | "da" | "nl" | "fi" | "fr" | "de" | "el" | "hi" | "hu" | "it" | "ja" | "ko" | "lt" | "no" | "pl" | "pt-BR" | "ro" | "ru" | "es-ES" | "es-419" | "sv-SE" | "th" | "tr" | "uk" | "vi", string>> | undefined;
        description_localizations: Partial<Record<"id" | "en-US" | "en-GB" | "bg" | "zh-CN" | "zh-TW" | "hr" | "cs" | "da" | "nl" | "fi" | "fr" | "de" | "el" | "hi" | "hu" | "it" | "ja" | "ko" | "lt" | "no" | "pl" | "pt-BR" | "ro" | "ru" | "es-ES" | "es-419" | "sv-SE" | "th" | "tr" | "uk" | "vi", string>> | undefined;
        guild_id: string[] | undefined;
        dm_permission: boolean | undefined;
        default_member_permissions: string | undefined;
        contexts: InteractionContextType[];
        integration_types: ApplicationIntegrationType[];
    };
    reload(): Promise<void>;
    abstract run?(context: MenuCommandContext<any>): any;
    onAfterRun?(context: MenuCommandContext<any>, error: unknown | undefined): any;
    onRunError(context: MenuCommandContext<any, never>, error: unknown): any;
    onMiddlewaresError(context: MenuCommandContext<any, never>, error: string): any;
    onBotPermissionsFail(context: MenuCommandContext<any, never>, permissions: PermissionStrings): any;
    onInternalError(client: UsingClient, command: ContextMenuCommand, error?: unknown): any;
}
