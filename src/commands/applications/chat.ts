import { inspect } from 'node:util';
import type {
	ComponentContext,
	EntryPointContext,
	MenuCommandContext,
	ModalContext,
	PermissionStrings,
	SeyfertBaseChoiceableOption,
	SeyfertBasicOption,
	SeyfertChoice,
} from '../..';
import type { Attachment } from '../../builders';
import type {
	GuildRoleStructure,
	InteractionGuildMemberStructure,
	OptionResolverStructure,
	UserStructure,
} from '../../client/transformers';
import { magicImport } from '../../common';
import type { AllChannels, AutocompleteInteraction } from '../../structures';
import {
	type APIApplicationCommandBasicOption,
	type APIApplicationCommandOption,
	type APIApplicationCommandSubcommandGroupOption,
	ApplicationCommandOptionType,
	ApplicationCommandType,
	type ApplicationIntegrationType,
	type InteractionContextType,
	type LocaleString,
} from '../../types';
import type { Groups, RegisteredMiddlewares } from '../decorators';
import type { CommandContext } from './chatcontext';
import type {
	ExtraProps,
	IgnoreCommand,
	OnOptionsReturnObject,
	PassFunction,
	SeyfertChannelMap,
	StopFunction,
	UsingClient,
} from './shared';

export interface ReturnOptionsTypes {
	1: never; // subcommand
	2: never; // subcommandgroup
	3: string;
	4: number; // integer
	5: boolean;
	6: InteractionGuildMemberStructure | UserStructure;
	7: AllChannels;
	8: GuildRoleStructure;
	9: GuildRoleStructure | AllChannels | UserStructure;
	10: number; // number
	11: Attachment;
}

export type AutocompleteCallback = (interaction: AutocompleteInteraction) => any;
export type OnAutocompleteErrorCallback = (interaction: AutocompleteInteraction, error: unknown) => any;
export type CommandBaseOption =
	| SeyfertBaseChoiceableOption<ApplicationCommandOptionType>
	| SeyfertBasicOption<ApplicationCommandOptionType>;
export type CommandBaseAutocompleteOption = (
	| SeyfertBasicOption<ApplicationCommandOptionType>
	| SeyfertBaseChoiceableOption<ApplicationCommandOptionType>
) & {
	autocomplete: AutocompleteCallback;
	onAutocompleteError?: OnAutocompleteErrorCallback;
};
export type CommandAutocompleteOption = CommandBaseAutocompleteOption & { name: string };
export type CommandOptionWithoutName = CommandBaseOption;
export type CommandOption = CommandOptionWithoutName & { name: string };
export type OptionsRecord = Record<string, CommandOptionWithoutName & { type: ApplicationCommandOptionType }>;

type KeysWithoutRequired<T extends OptionsRecord> = {
	[K in keyof T]-?: NonNullable<T[K]['required']> extends true ? never : K;
}[keyof T];

type ContextOptionsAuxInternal<
	T extends CommandBaseOption & {
		type: ApplicationCommandOptionType;
	},
> = T['value'] extends (...args: any) => any
	? Parameters<Parameters<T['value']>[1]>[0]
	: NonNullable<T['value']> extends (...args: any) => any
		? Parameters<Parameters<NonNullable<T['value']>>[1]>[0] extends never
			? T extends { channel_types?: infer C }
				? C extends any[]
					? C[number] extends keyof SeyfertChannelMap
						? SeyfertChannelMap[C[number]]
						: never
					: never
				: T extends { choices?: infer C }
					? C extends SeyfertChoice<string>[]
						? C[number]['value']
						: never
					: never
			: Parameters<Parameters<NonNullable<T['value']>>[1]>[0]
		: ReturnOptionsTypes[T['type']];

type ContextOptionsAux<T extends OptionsRecord> = {
	[K in Exclude<keyof T, KeysWithoutRequired<T>>]: ContextOptionsAuxInternal<T[K]>;
} & {
	[K in KeysWithoutRequired<T>]?: ContextOptionsAuxInternal<T[K]>;
};

