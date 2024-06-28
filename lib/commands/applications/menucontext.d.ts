import type { ContextMenuCommand, ReturnCache } from '../..';
import { type InteractionCreateBodyRequest, type InteractionMessageUpdateBodyRequest, type ModalCreateBodyRequest, type UnionToTuple, type When } from '../../common';
import type { AllChannels, MessageCommandInteraction, UserCommandInteraction } from '../../structures';
import { BaseContext } from '../basecontext';
import type { RegisteredMiddlewares } from '../decorators';
import type { CommandMetadata, ExtendContext, GlobalMetadata, UsingClient } from './shared';
import { type GuildMemberStructure, type GuildStructure, type MessageStructure, type UserStructure, type WebhookMessageStructure } from '../../client/transformers';
export type InteractionTarget<T> = T extends MessageCommandInteraction ? MessageStructure : UserStructure;
export interface MenuCommandContext<T extends MessageCommandInteraction | UserCommandInteraction, M extends keyof RegisteredMiddlewares = never> extends BaseContext, ExtendContext {
}
export declare class MenuCommandContext<T extends MessageCommandInteraction | UserCommandInteraction, M extends keyof RegisteredMiddlewares = never> extends BaseContext {
    readonly client: UsingClient;
    readonly interaction: T;
    readonly shardId: number;
    readonly command: ContextMenuCommand;
    constructor(client: UsingClient, interaction: T, shardId: number, command: ContextMenuCommand);
    metadata: CommandMetadata<UnionToTuple<M>>;
    globalMetadata: GlobalMetadata;
    get target(): InteractionTarget<T>;
    get t(): import("../..").__InternalParseLocale<import("./shared").DefaultLocale> & {
        get(locale?: string): import("./shared").DefaultLocale;
    };
    get fullCommandName(): string;
    write<FR extends boolean = false>(body: InteractionCreateBodyRequest, fetchReply?: FR): Promise<When<FR, WebhookMessageStructure, void | WebhookMessageStructure>>;
    modal(body: ModalCreateBodyRequest): Promise<void>;
    deferReply(ephemeral?: boolean): Promise<void>;
    editResponse(body: InteractionMessageUpdateBodyRequest): Promise<import("../..").WebhookMessage>;
    deleteResponse(): Promise<void | undefined>;
    editOrReply<FR extends boolean = false>(body: InteractionCreateBodyRequest | InteractionMessageUpdateBodyRequest, fetchReply?: FR): Promise<When<FR, WebhookMessageStructure | MessageStructure, void | WebhookMessageStructure | MessageStructure>>;
    fetchResponse(): Promise<import("../..").WebhookMessage | undefined>;
    channel(mode?: 'rest' | 'flow'): Promise<AllChannels>;
    channel(mode?: 'cache'): ReturnCache<AllChannels>;
    me(mode?: 'rest' | 'flow'): Promise<GuildMemberStructure>;
    me(mode?: 'cache'): ReturnCache<GuildMemberStructure | undefined>;
    guild(mode?: 'rest' | 'flow'): Promise<GuildStructure<'cached' | 'api'> | undefined>;
    guild(mode?: 'cache'): ReturnCache<GuildStructure<'cached'> | undefined>;
    get guildId(): string | undefined;
    get channelId(): string;
    get author(): import("../..").User;
    get member(): import("../..").InteractionGuildMember | undefined;
    isMenu(): this is MenuCommandContext<UserCommandInteraction | MessageCommandInteraction>;
    isMenuUser(): this is MenuCommandContext<UserCommandInteraction>;
    isMenuMessage(): this is MenuCommandContext<MessageCommandInteraction>;
}
