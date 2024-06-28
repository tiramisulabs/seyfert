import type { AllChannels, InferWithPrefix, Message, ReturnCache } from '../..';
import type { If, UnionToTuple, When } from '../../common';
import type { InteractionCreateBodyRequest, InteractionMessageUpdateBodyRequest } from '../../common/types/write';
import { ChatInputCommandInteraction } from '../../structures';
import { BaseContext } from '../basecontext';
import type { RegisteredMiddlewares } from '../decorators';
import type { Command, ContextOptions, OptionsRecord, SubCommand } from './chat';
import type { CommandMetadata, ExtendContext, GlobalMetadata, UsingClient } from './shared';
import type { GuildMemberStructure, GuildStructure, InteractionGuildMemberStructure, MessageStructure, OptionResolverStructure, WebhookMessageStructure } from '../../client/transformers';
export interface CommandContext<T extends OptionsRecord = {}, M extends keyof RegisteredMiddlewares = never> extends BaseContext, ExtendContext {
}
export declare class CommandContext<T extends OptionsRecord = {}, M extends keyof RegisteredMiddlewares = never> extends BaseContext {
    readonly client: UsingClient;
    readonly resolver: OptionResolverStructure;
    readonly shardId: number;
    readonly command: Command | SubCommand;
    message: If<InferWithPrefix, MessageStructure | undefined, undefined>;
    interaction: If<InferWithPrefix, ChatInputCommandInteraction | undefined, ChatInputCommandInteraction>;
    messageResponse?: If<InferWithPrefix, MessageStructure | undefined>;
    constructor(client: UsingClient, data: ChatInputCommandInteraction | MessageStructure, resolver: OptionResolverStructure, shardId: number, command: Command | SubCommand);
    options: ContextOptions<T>;
    metadata: CommandMetadata<UnionToTuple<M>>;
    globalMetadata: GlobalMetadata;
    get proxy(): import("../..").APIRoutes;
    get t(): import("../..").__InternalParseLocale<import("./shared").DefaultLocale> & {
        get(locale?: string): import("./shared").DefaultLocale;
    };
    get fullCommandName(): string;
    write<FR extends boolean = false>(body: InteractionCreateBodyRequest, fetchReply?: FR): Promise<When<FR, WebhookMessageStructure | MessageStructure, void | WebhookMessageStructure | MessageStructure>>;
    deferReply(ephemeral?: boolean): Promise<void | Message>;
    editResponse(body: InteractionMessageUpdateBodyRequest): Promise<Message | import("../..").WebhookMessage>;
    deleteResponse(): Promise<void>;
    editOrReply<FR extends boolean = false>(body: InteractionCreateBodyRequest | InteractionMessageUpdateBodyRequest, fetchReply?: FR): Promise<When<FR, WebhookMessageStructure | MessageStructure, void | WebhookMessageStructure | MessageStructure>>;
    fetchResponse(): Promise<If<InferWithPrefix, WebhookMessageStructure | MessageStructure | undefined, WebhookMessageStructure | undefined>>;
    channel(mode?: 'rest' | 'flow'): Promise<If<InferWithPrefix, AllChannels | undefined, AllChannels>>;
    channel(mode?: 'cache'): ReturnCache<If<InferWithPrefix, AllChannels | undefined, AllChannels>>;
    me(mode?: 'rest' | 'flow'): Promise<GuildMemberStructure>;
    me(mode?: 'cache'): ReturnCache<GuildMemberStructure | undefined>;
    guild(mode?: 'rest' | 'flow'): Promise<GuildStructure<'cached' | 'api'> | undefined>;
    guild(mode?: 'cache'): ReturnCache<GuildStructure<'cached'> | undefined>;
    get guildId(): string | undefined;
    get channelId(): string;
    get author(): import("../..").User;
    get member(): If<InferWithPrefix, GuildMemberStructure | InteractionGuildMemberStructure | undefined, InteractionGuildMemberStructure | undefined>;
    isChat(): this is CommandContext;
}