export type ContextOptions<T extends OptionsRecord> = ContextOptionsAux<T>;

export class BaseCommand {
	middlewares: (keyof RegisteredMiddlewares)[] = [];

	__filePath?: string;
	__t?: { name: string | undefined; description: string | undefined };
	__autoload?: true;

	guildId?: string[];
	name!: string;
	type!: number; // ApplicationCommandType.ChatInput | ApplicationCommandOptionType.Subcommand
	nsfw?: boolean;
	description!: string;
	defaultMemberPermissions?: bigint;
	integrationTypes: ApplicationIntegrationType[] = [];
	contexts: InteractionContextType[] = [];
	botPermissions?: bigint;
	name_localizations?: Partial<Record<LocaleString, string>>;
	description_localizations?: Partial<Record<LocaleString, string>>;

	options?: CommandOption[] | SubCommand[];

	ignore?: IgnoreCommand;

	aliases?: string[];

	props: ExtraProps = {};

	/** @internal */
	async __runOptions(
		ctx: CommandContext<{}, never>,
		resolver: OptionResolverStructure,
	): Promise<[boolean, OnOptionsReturnObject]> {
		if (!this?.options?.length) {
			return [false, {}];
		}
		const data: OnOptionsReturnObject = {};
		let errored = false;
		for (const i of this.options ?? []) {
			try {
				const option = this.options!.find(x => x.name === i.name) as CommandOptionWithoutName;
				const value =
					resolver.getHoisted(i.name)?.value !== undefined
						? await new Promise(async (res, rej) => {
								try {
									(await option.value?.({ context: ctx, value: resolver.getValue(i.name) } as never, res, rej)) ||
										res(resolver.getValue(i.name));
								} catch (e) {
									rej(e);
								}
							})
						: undefined;
				if (value === undefined) {
					if (option.required) {
						errored = true;
						data[i.name] = {
							failed: true,
							value: `${i.name} is required but returned no value`,
							parseError: undefined,
						};
						continue;
					}
				}
				// @ts-expect-error
				ctx.options[i.name] = value;
				data[i.name] = {
					failed: false,
					value,
				};
			} catch (e) {
				errored = true;
				data[i.name] = {
					failed: true,
					value: e instanceof Error ? e.message : typeof e === 'string' ? e : inspect(e),
					parseError: undefined,
				};
			}
		}
		return [errored, data];
	}

	/** @internal */
	static __runMiddlewares(
		context: CommandContext<{}, never> | ComponentContext | MenuCommandContext<any> | ModalContext | EntryPointContext,
		middlewares: (keyof RegisteredMiddlewares)[],
		global: boolean,
	): Promise<{ error?: string; pass?: boolean }> {
		if (!middlewares.length) {
			return Promise.resolve({});
		}
		let index = 0;

		return new Promise(res => {
			let running = true;
			const pass: PassFunction = () => {
				if (!running) {
					return;
				}
				running = false;
				return res({ pass: true });
			};
			function next(...args: unknown[]) {
				if (!running) {
					return;
				}
				if (args.length) {
					context[global ? 'globalMetadata' : 'metadata'][middlewares[index]] = args[0] as never;
				}
				if (++index >= middlewares.length) {
					running = false;
					return res({});
				}
				context.client.middlewares![middlewares[index]]({ context, next, stop, pass });
			}
			const stop: StopFunction = err => {
				if (!running) {
					return;
				}
				running = false;
				return res({ error: err });
			};
			context.client.middlewares![middlewares[0]]({ context, next, stop, pass });
		});
	}

	/** @internal */
	__runMiddlewares(context: CommandContext<{}, never>) {
		return BaseCommand.__runMiddlewares(context, this.middlewares as (keyof RegisteredMiddlewares)[], false);
	}

