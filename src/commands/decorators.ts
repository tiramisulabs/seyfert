import type { RegisteredPluginMiddlewares, SeyfertRegistry } from '../client/plugins';
import type { FlatObjectKeys, PermissionStrings } from '../common';
import { PermissionsBitField } from '../structures/extra/Permissions';
import {
	ApplicationCommandType,
	ApplicationIntegrationType,
	type EntryPointCommandHandlerType,
	InteractionContextType,
	type LocaleString,
} from '../types';
import type { CommandOption, OptionsRecord, SubCommand } from './applications/chat';
import type { AnyMiddlewareContext, DefaultLocale, ExtraProps, IgnoreCommand } from './applications/shared';

export type RegisteredMiddlewares = SeyfertRegistry extends {
	middlewares: infer M extends Record<string, AnyMiddlewareContext>;
}
	? M
	: {};
export type ResolvedRegisteredMiddlewares = RegisteredMiddlewares & RegisteredPluginMiddlewares;
type MiddlewareKey = keyof ResolvedRegisteredMiddlewares;

export type InferMiddlewares<T extends readonly MiddlewareKey[]> = T[number];

export type CommandDeclareOptions =
	| DecoratorDeclareOptions
	| (Omit<DecoratorDeclareOptions, 'description'> & {
			type: ApplicationCommandType.User | ApplicationCommandType.Message;
	  })
	| (Omit<DecoratorDeclareOptions, 'ignore' | 'aliases' | 'guildId'> & {
			type: ApplicationCommandType.PrimaryEntryPoint;
			handler: EntryPointCommandHandlerType;
	  });
export interface DecoratorDeclareOptions {
	name: string;
	description: string;
	botPermissions?: PermissionStrings;
	defaultMemberPermissions?: PermissionStrings;
	guildId?: string[];
	nsfw?: boolean;
	integrationTypes?: (keyof typeof ApplicationIntegrationType)[] | ApplicationIntegrationType[];
	contexts?: (keyof typeof InteractionContextType)[] | InteractionContextType[];
	ignore?: IgnoreCommand;
	aliases?: string[];
	props?: ExtraProps;
}

export function Locales({
	name: names,
	description: descriptions,
}: {
	name?: [language: LocaleString, value: string][];
	description?: [language: LocaleString, value: string][];
}) {
	return <T extends { new (...args: any[]): object }>(target: T) =>
		class extends target {
			name_localizations = names ? Object.fromEntries(names) : undefined;
			description_localizations = descriptions ? Object.fromEntries(descriptions) : undefined;
		};
}

export function LocalesT(name?: FlatObjectKeys<DefaultLocale>, description?: FlatObjectKeys<DefaultLocale>) {
	return <T extends { new (...args: any[]): object }>(target: T) =>
		class extends target {
			__t = { name, description };
		};
}

export type TranslatedGroupDefinition = {
	name?: FlatObjectKeys<DefaultLocale>;
	description?: FlatObjectKeys<DefaultLocale>;
	defaultDescription: string;
	aliases?: string[];
};

export type LocalizedGroupDefinition = {
	name?: [language: LocaleString, value: string][];
	description?: [language: LocaleString, value: string][];
	defaultDescription: string;
	aliases?: string[];
};

export type GroupDefinition = TranslatedGroupDefinition | LocalizedGroupDefinition;
export type GroupDefinitions = Record<string, LocalizedGroupDefinition> | Record<string, TranslatedGroupDefinition>;

export function defineGroups<const T extends Record<string, LocalizedGroupDefinition>>(groups: T): T;
export function defineGroups<const T extends Record<string, TranslatedGroupDefinition>>(groups: T): T;
export function defineGroups(groups: GroupDefinitions): GroupDefinitions {
	return groups;
}

export function GroupsT<const T extends Record<string /* name for group*/, TranslatedGroupDefinition>>(groups: T) {
	return <T extends { new (...args: any[]): object }>(target: T) =>
		class extends target {
			__tGroups = groups;
			groupsAliases: Record<string, string> = {};
			constructor(...args: any[]) {
				super(...args);
				for (const i in groups) {
					for (const j of groups[i].aliases ?? []) {
						this.groupsAliases[j] = i;
					}
				}
			}
		};
}

