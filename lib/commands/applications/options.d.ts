import { ApplicationCommandOptionType, type APIApplicationCommandOptionChoice, type ChannelType } from 'discord-api-types/v10';
import type { AutocompleteCallback, MenuCommandContext, OnAutocompleteErrorCallback, ReturnOptionsTypes, __TypesWrapper } from '..';
import type { MessageCommandInteraction, UserCommandInteraction } from '../../structures';
import type { CommandContext } from './chatcontext';
import type { MiddlewareContext } from './shared';
import type { ModalContext } from '../../components';
import type { ComponentContext } from '../../components/componentcontext';
export type SeyfertBasicOption<T extends keyof __TypesWrapper, D = {}> = __TypesWrapper[T] & D;
export type SeyfertStringOption = SeyfertBasicOption<'String'> & {
    autocomplete?: AutocompleteCallback;
    onAutocompleteError?: OnAutocompleteErrorCallback;
    choices?: readonly {
        readonly name: string;
        readonly value: string;
    }[] | APIApplicationCommandOptionChoice<ReturnOptionsTypes[ApplicationCommandOptionType.String]>[];
    min_length?: number;
    max_length?: number;
};
export type SeyfertIntegerOption = SeyfertBasicOption<'Integer'> & {
    autocomplete?: AutocompleteCallback;
    onAutocompleteError?: OnAutocompleteErrorCallback;
    choices?: APIApplicationCommandOptionChoice<ReturnOptionsTypes[ApplicationCommandOptionType.Integer]>[];
    min_value?: number;
    max_value?: number;
};
export type SeyfertBooleanOption = SeyfertBasicOption<'Boolean'>;
export type SeyfertUserOption = SeyfertBasicOption<'User'>;
export type SeyfertChannelOption = SeyfertBasicOption<'Channel'> & {
    channel_types?: ChannelType[];
};
export type SeyfertRoleOption = SeyfertBasicOption<'Role'>;
export type SeyfertMentionableOption = SeyfertBasicOption<'Mentionable'>;
export type SeyfertNumberOption = SeyfertBasicOption<'Number'> & {
    autocomplete?: AutocompleteCallback;
    onAutocompleteError?: OnAutocompleteErrorCallback;
    choices?: APIApplicationCommandOptionChoice<ReturnOptionsTypes[ApplicationCommandOptionType.Number]>[];
    min_value?: number;
    max_value?: number;
};
export type SeyfertAttachmentOption = SeyfertBasicOption<'Attachment'>;
export declare function createStringOption<T extends SeyfertStringOption = SeyfertStringOption>(data: T): T & {
    readonly type: ApplicationCommandOptionType.String;
};
export declare function createIntegerOption<T extends SeyfertIntegerOption = SeyfertIntegerOption>(data: T): T & {
    readonly type: ApplicationCommandOptionType.Integer;
};
export declare function createBooleanOption<T extends SeyfertBooleanOption = SeyfertBooleanOption>(data: T): T & {
    readonly type: ApplicationCommandOptionType.Boolean;
};
export declare function createUserOption<T extends SeyfertUserOption = SeyfertUserOption>(data: T): T & {
    readonly type: ApplicationCommandOptionType.User;
};
export declare function createChannelOption<T extends SeyfertChannelOption = SeyfertChannelOption>(data: T): T & {
    readonly type: ApplicationCommandOptionType.Channel;
};
export declare function createRoleOption<T extends SeyfertRoleOption = SeyfertRoleOption>(data: T): T & {
    readonly type: ApplicationCommandOptionType.Role;
};
export declare function createMentionableOption<T extends SeyfertMentionableOption = SeyfertMentionableOption>(data: T): T & {
    readonly type: ApplicationCommandOptionType.Mentionable;
};
export declare function createNumberOption<T extends SeyfertNumberOption = SeyfertNumberOption>(data: T): T & {
    readonly type: ApplicationCommandOptionType.Number;
};
export declare function createAttachmentOption<T extends SeyfertAttachmentOption = SeyfertAttachmentOption>(data: T): T & {
    readonly type: ApplicationCommandOptionType.Attachment;
};
export declare function createMiddleware<T = any, C extends CommandContext | MenuCommandContext<MessageCommandInteraction<boolean> | UserCommandInteraction<boolean>> | ComponentContext | ModalContext = CommandContext | MenuCommandContext<MessageCommandInteraction<boolean> | UserCommandInteraction<boolean>> | ComponentContext | ModalContext>(data: MiddlewareContext<T, C>): MiddlewareContext<T, C>;