	/** @internal */
	__runGlobalMiddlewares(context: CommandContext<{}, never>) {
		return BaseCommand.__runMiddlewares(
			context,
			(context.client.options?.globalMiddlewares ?? []) as (keyof RegisteredMiddlewares)[],
			true,
		);
	}

	toJSON() {
		const data = {
			name: this.name,
			type: this.type,
			nsfw: !!this.nsfw,
			description: this.description,
			name_localizations: this.name_localizations,
			description_localizations: this.description_localizations,
			guild_id: this.guildId,
			default_member_permissions: this.defaultMemberPermissions ? this.defaultMemberPermissions.toString() : undefined,
			contexts: this.contexts,
			integration_types: this.integrationTypes,
		} as {
			name: BaseCommand['name'];
			type: BaseCommand['type'];
			nsfw: BaseCommand['nsfw'];
			description: BaseCommand['description'];
			name_localizations: BaseCommand['name_localizations'];
			description_localizations: BaseCommand['description_localizations'];
			guild_id: BaseCommand['guildId'];
			default_member_permissions: string;
			contexts: BaseCommand['contexts'];
			integration_types: BaseCommand['integrationTypes'];
		};
		return data;
	}

	async reload() {
		delete require.cache[this.__filePath!];

		for (const i of this.options ?? []) {
			if (i instanceof SubCommand && i.__filePath) {
				await i.reload();
			}
		}

		const __tempCommand = await magicImport(this.__filePath!).then(x => x.default ?? x);

		Object.setPrototypeOf(this, __tempCommand.prototype);
	}

	run?(context: CommandContext): any;
	onAfterRun?(context: CommandContext, error: unknown | undefined): any;
	onRunError?(context: CommandContext, error: unknown): any;
	onOptionsError?(context: CommandContext, metadata: OnOptionsReturnObject): any;
	onMiddlewaresError?(context: CommandContext, error: string): any;
	onBotPermissionsFail?(context: CommandContext, permissions: PermissionStrings): any;
	onPermissionsFail?(context: CommandContext, permissions: PermissionStrings): any;
	onInternalError?(client: UsingClient, command: Command | SubCommand, error?: unknown): any;
}

export class Command extends BaseCommand {
	type = ApplicationCommandType.ChatInput;

	groups?: Parameters<typeof Groups>[0];
	groupsAliases?: Record<string, string>;
	__tGroups?: Record<
		string /* name for group*/,
		{
			name: string | undefined;
			description: string | undefined;
			defaultDescription: string;
		}
	>;

	toJSON() {
		const options: APIApplicationCommandOption[] = [];

		for (const i of this.options ?? []) {
			if (!(i instanceof SubCommand)) {
				options.push({ ...i, autocomplete: 'autocomplete' in i } as APIApplicationCommandBasicOption);
				continue;
			}
			if (i.group) {
				if (!options.find(x => x.name === i.group)) {
					options.push({
						type: ApplicationCommandOptionType.SubcommandGroup,
						name: i.group,
						description: this.groups![i.group].defaultDescription,
						description_localizations: Object.fromEntries(this.groups?.[i.group].description ?? []),
						name_localizations: Object.fromEntries(this.groups?.[i.group].name ?? []),
						options: [],
					});
				}
				const group = options.find(x => x.name === i.group) as APIApplicationCommandSubcommandGroupOption;
				group.options?.push(i.toJSON());
				continue;
			}
			options.push(i.toJSON());
		}

		return {
			...super.toJSON(),
			options,
		};
	}
}

export abstract class SubCommand extends BaseCommand {
	type = ApplicationCommandOptionType.Subcommand;
	group?: string;
	declare options?: CommandOption[];

	toJSON() {
		return {
			...super.toJSON(),
			options:
				this.options?.map(x => ({ ...x, autocomplete: 'autocomplete' in x }) as APIApplicationCommandBasicOption) ?? [],
		};
	}

	abstract run(context: CommandContext): any;
}
