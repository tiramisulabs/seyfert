import { ApiHandler } from '../api';
import type { Adapter } from '../cache';
import { Cache } from '../cache';
import type { Command, CommandContext, ContextMenuCommand, ExtraProps, MenuCommandContext, RegisteredMiddlewares, SubCommand, UsingClient } from '../commands';
import { type InferWithPrefix, type MiddlewareContext } from '../commands/applications/shared';
import { CommandHandler } from '../commands/handler';
import { ChannelShorter, EmojiShorter, GuildShorter, InteractionShorter, Logger, MemberShorter, MessageShorter, ReactionShorter, RoleShorter, TemplateShorter, ThreadShorter, UsersShorter, WebhookShorter, type MakeRequired } from '../common';
import type { LocaleString, RESTPostAPIChannelMessageJSONBody } from 'discord-api-types/rest/v10';
import type { Awaitable, DeepPartial, IntentStrings, OmitInsert, PermissionStrings, When } from '../common/types/util';
import { ComponentHandler } from '../components/handler';
import { LangsHandler } from '../langs/handler';
import type { ChatInputCommandInteraction, ComponentInteraction, MessageCommandInteraction, ModalSubmitInteraction, UserCommandInteraction } from '../structures';
import type { ComponentCommand, ModalCommand } from '../components';
import { BanShorter } from '../common/shorters/bans';
import { HandleCommand } from '../commands/handle';
import type { MessageStructure } from './transformers';
export declare class BaseClient {
    rest: ApiHandler;
    cache: Cache;
    users: UsersShorter;
    channels: ChannelShorter;
    guilds: GuildShorter;
    messages: MessageShorter;
    members: MemberShorter;
    webhooks: WebhookShorter;
    templates: TemplateShorter;
    roles: RoleShorter;
    reactions: ReactionShorter;
    emojis: EmojiShorter;
    threads: ThreadShorter;
    bans: BanShorter;
    interactions: InteractionShorter;
    debugger?: Logger;
    logger: Logger;
    langs?: LangsHandler | undefined;
    commands?: CommandHandler | undefined;
    components?: ComponentHandler | undefined;
    handleCommand: HandleCommand;
    private _applicationId?;
    private _botId?;
    middlewares?: Record<string, MiddlewareContext>;
    protected static assertString(value: unknown, message?: string): asserts value is string;
    protected static getBotIdFromToken(token: string): string;
    options: BaseClientOptions;
    constructor(options?: BaseClientOptions);
    set botId(id: string);
    get botId(): string;
    set applicationId(id: string);
    get applicationId(): string;
    get proxy(): import("../api").APIRoutes;
    setServices({ rest, cache, langs, middlewares, handlers, handleCommand }: ServicesOptions): void;
    protected execute(..._options: unknown[]): Promise<void>;
    start(options?: Pick<DeepPartial<StartOptions>, 'langsDir' | 'commandsDir' | 'connection' | 'token' | 'componentsDir'>): Promise<void>;
    protected onPacket(..._packet: unknown[]): Promise<void>;
    private shouldUploadCommands;
    private syncCachePath;
    uploadCommands({ applicationId, cachePath }?: {
        applicationId?: string;
        cachePath?: string;
    }): Promise<void>;
    loadCommands(dir?: string): Promise<void>;
    loadComponents(dir?: string): Promise<void>;
    loadLangs(dir?: string): Promise<void>;
    t(locale: string): import("..").__InternalParseLocale<import("../commands").DefaultLocale> & {
        get(locale?: string): import("../commands").DefaultLocale;
    };
    getRC<T extends InternalRuntimeConfigHTTP | InternalRuntimeConfig = InternalRuntimeConfigHTTP | InternalRuntimeConfig>(): Promise<{
        debug: boolean;
    } & Omit<T, "locations" | "debug"> & {
        templates: string | undefined;
        langs: string | undefined;
        events: string | undefined;
        components: string | undefined;
        commands: string | undefined;
        base: string;
        output: string;
    }>;
}
export interface BaseClientOptions {
    context?: (interaction: ChatInputCommandInteraction<boolean> | UserCommandInteraction<boolean> | MessageCommandInteraction<boolean> | ComponentInteraction | ModalSubmitInteraction | When<InferWithPrefix, MessageStructure, never>) => {};
    globalMiddlewares?: readonly (keyof RegisteredMiddlewares)[];
    commands?: {
        defaults?: {
            onRunError?: (context: MenuCommandContext<any, never> | CommandContext, error: unknown) => unknown;
            onPermissionsFail?: Command['onPermissionsFail'];
            onBotPermissionsFail?: (context: MenuCommandContext<any, never> | CommandContext, permissions: PermissionStrings) => unknown;
            onInternalError?: (client: UsingClient, command: Command | SubCommand | ContextMenuCommand, error?: unknown) => unknown;
            onMiddlewaresError?: (context: CommandContext | MenuCommandContext<any, never>, error: string) => unknown;
            onOptionsError?: Command['onOptionsError'];
            onAfterRun?: (context: CommandContext | MenuCommandContext<any, never>, error: unknown) => unknown;
            props?: ExtraProps;
        };
    };
    components?: {
        defaults?: {
            onRunError?: ComponentCommand['onRunError'];
            onInternalError?: ComponentCommand['onInternalError'];
            onMiddlewaresError?: ComponentCommand['onMiddlewaresError'];
            onAfterRun?: ComponentCommand['onAfterRun'];
        };
    };
    modals?: {
        defaults?: {
            onRunError?: ModalCommand['onRunError'];
            onInternalError?: ModalCommand['onInternalError'];
            onMiddlewaresError?: ModalCommand['onMiddlewaresError'];
            onAfterRun?: ModalCommand['onAfterRun'];
        };
    };
    allowedMentions?: Omit<NonNullable<RESTPostAPIChannelMessageJSONBody['allowed_mentions']>, 'parse'> & {
        parse?: ('everyone' | 'roles' | 'users')[];
    };
    getRC?(): Awaitable<InternalRuntimeConfig | InternalRuntimeConfigHTTP>;
}
export interface StartOptions {
    eventsDir: string;
    langsDir: string;
    commandsDir: string;
    componentsDir: string;
    connection: {
        intents: number;
    };
    httpConnection: {
        publicKey: string;
        port: number;
        useUWS: boolean;
    };
    token: string;
}
interface RC extends Variables {
    debug?: boolean;
    locations: {
        base: string;
        output: string;
        commands?: string;
        langs?: string;
        templates?: string;
        events?: string;
        components?: string;
    };
}
export interface Variables {
    token: string;
    intents?: number;
    applicationId?: string;
    port?: number;
    publicKey?: string;
}
export type InternalRuntimeConfigHTTP = Omit<MakeRequired<RC, 'publicKey' | 'port' | 'applicationId'>, 'intents' | 'locations'> & {
    locations: Omit<RC['locations'], 'events'>;
};
export type RuntimeConfigHTTP = Omit<MakeRequired<RC, 'publicKey' | 'applicationId'>, 'intents' | 'locations'> & {
    locations: Omit<RC['locations'], 'events'>;
};
export type InternalRuntimeConfig = Omit<MakeRequired<RC, 'intents'>, 'publicKey' | 'port'>;
export type RuntimeConfig = OmitInsert<InternalRuntimeConfig, 'intents', {
    intents?: IntentStrings | number[] | number;
}>;
export interface ServicesOptions {
    rest?: ApiHandler;
    cache?: {
        adapter?: Adapter;
        disabledCache?: Cache['disabledCache'];
    };
    langs?: {
        default?: string;
        aliases?: Record<string, LocaleString[]>;
    };
    middlewares?: Record<string, MiddlewareContext>;
    handlers?: {
        components?: ComponentHandler | ComponentHandler['callback'];
        commands?: CommandHandler;
        langs?: LangsHandler;
    };
    handleCommand?: typeof HandleCommand;
}
export {};
