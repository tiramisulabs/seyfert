import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	type ApplicationIntegrationType,
	type InteractionContextType,
	type APIApplicationCommandBasicOption,
	type APIApplicationCommandOption,
	type APIApplicationCommandSubcommandGroupOption,
	type LocaleString,
} from 'discord-api-types/v10';
import type {
	ComponentContext,
	MenuCommandContext,
	ModalContext,
	PermissionStrings,
	SeyfertNumberOption,
	SeyfertStringOption,
} from '../..';
import type { Attachment } from '../../builders';
import { type Awaitable, magicImport, type FlatObjectKeys } from '../../common';
import type { AllChannels, AutocompleteInteraction } from '../../structures';
import type { Groups, RegisteredMiddlewares } from '../decorators';
import type { CommandContext } from './chatcontext';
import type {
	DefaultLocale,
	ExtraProps,
	IgnoreCommand,
	OKFunction,
	OnOptionsReturnObject,
	PassFunction,
	StopFunction,
	UsingClient,
} from './shared';
import { inspect } from 'node:util';
import type {
	GuildRoleStructure,
	InteractionGuildMemberStructure,
	OptionResolverStructure,
	UserStructure,
} from '../../client/transformers';

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

type Wrap<N extends ApplicationCommandOptionType> = N extends
	| ApplicationCommandOptionType.Subcommand
	| ApplicationCommandOptionType.SubcommandGroup
	? never
	: {
			required?: boolean;
			value?(
				data: { context: CommandContext; value: ReturnOptionsTypes[N] },
				ok: OKFunction<any>,
				fail: StopFunction,
			): Awaitable<void>;
		} & {
			description: string;
			description_localizations?: APIApplicationCommandBasicOption['description_localizations'];
			name_localizations?: APIApplicationCommandBasicOption['name_localizations'];
			locales?: {
				name?: FlatObjectKeys<DefaultLocale>;
				description?: FlatObjectKeys<DefaultLocale>;
			};
		};

export type __TypeWrapper<T extends ApplicationCommandOptionType> = Wrap<T>;

export type __TypesWrapper = {
	[P in keyof typeof ApplicationCommandOptionType]: `${(typeof ApplicationCommandOptionType)[P]}` extends `${infer D extends
		number}`
		? Wrap<D>
		: never;
};

export type AutocompleteCallback = (interaction: AutocompleteInteraction) => any;
export type OnAutocompleteErrorCallback = (interaction: AutocompleteInteraction, error: unknown) => any;
export type CommandBaseOption = __TypesWrapper[keyof __TypesWrapper];
export type CommandBaseAutocompleteOption = __TypesWrapper[keyof __TypesWrapper] & {
	autocomplete: AutocompleteCallback;
	onAutocompleteError?: OnAutocompleteErrorCallback;
};
export type CommandAutocompleteOption = CommandBaseAutocompleteOption & { name: string };
export type __CommandOption = CommandBaseOption; //| CommandBaseAutocompleteOption;
export type CommandOption = __CommandOption & { name: string };
export type OptionsRecord = Record<string, __CommandOption & { type: ApplicationCommandOptionType }>;

type KeysWithoutRequired<T extends OptionsRecord> = {
	[K in keyof T]-?: T[K]['required'] extends true ? never : K;
}[keyof T];

type ContextOptionsAux<T extends OptionsRecord> = {
	[K in Exclude<keyof T, KeysWithoutRequired<T>>]: T[K]['value'] extends (...args: any) => any
		? Parameters<Parameters<T[K]['value']>[1]>[0]
		: T[K] extends SeyfertStringOption | SeyfertNumberOption
			? T[K]['choices'] extends NonNullable<SeyfertStringOption['choices'] | SeyfertNumberOption['choices']>
				? T[K]['choices'][number]['value']
				: ReturnOptionsTypes[T[K]['type']]
			: ReturnOptionsTypes[T[K]['type']];
} & {
	[K in KeysWithoutRequired<T>]?: T[K]['value'] extends (...args: any) => any
		? Parameters<Parameters<T[K]['value']>[1]>[0]
		: T[K] extends SeyfertStringOption | SeyfertNumberOption
			? T[K]['choices'] extends NonNullable<SeyfertStringOption['choices'] | SeyfertNumberOption['choices']>
				? T[K]['choices'][number]['value']
				: ReturnOptionsTypes[T[K]['type']]
			: ReturnOptionsTypes[T[K]['type']];
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
				const option = this.options!.find(x => x.name === i.name) as __CommandOption;
				const value =
					resolver.getHoisted(i.name)?.value !== undefined
						? await new Promise(
								// biome-ignore lint/suspicious/noAsyncPromiseExecutor: yes
								async (res, rej) => {
									try {
										(await option.value?.({ context: ctx, value: resolver.getValue(i.name) } as never, res, rej)) ||
											res(resolver.getValue(i.name));
									} catch (e) {
										rej(e);
									}
								},
							)
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
		context: CommandContext<{}, never> | ComponentContext | MenuCommandContext<any> | ModalContext,
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
			function next(obj: any) {
				if (!running) {
					return;
				}
				// biome-ignore lint/style/noArguments: yes
				// biome-ignore lint/correctness/noUndeclaredVariables: xd
				if (arguments.length) {
					// @ts-expect-error
					context[global ? 'globalMetadata' : 'metadata'][middlewares[index]] = obj;
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

	abstract run(context: CommandContext<any>): any;
}