export function Groups<const T extends Record<string /* name for group*/, LocalizedGroupDefinition>>(groups: T) {
	return <T extends { new (...args: any[]): object }>(target: T) =>
		class extends target {
			groups = groups;
			groupsAliases: Record<string, string> = {};
			constructor(...args: any[]) {
				super(...args);
				for (const i in groups) {
					for (const j of groups[i].aliases ?? []) {
						this.groupsAliases[j] = i;
					}
				}
			}
		};
}

type GroupDecorator = <T extends { new (...args: any[]): object }>(
	target: T,
) => {
	new (...args: any[]): { group: string };
} & T;

type OptionsDecorator = <T extends { new (...args: any[]): object }>(
	target: T,
) => {
	new (...args: any[]): { options: SubCommand[] | CommandOption[] };
} & T;

type LowercaseOptionsRecord<T extends OptionsRecord> = T & {
	[K in keyof T as K extends string ? (K extends Lowercase<K> ? never : K) : never]: never;
};

export function Group(groupName: string): GroupDecorator;
export function Group<const T extends GroupDefinitions>(_groupsDef: T, groupName: keyof T & string): GroupDecorator;
export function Group(groupsDefOrGroupName: GroupDefinitions | string, groupName?: string) {
	const resolvedGroupName = typeof groupsDefOrGroupName === 'string' ? groupsDefOrGroupName : groupName!;
	return <T extends { new (...args: any[]): object }>(target: T) =>
		class extends target {
			group = resolvedGroupName;
		};
}

export function Options(options: (new () => SubCommand)[]): OptionsDecorator;
export function Options<const T extends OptionsRecord>(options: LowercaseOptionsRecord<T>): OptionsDecorator;
export function Options(options: (new () => SubCommand)[] | OptionsRecord) {
	return <T extends { new (...args: any[]): object }>(target: T) =>
		class extends target {
			options: SubCommand[] | CommandOption[] = Array.isArray(options)
				? options.map(x => new x())
				: Object.entries(options).map(([name, option]) => {
						return {
							name,
							...option,
						} as CommandOption;
					});
		};
}

export function AutoLoad() {
	return <T extends { new (...args: any[]): object }>(target: T) =>
		class extends target {
			__autoload = true;
		};
}

export function middlewares<const T extends readonly MiddlewareKey[]>(...cbs: T) {
	return cbs;
}

export function Middlewares(cbs: readonly MiddlewareKey[]) {
	return <T extends { new (...args: any[]): object }>(target: T) =>
		class extends target {
			middlewares = cbs;
		};
}

export function Declare(declare: CommandDeclareOptions) {
	return <T extends { new (...args: any[]): object }>(target: T) =>
		class extends target {
			name = declare.name;
			nsfw = declare.nsfw;
			props = declare.props;
			contexts =
				declare.contexts?.map(i => (typeof i === 'string' ? InteractionContextType[i] : i)) ??
				Object.values(InteractionContextType).filter(x => typeof x === 'number');
			integrationTypes = declare.integrationTypes?.map(i =>
				typeof i === 'string' ? ApplicationIntegrationType[i] : i,
			) ?? [ApplicationIntegrationType.GuildInstall];
			defaultMemberPermissions = declare.defaultMemberPermissions
				? PermissionsBitField.resolve(declare.defaultMemberPermissions)
				: declare.defaultMemberPermissions;
			botPermissions = declare.botPermissions
				? PermissionsBitField.resolve(declare.botPermissions)
				: declare.botPermissions;
			description = '';
			type: ApplicationCommandType = ApplicationCommandType.ChatInput;
			guildId?: string[];
			ignore?: IgnoreCommand;
			aliases?: string[];
			handler?: EntryPointCommandHandlerType;
			constructor(...args: any[]) {
				super(...args);
				if ('description' in declare) this.description = declare.description;
				if ('type' in declare) this.type = declare.type;
				if ('guildId' in declare) this.guildId = declare.guildId;
				if ('ignore' in declare) this.ignore = declare.ignore;
				if ('aliases' in declare) this.aliases = declare.aliases;
				if ('handler' in declare) this.handler = declare.handler;
				// check if all properties are valid
			}
		};
}
