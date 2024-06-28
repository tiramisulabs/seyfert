import type { AllChannels, ModalCommand, ModalSubmitInteraction, ReturnCache } from '..';
import type { CommandMetadata, ExtendContext, GlobalMetadata, RegisteredMiddlewares, UsingClient } from '../commands';
import { BaseContext } from '../commands/basecontext';
import type { InteractionCreateBodyRequest, InteractionMessageUpdateBodyRequest, ModalCreateBodyRequest, UnionToTuple, When } from '../common';
import type { GuildMemberStructure, GuildStructure, MessageStructure, WebhookMessageStructure } from '../client/transformers';
export interface ModalContext extends BaseContext, ExtendContext {
}
/**
 * Represents a context for interacting with components in a Discord bot.
 * @template Type - The type of component interaction.
 */
export declare class ModalContext<M extends keyof RegisteredMiddlewares = never> extends BaseContext {
    readonly client: UsingClient;
    interaction: ModalSubmitInteraction;
    /**
     * Creates a new instance of the ComponentContext class.
     * @param client - The UsingClient instance.
     * @param interaction - The component interaction object.
     */
    constructor(client: UsingClient, interaction: ModalSubmitInteraction);
    command: ModalCommand;
    metadata: CommandMetadata<UnionToTuple<M>>;
    globalMetadata: GlobalMetadata;
    get customId(): string;
    get components(): {
        components: {
            type: import("discord-api-types/v10").ComponentType;
            customId: string;
            value: string;
        }[];
        type: import("discord-api-types/v10").ComponentType.ActionRow;
    }[];
    /**
     * Gets the language object for the interaction's locale.
     */
    get t(): import("..").__InternalParseLocale<import("..").DefaultLocale> & {
        get(locale?: string): import("..").DefaultLocale;
    };
    /**
     * Writes a response to the interaction.
     * @param body - The body of the response.
     * @param fetchReply - Whether to fetch the reply or not.
     */
    write<FR extends boolean = false>(body: InteractionCreateBodyRequest, fetchReply?: FR): Promise<When<FR, import("..").WebhookMessage, void>>;
    /**
     * Defers the reply to the interaction.
     * @param ephemeral - Whether the reply should be ephemeral or not.
     */
    deferReply(ephemeral?: boolean): Promise<void>;
    /**
     * Edits the response of the interaction.
     * @param body - The updated body of the response.
     */
    editResponse(body: InteractionMessageUpdateBodyRequest): Promise<import("..").WebhookMessage>;
    /**
     * Edits the response or replies to the interaction.
     * @param body - The body of the response or updated body of the interaction.
     * @param fetchReply - Whether to fetch the reply or not.
     */
    editOrReply<FR extends boolean = false>(body: InteractionCreateBodyRequest | InteractionMessageUpdateBodyRequest, fetchReply?: FR): Promise<When<FR, WebhookMessageStructure | MessageStructure, void | WebhookMessageStructure | MessageStructure>>;
    /**
     * Deletes the response of the interaction.
     * @returns A promise that resolves when the response is deleted.
     */
    deleteResponse(): Promise<void | undefined>;
    modal(body: ModalCreateBodyRequest): any;
    /**
     * Gets the channel of the interaction.
     * @param mode - The mode to fetch the channel.
     * @returns A promise that resolves to the channel.
     */
    channel(mode?: 'rest' | 'flow'): Promise<AllChannels>;
    channel(mode?: 'cache'): ReturnCache<AllChannels>;
    /**
     * Gets the bot member in the guild of the interaction.
     * @param mode - The mode to fetch the member.
     * @returns A promise that resolves to the bot member.
     */
    me(mode?: 'rest' | 'flow'): Promise<GuildMemberStructure>;
    me(mode?: 'cache'): ReturnCache<GuildMemberStructure | undefined>;
    /**
     * Gets the guild of the interaction.
     * @param mode - The mode to fetch the guild.
     * @returns A promise that resolves to the guild.
     */
    guild(mode?: 'rest' | 'flow'): Promise<GuildStructure<'cached' | 'api'> | undefined>;
    guild(mode?: 'cache'): ReturnCache<GuildStructure<'cached'> | undefined>;
    /**
     * Gets the ID of the guild of the interaction.
     */
    get guildId(): string | undefined;
    /**
     * Gets the ID of the channel of the interaction.
     */
    get channelId(): string;
    /**
     * Gets the author of the interaction.
     */
    get author(): import("..").User;
    /**
     * Gets the member of the interaction.
     */
    get member(): import("..").InteractionGuildMember | undefined;
    isModal(): this is ModalContext;
}
