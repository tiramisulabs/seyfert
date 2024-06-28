import type { AllChannels, ButtonInteraction, ChannelSelectMenuInteraction, ComponentCommand, MentionableSelectMenuInteraction, ReturnCache, RoleSelectMenuInteraction, StringSelectMenuInteraction, UserSelectMenuInteraction } from '..';
import type { CommandMetadata, ExtendContext, GlobalMetadata, RegisteredMiddlewares, UsingClient } from '../commands';
import { BaseContext } from '../commands/basecontext';
import type { ComponentInteractionMessageUpdate, InteractionCreateBodyRequest, InteractionMessageUpdateBodyRequest, ModalCreateBodyRequest, UnionToTuple, When } from '../common';
import type { GuildMemberStructure, GuildStructure, MessageStructure, WebhookMessageStructure } from '../client/transformers';
export interface ComponentContext<Type extends keyof ContextComponentCommandInteractionMap = keyof ContextComponentCommandInteractionMap> extends BaseContext, ExtendContext {
}
/**
 * Represents a context for interacting with components in a Discord bot.
 * @template Type - The type of component interaction.
 */
export declare class ComponentContext<Type extends keyof ContextComponentCommandInteractionMap, M extends keyof RegisteredMiddlewares = never> extends BaseContext {
    readonly client: UsingClient;
    interaction: ContextComponentCommandInteractionMap[Type];
    /**
     * Creates a new instance of the ComponentContext class.
     * @param client - The UsingClient instance.
     * @param interaction - The component interaction object.
     */
    constructor(client: UsingClient, interaction: ContextComponentCommandInteractionMap[Type]);
    command: ComponentCommand;
    metadata: CommandMetadata<UnionToTuple<M>>;
    globalMetadata: GlobalMetadata;
    /**
     * Gets the language object for the interaction's locale.
     */
    get t(): import("..").__InternalParseLocale<import("..").DefaultLocale> & {
        get(locale?: string): import("..").DefaultLocale;
    };
    /**
     * Gets the custom ID of the interaction.
     */
    get customId(): string;
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
     * Updates the interaction with new data.
     * @param body - The updated body of the interaction.
     */
    update(body: ComponentInteractionMessageUpdate): Promise<void>;
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
    modal(body: ModalCreateBodyRequest): Promise<void>;
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
    isComponent(): this is ComponentContext<keyof ContextComponentCommandInteractionMap>;
    isButton(): this is ComponentContext<'Button'>;
    isChannelSelectMenu(): this is ComponentContext<'ChannelSelect'>;
    isRoleSelectMenu(): this is ComponentContext<'RoleSelect'>;
    isMentionableSelectMenu(): this is ComponentContext<'MentionableSelect'>;
    isUserSelectMenu(): this is ComponentContext<'UserSelect'>;
    isStringSelectMenu(): this is ComponentContext<'StringSelect'>;
}
export interface ContextComponentCommandInteractionMap {
    Button: ButtonInteraction;
    StringSelect: StringSelectMenuInteraction;
    UserSelect: UserSelectMenuInteraction;
    RoleSelect: RoleSelectMenuInteraction;
    MentionableSelect: MentionableSelectMenuInteraction;
    ChannelSelect: ChannelSelectMenuInteraction;
}
