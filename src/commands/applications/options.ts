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
} from '../../types';
import type { LocalizationMap } from '../../types/payloads';
import type { CommandContext } from './chatcontext';
import type { DefaultLocale, MiddlewareContext, OKFunction, SeyfertChannelMap, StopFunction } from './shared';

export interface SeyfertBasicOption<T extends keyof ReturnOptionsTypes, R = true | false> {
	required?: R;
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
	R = true | false,
	VC = never,
> {
	required?: R;
	choices?: C;
	value?: ValueCallback<T, C, VC>;
	description: string;
	description_localizations?: APIApplicationCommandBasicOption['description_localizations'];
	name_localizations?: APIApplicationCommandBasicOption['name_localizations'];
	locales?: {
		name?: FlatObjectKeys<DefaultLocale>;
		description?: FlatObjectKeys<DefaultLocale>;
	};
}

export type SeyfertChoice<T extends string | number> =
	| {
			readonly name: string;
			readonly value: T;
			name_localizations?: LocalizationMap | null;
			locales?: FlatObjectKeys<DefaultLocale>;
	  }
	| (APIApplicationCommandOptionChoice<T> & {
			locales?: FlatObjectKeys<DefaultLocale>;
	  });

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
	C = T extends ChoiceableTypes ? SeyfertChoice<ChoiceableValues[T]>[] : keyof SeyfertChannelMap,
	I = any,
> = (
	data: {
		context: CommandContext;
		value: T extends ChoiceableTypes
			? C extends SeyfertChoice<ChoiceableValues[T]>[]
				? C[number]['value'] extends ReturnOptionsTypes[T]
					? C[number]['value']
					: never
				: never
			: C extends keyof SeyfertChannelMap
				? SeyfertChannelMap[C]
				: never;
	},
	ok: OKFunction<I>,
	fail: StopFunction,
) => Awaitable<void>;

export type SeyfertStringOption<T = SeyfertChoice<string>[], R = boolean, VC = never> = SeyfertBaseChoiceableOption<
	ApplicationCommandOptionType.String,
	T,
	R,
	VC
> & {
	autocomplete?: AutocompleteCallback;
	onAutocompleteError?: OnAutocompleteErrorCallback;
	min_length?: number;
	max_length?: number;
};
export type SeyfertIntegerOption<T = SeyfertChoice<number>[], R = boolean, VC = never> = SeyfertBaseChoiceableOption<
	ApplicationCommandOptionType.Integer,
	T,
	R,
	VC
> & {
	autocomplete?: AutocompleteCallback;
	onAutocompleteError?: OnAutocompleteErrorCallback;
	min_value?: number;
	max_value?: number;
};
export type SeyfertNumberOption<T = SeyfertChoice<number>[], R = boolean, VC = never> = SeyfertBaseChoiceableOption<
	ApplicationCommandOptionType.Number,
	T,
	R,
	VC
> & {
	autocomplete?: AutocompleteCallback;
	onAutocompleteError?: OnAutocompleteErrorCallback;
	min_value?: number;
	max_value?: number;
};
export type SeyfertBooleanOption<R = boolean> = SeyfertBasicOption<ApplicationCommandOptionType.Boolean, R>;
export type SeyfertUserOption<R = boolean> = SeyfertBasicOption<ApplicationCommandOptionType.User, R>;
export type SeyfertChannelOption<C = keyof SeyfertChannelMap, R = true | false, VC = never> = {
	required?: R;
	value?: ValueCallback<ApplicationCommandOptionType.Channel, C, VC>;
	description: string;
	description_localizations?: APIApplicationCommandBasicOption['description_localizations'];
	name_localizations?: APIApplicationCommandBasicOption['name_localizations'];
	locales?: {
		name?: FlatObjectKeys<DefaultLocale>;
		description?: FlatObjectKeys<DefaultLocale>;
	};
	channel_types?: C[];
};
export type SeyfertRoleOption<R = boolean> = SeyfertBasicOption<ApplicationCommandOptionType.Role, R>;
export type SeyfertMentionableOption<R = boolean> = SeyfertBasicOption<ApplicationCommandOptionType.Mentionable, R>;
export type SeyfertAttachmentOption<R = boolean> = SeyfertBasicOption<ApplicationCommandOptionType.Attachment, R>;

export function createStringOption<
	R extends boolean,
	C extends SeyfertChoice<string>[] = SeyfertChoice<string>[],
	VC = never,
>(data: SeyfertStringOption<C, R, VC>) {
	return { ...data, type: ApplicationCommandOptionType.String } as const;
}

export function createIntegerOption<
	R extends boolean,
	C extends SeyfertChoice<number>[] = SeyfertChoice<number>[],
	VC = never,
>(data: SeyfertIntegerOption<C, R, VC>) {
	return { ...data, type: ApplicationCommandOptionType.Integer } as const;
}

export function createNumberOption<
	R extends boolean,
	C extends SeyfertChoice<number>[] = SeyfertChoice<number>[],
	VC = never,
>(data: SeyfertNumberOption<C, R, VC>) {
	return { ...data, type: ApplicationCommandOptionType.Number } as const;
}

export function createChannelOption<
	R extends boolean,
	C extends keyof SeyfertChannelMap = keyof SeyfertChannelMap,
	VC = never,
>(data: SeyfertChannelOption<C, R, VC>) {
	return { ...data, type: ApplicationCommandOptionType.Channel } as const;
}

export function createBooleanOption<R extends boolean, T extends SeyfertBooleanOption<R> = SeyfertBooleanOption<R>>(
	data: T,
) {
	return { ...data, type: ApplicationCommandOptionType.Boolean } as const;
}

export function createUserOption<R extends boolean, T extends SeyfertUserOption<R> = SeyfertUserOption<R>>(data: T) {
	return { ...data, type: ApplicationCommandOptionType.User } as const;
}

export function createRoleOption<R extends boolean, T extends SeyfertRoleOption<R> = SeyfertRoleOption<R>>(data: T) {
	return { ...data, type: ApplicationCommandOptionType.Role } as const;
}

export function createMentionableOption<
	R extends boolean,
	T extends SeyfertMentionableOption<R> = SeyfertMentionableOption<R>,
>(data: T) {
	return { ...data, type: ApplicationCommandOptionType.Mentionable } as const;
}

export function createAttachmentOption<
	R extends boolean,
	T extends SeyfertAttachmentOption<R> = SeyfertAttachmentOption<R>,
>(data: T) {
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
