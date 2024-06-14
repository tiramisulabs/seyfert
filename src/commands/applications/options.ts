import {
	ApplicationCommandOptionType,
	type APIApplicationCommandOptionChoice,
	type ChannelType,
} from 'discord-api-types/v10';
import type {
	AutocompleteCallback,
	MenuCommandContext,
	OnAutocompleteErrorCallback,
	ReturnOptionsTypes,
	__TypesWrapper,
} from '..';
import type { MessageCommandInteraction, UserCommandInteraction } from '../../structures';
import type { CommandContext } from './chatcontext';
import type { MiddlewareContext } from './shared';
import type { ModalContext } from '../../components';
import type { ComponentContext } from '../../components/componentcontext';

export type SeyfertBasicOption<T extends keyof __TypesWrapper, D = {}> = __TypesWrapper[T] & D;

export type SeyfertStringOption = SeyfertBasicOption<'String'> & {
	autocomplete?: AutocompleteCallback;
	onAutocompleteError?: OnAutocompleteErrorCallback;
	choices?:
		| readonly { readonly name: string; readonly value: string }[]
		| APIApplicationCommandOptionChoice<ReturnOptionsTypes[ApplicationCommandOptionType.String]>[];
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

export function createStringOption<T extends SeyfertStringOption = SeyfertStringOption>(data: T) {
	return { ...data, type: ApplicationCommandOptionType.String } as const;
}

export function createIntegerOption<T extends SeyfertIntegerOption = SeyfertIntegerOption>(data: T) {
	return { ...data, type: ApplicationCommandOptionType.Integer } as const;
}

export function createBooleanOption<T extends SeyfertBooleanOption = SeyfertBooleanOption>(data: T) {
	return { ...data, type: ApplicationCommandOptionType.Boolean } as const;
}

export function createUserOption<T extends SeyfertUserOption = SeyfertUserOption>(data: T) {
	return { ...data, type: ApplicationCommandOptionType.User } as const;
}

export function createChannelOption<T extends SeyfertChannelOption = SeyfertChannelOption>(data: T) {
	return { ...data, type: ApplicationCommandOptionType.Channel } as const;
}

export function createRoleOption<T extends SeyfertRoleOption = SeyfertRoleOption>(data: T) {
	return { ...data, type: ApplicationCommandOptionType.Role } as const;
}

export function createMentionableOption<T extends SeyfertMentionableOption = SeyfertMentionableOption>(data: T) {
	return { ...data, type: ApplicationCommandOptionType.Mentionable } as const;
}

export function createNumberOption<T extends SeyfertNumberOption = SeyfertNumberOption>(data: T) {
	return { ...data, type: ApplicationCommandOptionType.Number } as const;
}

export function createAttachmentOption<T extends SeyfertAttachmentOption = SeyfertAttachmentOption>(data: T) {
	return { ...data, type: ApplicationCommandOptionType.Attachment } as const;
}

export function createMiddleware<
	T = any,
	C extends
		| CommandContext
		| MenuCommandContext<MessageCommandInteraction<boolean> | UserCommandInteraction<boolean>>
		| ComponentContext
		| ModalContext =
		| CommandContext
		| MenuCommandContext<MessageCommandInteraction<boolean> | UserCommandInteraction<boolean>>
		| ComponentContext
		| ModalContext,
>(data: MiddlewareContext<T, C>) {
	return data;
}
