import type {
	AutocompleteCallback,
	EntryPointContext,
	MenuCommandContext,
	OnAutocompleteErrorCallback,
	ReturnOptionsTypes,
} from '..';
import type { Awaitable, FlatObjectKeys } from '../../common';
import type { ModalContext } from '../../components';
import type { ComponentContext } from '../../components/componentcontext';
import type { MessageCommandInteraction, UserCommandInteraction } from '../../structures';
import {
	type APIApplicationCommandBasicOption,
	type APIApplicationCommandOptionChoice,
	ApplicationCommandOptionType,
	type ChannelType,
} from '../../types';
import type { CommandContext } from './chatcontext';
import type { DefaultLocale, MiddlewareContext, OKFunction, StopFunction } from './shared';

export interface SeyfertBasicOption<T extends keyof ReturnOptionsTypes> {
	required?: boolean;
	value?(
		data: { context: CommandContext; value: ReturnOptionsTypes[T] },
		ok: OKFunction<any>,
		fail: StopFunction,
	): Awaitable<void>;
	description: string;
	description_localizations?: APIApplicationCommandBasicOption['description_localizations'];
	name_localizations?: APIApplicationCommandBasicOption['name_localizations'];
	locales?: {
		name?: FlatObjectKeys<DefaultLocale>;
		description?: FlatObjectKeys<DefaultLocale>;
	};
}

export interface SeyfertBaseChoiceableOption<
	T extends keyof ReturnOptionsTypes,
	C = T extends ChoiceableTypes ? SeyfertChoice<ChoiceableValues[T]>[] : never,
> {
	required?: boolean;
	choices?: C;
	value?: ValueCallback<T, C>;
	description: string;
	description_localizations?: APIApplicationCommandBasicOption['description_localizations'];
	name_localizations?: APIApplicationCommandBasicOption['name_localizations'];
	locales?: {
		name?: FlatObjectKeys<DefaultLocale>;
		description?: FlatObjectKeys<DefaultLocale>;
	};
}

export type SeyfertChoice<T extends string | number> =
	| { readonly name: string; readonly value: T }
	| APIApplicationCommandOptionChoice<T>;

export type ChoiceableTypes =
	| ApplicationCommandOptionType.String
	| ApplicationCommandOptionType.Integer
	| ApplicationCommandOptionType.Number;

export interface ChoiceableValues {
	[ApplicationCommandOptionType.String]: string;
	[ApplicationCommandOptionType.Number]: number;
	[ApplicationCommandOptionType.Integer]: number;
}

export type ValueCallback<
	T extends keyof ReturnOptionsTypes,
	C = T extends ChoiceableTypes ? SeyfertChoice<ChoiceableValues[T]>[] : never,
> = (
	data: {
		context: CommandContext;
		value: T extends ChoiceableTypes
			? C extends SeyfertChoice<ChoiceableValues[T]>[]
				? C[number]['value'] extends ReturnOptionsTypes[T]
					? C[number]['value']
					: ReturnOptionsTypes[T]
				: ReturnOptionsTypes[T]
			: ReturnOptionsTypes[T];
	},
	ok: OKFunction<any>,
	fail: StopFunction,
) => Awaitable<void>;

export type SeyfertStringOption<T = SeyfertChoice<string>[]> = SeyfertBaseChoiceableOption<
	ApplicationCommandOptionType.String,
	T
> & {
	autocomplete?: AutocompleteCallback;
	onAutocompleteError?: OnAutocompleteErrorCallback;
	min_length?: number;
	max_length?: number;
};
export type SeyfertIntegerOption<T = SeyfertChoice<number>[]> = SeyfertBaseChoiceableOption<
	ApplicationCommandOptionType.Integer,
	T
> & {
	autocomplete?: AutocompleteCallback;
	onAutocompleteError?: OnAutocompleteErrorCallback;
	min_value?: number;
	max_value?: number;
};
export type SeyfertNumberOption<T = SeyfertChoice<number>[]> = SeyfertBaseChoiceableOption<
	ApplicationCommandOptionType.Number,
	T
> & {
	autocomplete?: AutocompleteCallback;
	onAutocompleteError?: OnAutocompleteErrorCallback;
	min_value?: number;
	max_value?: number;
};
export type SeyfertBooleanOption = SeyfertBasicOption<ApplicationCommandOptionType.Boolean>;
export type SeyfertUserOption = SeyfertBasicOption<ApplicationCommandOptionType.User>;
export type SeyfertChannelOption = SeyfertBasicOption<ApplicationCommandOptionType.Channel> & {
	channel_types?: ChannelType[];
};
export type SeyfertRoleOption = SeyfertBasicOption<ApplicationCommandOptionType.Role>;
export type SeyfertMentionableOption = SeyfertBasicOption<ApplicationCommandOptionType.Mentionable>;
export type SeyfertAttachmentOption = SeyfertBasicOption<ApplicationCommandOptionType.Attachment>;

export function createStringOption<C extends SeyfertChoice<string>[] = SeyfertChoice<string>[]>(
	data: SeyfertStringOption<C>,
) {
	return { ...data, type: ApplicationCommandOptionType.String } as const;
}

export function createIntegerOption<C extends SeyfertChoice<number>[] = SeyfertChoice<number>[]>(
	data: SeyfertIntegerOption<C>,
) {
	return { ...data, type: ApplicationCommandOptionType.Integer } as const;
}

export function createNumberOption<C extends SeyfertChoice<number>[] = SeyfertChoice<number>[]>(
	data: SeyfertNumberOption<C>,
) {
	return { ...data, type: ApplicationCommandOptionType.Number } as const;
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

export function createAttachmentOption<T extends SeyfertAttachmentOption = SeyfertAttachmentOption>(data: T) {
	return { ...data, type: ApplicationCommandOptionType.Attachment } as const;
}

export type AnyContext =
	| CommandContext
	| MenuCommandContext<MessageCommandInteraction<boolean> | UserCommandInteraction<boolean>>
	| ComponentContext
	| ModalContext
	| EntryPointContext;

export function createMiddleware<T = any, C extends AnyContext = AnyContext>(data: MiddlewareContext<T, C>) {
	return data;
}
