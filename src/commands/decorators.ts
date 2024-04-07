import { ApplicationCommandType, PermissionFlagsBits, type LocaleString } from 'discord-api-types/v10';
import type { FlatObjectKeys, PermissionStrings } from '../common';
import type { CommandOption, OptionsRecord, SubCommand } from './applications/chat';
import type { DefaultLocale, IgnoreCommand, MiddlewareContext } from './applications/shared';

export interface RegisteredMiddlewares {}

export enum IntegrationTypes {
	GUILD_INSTALL = 0,
	USER_INSTALL = 1,
}
export enum InteractionContextTypes {
	GUILD = 0,
	BOT_DM = 1,
	PRIVATE_CHANNEL = 2,
}

type DeclareOptions =
	| {
			name: string;
			description: string;
			botPermissions?: PermissionStrings | bigint;
			defaultMemberPermissions?: PermissionStrings | bigint;
			guildId?: string[];
			nsfw?: boolean;
			integrationTypes?: (keyof typeof IntegrationTypes)[];
			contexts?: (keyof typeof InteractionContextTypes)[];
			ignore?: IgnoreCommand;
	  }
	| (Omit<
			{
				name: string;
				description: string;
				botPermissions?: PermissionStrings | bigint;
				defaultMemberPermissions?: PermissionStrings | bigint;
				guildId?: string[];
				nsfw?: boolean;
				integrationTypes?: (keyof typeof IntegrationTypes)[];
				contexts?: (keyof typeof InteractionContextTypes)[];
			},
			'type' | 'description'
	  > & {
			type: ApplicationCommandType.User | ApplicationCommandType.Message;
	  });

export function Locales({
	name: names,
	description: descriptions,
}: {
	name?: [language: LocaleString, value: string][];
	description?: [language: LocaleString, value: string][];
}) {
	return <T extends { new (...args: any[]): {} }>(target: T) =>
		class extends target {
			name_localizations = names ? Object.fromEntries(names) : undefined;
			description_localizations = descriptions ? Object.fromEntries(descriptions) : undefined;
		};
}

export function LocalesT(name?: FlatObjectKeys<DefaultLocale>, description?: FlatObjectKeys<DefaultLocale>) {
	return <T extends { new (...args: any[]): {} }>(target: T) =>
		class extends target {
			__t = { name, description };
		};
}

export function GroupsT(
	groups: Record<
		string /* name for group*/,
		{
			name?: FlatObjectKeys<DefaultLocale>;
			description?: FlatObjectKeys<DefaultLocale>;
			defaultDescription: string;
		}
	>,
) {
	return <T extends { new (...args: any[]): {} }>(target: T) =>
		class extends target {
			__tGroups = groups;
		};
}

export function Groups(
	groups: Record<
		string /* name for group*/,
		{
			name?: [language: LocaleString, value: string][];
			description?: [language: LocaleString, value: string][];
			defaultDescription: string;
		}
	>,
) {
	return <T extends { new (...args: any[]): {} }>(target: T) =>
		class extends target {
			groups = groups;
		};
}

export function Group(groupName: string) {
	return <T extends { new (...args: any[]): {} }>(target: T) =>
		class extends target {
			group = groupName;
		};
}

export function Options(options: (new () => SubCommand)[] | OptionsRecord) {
	return <T extends { new (...args: any[]): {} }>(target: T) =>
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
	return <T extends { new (...args: any[]): {} }>(target: T) =>
		class extends target {
			__autoload = true;
		};
}

export type ParseMiddlewares<T extends Record<string, MiddlewareContext>> = {
	[k in keyof T]: T[k];
};

export function Middlewares(cbs: readonly (keyof RegisteredMiddlewares)[]) {
	return <T extends { new (...args: any[]): {} }>(target: T) =>
		class extends target {
			middlewares = cbs;
		};
}

export function Declare(declare: DeclareOptions) {
	return <T extends { new (...args: any[]): {} }>(target: T) =>
		class extends target {
			name = declare.name;
			nsfw = declare.nsfw;
			contexts = declare.contexts?.map(i => InteractionContextTypes[i]);
			integrationTypes = declare.integrationTypes?.map(i => IntegrationTypes[i]);
			defaultMemberPermissions = Array.isArray(declare.defaultMemberPermissions)
				? declare.defaultMemberPermissions?.reduce((acc, prev) => acc | PermissionFlagsBits[prev], BigInt(0))
				: declare.defaultMemberPermissions;
			botPermissions = Array.isArray(declare.botPermissions)
				? declare.botPermissions?.reduce((acc, prev) => acc | PermissionFlagsBits[prev], BigInt(0))
				: declare.botPermissions;
			description = '';
			type: ApplicationCommandType = ApplicationCommandType.ChatInput;
			guildId?: string[];
			ignore?: IgnoreCommand;
			constructor(...args: any[]) {
				super(...args);
				if ('description' in declare) this.description = declare.description;
				if ('type' in declare) this.type = declare.type;
				if ('guildId' in declare) this.guildId = declare.guildId;
				if ('ignore' in declare) this.ignore = declare.ignore;
				// check if all properties are valid
			}
		};
}
