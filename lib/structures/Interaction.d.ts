import { type APIApplicationCommandAutocompleteInteraction, type APIApplicationCommandInteraction, type APIBaseInteraction, type APIChatInputApplicationCommandInteraction, type APIChatInputApplicationCommandInteractionData, type APICommandAutocompleteInteractionResponseCallbackData, type APIInteraction, type APIInteractionResponse, type APIInteractionResponseChannelMessageWithSource, type APIInteractionResponseDeferredChannelMessageWithSource, type APIInteractionResponseDeferredMessageUpdate, type APIInteractionResponsePong, type APIInteractionResponseUpdateMessage, type APIMessageApplicationCommandInteraction, type APIMessageApplicationCommandInteractionData, type APIMessageButtonInteractionData, type APIMessageComponentInteraction, type APIMessageComponentSelectMenuInteraction, type APIMessageStringSelectInteractionData, type APIModalSubmission, type APIModalSubmitInteraction, type APIUserApplicationCommandInteraction, type APIUserApplicationCommandInteractionData, ApplicationCommandType, ComponentType, type GatewayInteractionCreateDispatchData, InteractionResponseType, InteractionType, type MessageFlags, type RESTPostAPIInteractionCallbackJSONBody } from 'discord-api-types/v10';
import type { RawFile } from '../api';
import type { UsingClient } from '../commands';
import type { ObjectToLower, OmitInsert, ToClass, When } from '../common';
import type { ComponentInteractionMessageUpdate, InteractionCreateBodyRequest, InteractionMessageUpdateBodyRequest, MessageCreateBodyRequest, MessageUpdateBodyRequest, MessageWebhookCreateBodyRequest, ModalCreateBodyRequest } from '../common/types/write';
import type { AllChannels } from './';
import { DiscordBase } from './extra/DiscordBase';
import { PermissionsBitField } from './extra/Permissions';
import { type GuildRoleStructure, type InteractionGuildMemberStructure, type MessageStructure, type UserStructure, type WebhookMessageStructure, type OptionResolverStructure } from '../client/transformers';
export type ReplyInteractionBody = {
    type: InteractionResponseType.Modal;
    data: ModalCreateBodyRequest;
} | {
    type: InteractionResponseType.ChannelMessageWithSource | InteractionResponseType.UpdateMessage;
    data: InteractionCreateBodyRequest | InteractionMessageUpdateBodyRequest | ComponentInteractionMessageUpdate;
} | Exclude<RESTPostAPIInteractionCallbackJSONBody, APIInteractionResponsePong>;
export interface BaseInteraction extends ObjectToLower<Omit<APIBaseInteraction<InteractionType, any>, 'user' | 'member' | 'message' | 'channel' | 'type' | 'app_permissions'>> {
}
export declare class BaseInteraction<FromGuild extends boolean = boolean, Type extends APIInteraction = APIInteraction> extends DiscordBase<Type> {
    readonly client: UsingClient;
    protected __reply?: __InternalReplyFunction | undefined;
    user: UserStructure;
    member: When<FromGuild, InteractionGuildMemberStructure, undefined>;
    channel?: AllChannels;
    message?: MessageStructure;
    replied?: Promise<boolean> | boolean;
    appPermissions?: PermissionsBitField;
    constructor(client: UsingClient, interaction: Type, __reply?: __InternalReplyFunction | undefined);
    static transformBodyRequest(body: ReplyInteractionBody, files: RawFile[] | undefined, self: UsingClient): APIInteractionResponse;
    static transformBody<T>(body: InteractionMessageUpdateBodyRequest | MessageUpdateBodyRequest | MessageCreateBodyRequest | MessageWebhookCreateBodyRequest, files: RawFile[] | undefined, self: UsingClient): T;
    private matchReplied;
    reply(body: ReplyInteractionBody): Promise<void>;
    deferReply(flags?: MessageFlags): Promise<void>;
    static from(client: UsingClient, gateway: GatewayInteractionCreateDispatchData, __reply?: __InternalReplyFunction): ModalSubmitInteraction<boolean> | AutocompleteInteraction<boolean> | ChatInputCommandInteraction<boolean> | UserCommandInteraction<boolean> | MessageCommandInteraction<boolean> | ButtonInteraction | ChannelSelectMenuInteraction | RoleSelectMenuInteraction | MentionableSelectMenuInteraction | UserSelectMenuInteraction | StringSelectMenuInteraction<string[]> | BaseInteraction<boolean, import("discord-api-types/v10").APIPingInteraction>;
    fetchGuild(force?: boolean): Promise<import("./Guild").Guild<"api">> | undefined;
}
export type AllInteractions = AutocompleteInteraction | ChatInputCommandInteraction | UserCommandInteraction | MessageCommandInteraction | ComponentInteraction | SelectMenuInteraction | ModalSubmitInteraction | BaseInteraction;
export interface AutocompleteInteraction extends ObjectToLower<Omit<APIApplicationCommandAutocompleteInteraction, 'user' | 'member' | 'type' | 'data' | 'message' | 'channel' | 'app_permissions'>> {
}
export declare class AutocompleteInteraction<FromGuild extends boolean = boolean> extends BaseInteraction<FromGuild, APIApplicationCommandAutocompleteInteraction> {
    protected __reply?: __InternalReplyFunction | undefined;
    type: InteractionType.ApplicationCommandAutocomplete;
    data: ObjectToLower<APIApplicationCommandAutocompleteInteraction['data']>;
    options: OptionResolverStructure;
    constructor(client: UsingClient, interaction: APIApplicationCommandAutocompleteInteraction, resolver?: OptionResolverStructure, __reply?: __InternalReplyFunction | undefined);
    getInput(): string;
    respond(choices: APICommandAutocompleteInteractionResponseCallbackData['choices']): Promise<void>;
    /** @intenal */
    reply(..._args: unknown[]): Promise<void>;
}
export declare class Interaction<FromGuild extends boolean = boolean, Type extends APIInteraction = APIInteraction> extends BaseInteraction<FromGuild, Type> {
    fetchMessage(messageId: string): Promise<import("./Message").WebhookMessage | undefined>;
    fetchResponse(): Promise<import("./Message").WebhookMessage | undefined>;
    write<FR extends boolean = false>(body: InteractionCreateBodyRequest, fetchReply?: FR): Promise<When<FR, WebhookMessageStructure, void>>;
    modal(body: ModalCreateBodyRequest): Promise<void>;
    editOrReply<FR extends boolean = false>(body: InteractionCreateBodyRequest, fetchReply?: FR): Promise<When<FR, WebhookMessageStructure, void>>;
    editMessage(messageId: string, body: InteractionMessageUpdateBodyRequest): Promise<import("./Message").WebhookMessage>;
    editResponse(body: InteractionMessageUpdateBodyRequest): Promise<import("./Message").WebhookMessage>;
    deleteResponse(): Promise<void | undefined>;
    deleteMessage(messageId: string): Promise<void | undefined>;
    followup(body: MessageWebhookCreateBodyRequest): Promise<import("./Message").WebhookMessage>;
}
export declare class ApplicationCommandInteraction<FromGuild extends boolean = boolean, Type extends APIApplicationCommandInteraction = APIApplicationCommandInteraction> extends Interaction<FromGuild, Type> {
    type: ApplicationCommandType;
    respond(data: APIInteractionResponseChannelMessageWithSource | APIInteractionResponseDeferredChannelMessageWithSource | APIInteractionResponseDeferredMessageUpdate | APIInteractionResponseUpdateMessage): Promise<void>;
}
export interface ComponentInteraction extends ObjectToLower<Omit<APIMessageComponentInteraction, 'user' | 'member' | 'type' | 'data' | 'message' | 'channel' | 'app_permissions'>> {
}
export declare class ComponentInteraction<FromGuild extends boolean = boolean, Type extends APIMessageComponentInteraction = APIMessageComponentInteraction> extends Interaction<FromGuild, Type> {
    data: ObjectToLower<APIMessageComponentInteraction['data']>;
    channelId: string;
    channel: AllChannels;
    type: InteractionType.MessageComponent;
    message: MessageStructure;
    update(data: ComponentInteractionMessageUpdate): Promise<void>;
    deferUpdate(): Promise<void>;
    get customId(): string;
    get componentType(): ComponentType.Button | ComponentType.StringSelect | ComponentType.UserSelect | ComponentType.RoleSelect | ComponentType.MentionableSelect | ComponentType.ChannelSelect;
    isButton(): this is ButtonInteraction;
    isChannelSelectMenu(): this is ChannelSelectMenuInteraction;
    isRoleSelectMenu(): this is RoleSelectMenuInteraction;
    isMentionableSelectMenu(): this is MentionableSelectMenuInteraction;
    isUserSelectMenu(): this is UserSelectMenuInteraction;
    isStringSelectMenu(): this is StringSelectMenuInteraction;
}
export declare class ButtonInteraction extends ComponentInteraction {
    data: ObjectToLower<APIMessageButtonInteractionData>;
}
export declare class SelectMenuInteraction extends ComponentInteraction {
    protected __reply?: __InternalReplyFunction | undefined;
    data: ObjectToLower<APIMessageComponentSelectMenuInteraction['data']>;
    constructor(client: UsingClient, interaction: APIMessageComponentSelectMenuInteraction, __reply?: __InternalReplyFunction | undefined);
    get values(): string[];
}
declare const StringSelectMenuInteraction_base: ToClass<Omit<SelectMenuInteraction, "data">, StringSelectMenuInteraction<string[]>>;
export declare class StringSelectMenuInteraction<T extends any[] = string[]> extends StringSelectMenuInteraction_base {
    data: OmitInsert<ObjectToLower<APIMessageStringSelectInteractionData>, 'values', {
        values: T;
    }>;
    values: T;
}
export declare class ChannelSelectMenuInteraction extends SelectMenuInteraction {
    protected __reply?: __InternalReplyFunction | undefined;
    channels: AllChannels[];
    constructor(client: UsingClient, interaction: APIMessageComponentSelectMenuInteraction, __reply?: __InternalReplyFunction | undefined);
}
export declare class MentionableSelectMenuInteraction extends SelectMenuInteraction {
    protected __reply?: __InternalReplyFunction | undefined;
    roles: GuildRoleStructure[];
    members: InteractionGuildMemberStructure[];
    users: UserStructure[];
    constructor(client: UsingClient, interaction: APIMessageComponentSelectMenuInteraction, __reply?: __InternalReplyFunction | undefined);
}
export declare class RoleSelectMenuInteraction extends SelectMenuInteraction {
    protected __reply?: __InternalReplyFunction | undefined;
    roles: GuildRoleStructure[];
    constructor(client: UsingClient, interaction: APIMessageComponentSelectMenuInteraction, __reply?: __InternalReplyFunction | undefined);
}
export declare class UserSelectMenuInteraction extends SelectMenuInteraction {
    protected __reply?: __InternalReplyFunction | undefined;
    members: InteractionGuildMemberStructure[];
    users: UserStructure[];
    constructor(client: UsingClient, interaction: APIMessageComponentSelectMenuInteraction, __reply?: __InternalReplyFunction | undefined);
}
export declare class ChatInputCommandInteraction<FromGuild extends boolean = boolean> extends ApplicationCommandInteraction<FromGuild, APIChatInputApplicationCommandInteraction> {
    data: ObjectToLower<APIChatInputApplicationCommandInteractionData>;
}
export declare class UserCommandInteraction<FromGuild extends boolean = boolean> extends ApplicationCommandInteraction<FromGuild, APIUserApplicationCommandInteraction> {
    type: ApplicationCommandType.User;
    data: ObjectToLower<APIUserApplicationCommandInteractionData>;
}
export declare class MessageCommandInteraction<FromGuild extends boolean = boolean> extends ApplicationCommandInteraction<FromGuild, APIMessageApplicationCommandInteraction> {
    type: ApplicationCommandType.Message;
    data: ObjectToLower<APIMessageApplicationCommandInteractionData>;
}
export interface ModalSubmitInteraction<FromGuild extends boolean = boolean> extends Omit<Interaction<FromGuild, APIModalSubmitInteraction>, 'modal'> {
}
export declare class ModalSubmitInteraction<FromGuild extends boolean = boolean> extends BaseInteraction<FromGuild> {
    data: ObjectToLower<APIModalSubmission>;
    get customId(): string;
    get components(): {
        components: {
            type: ComponentType;
            customId: string;
            value: string;
        }[];
        type: ComponentType.ActionRow;
    }[];
    getInputValue(customId: string, required: true): string;
    getInputValue(customId: string, required?: false): string | undefined;
}
export {};
