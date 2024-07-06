import {
	type APIApplicationCommandOption,
	Locale,
	type LocaleString,
	ApplicationCommandOptionType,
	type APIApplicationCommandIntegerOption,
	type APIApplicationCommandStringOption,
	type APIApplicationCommandSubcommandOption,
	type APIApplicationCommandSubcommandGroupOption,
	type APIApplicationCommandChannelOption,
	type LocalizationMap,
} from 'discord-api-types/v10';
import { basename, dirname } from 'node:path';
import type { Logger, MakeRequired, NulleableCoalising, OmitInsert } from '../common';
import { BaseHandler } from '../common';
import { Command, type CommandOption, SubCommand } from './applications/chat';
import { ContextMenuCommand } from './applications/menu';
import type { UsingClient } from './applications/shared';
import { promises } from 'node:fs';

export class CommandHandler extends BaseHandler {
	values: (Command | ContextMenuCommand)[] = [];

	protected filter = (path: string) => path.endsWith('.js') || (!path.endsWith('.d.ts') && path.endsWith('.ts'));

	constructor(
		protected logger: Logger,
		protected client: UsingClient,
	) {
		super(logger);
	}

	async reload(resolve: string | Command) {
		if (typeof resolve === 'string') {
			return this.values.find(x => x.name === resolve)?.reload();
		}
		return resolve.reload();
	}

	async reloadAll(stopIfFail = true) {
		for (const command of this.values) {
			try {
				await this.reload(command.name);
			} catch (e) {
				if (stopIfFail) {
					throw e;
				}
			}
		}
	}

	protected shouldUploadLocales(locales?: LocalizationMap | null, cachedLocales?: LocalizationMap | null) {
		if (!locales && !cachedLocales) return false;
		if (!locales && cachedLocales) return true;
		if (locales && !cachedLocales) return true;
		if (locales && cachedLocales) {
			const localesEntries = Object.entries(locales);
			const cachedLocalesEntries = Object.entries(cachedLocales);
			if (localesEntries.length !== cachedLocalesEntries.length) return true;

			for (const [key, value] of localesEntries) {
				const cached = cachedLocalesEntries.find(x => x[0] === key);
				if (!cached) return true;
				if (value !== cached[1]) return true;
			}
		}
		return false;
	}

	protected shouldUploadOption(option: APIApplicationCommandOption, cached: APIApplicationCommandOption) {
		if (option.description !== cached.description) return true;
		if (option.type !== cached.type) return true;
		if (option.required !== cached.required) return true;
		if (option.name !== cached.name) return true;
		//TODO: locales

		if (this.shouldUploadLocales(option.name_localizations, cached.name_localizations)) return true;
		if (this.shouldUploadLocales(option.description_localizations, cached.description_localizations)) return true;

		switch (option.type) {
			case ApplicationCommandOptionType.String:
				return (
					option.min_length !== (cached as APIApplicationCommandStringOption).min_length ||
					option.max_length !== (cached as APIApplicationCommandStringOption).max_length
				);
			case ApplicationCommandOptionType.Channel:
				{
					if (option.channel_types?.length !== (cached as APIApplicationCommandChannelOption).channel_types?.length)
						return true;
					if ('channel_types' in option && 'channel_types' in cached) {
						if (!(option.channel_types && cached.channel_types)) return true;
						return option.channel_types.some(ct => !cached.channel_types!.includes(ct));
					}
				}
				return;
			case ApplicationCommandOptionType.Subcommand:
			case ApplicationCommandOptionType.SubcommandGroup:
				if (
					option.options?.length !==
					(cached as APIApplicationCommandSubcommandOption | APIApplicationCommandSubcommandGroupOption).options?.length
				) {
					return true;
				}
				if (
					option.options &&
					(cached as APIApplicationCommandSubcommandOption | APIApplicationCommandSubcommandGroupOption).options
				)
					for (const i of option.options) {
						const cachedOption = (
							cached as APIApplicationCommandSubcommandOption | APIApplicationCommandSubcommandGroupOption
						).options!.find(x => x.name === i.name);
						if (!cachedOption) return true;
						if (this.shouldUploadOption(i, cachedOption)) return true;
					}
				break;
			case ApplicationCommandOptionType.Integer:
			case ApplicationCommandOptionType.Number:
				return (
					option.min_value !== (cached as APIApplicationCommandIntegerOption).min_value ||
					option.max_value !== (cached as APIApplicationCommandIntegerOption).max_value
				);
			case ApplicationCommandOptionType.Attachment:
			case ApplicationCommandOptionType.Boolean:
			case ApplicationCommandOptionType.Mentionable:
			case ApplicationCommandOptionType.Role:
			case ApplicationCommandOptionType.User:
				break;
		}

		return false;
	}

	async shouldUpload(file: string, guildId?: string) {
		const values = this.values.filter(x => {
			if (!guildId) return !x.guildId;
			return x.guildId?.includes(guildId);
		});
		if (
			!(await promises.access(file).then(
				() => true,
				() => false,
			))
		) {
			await promises.writeFile(file, JSON.stringify(values.map(x => x.toJSON())));
			return true;
		}

		const cachedCommands = (
			JSON.parse((await promises.readFile(file)).toString()) as (
				| ReturnType<Command['toJSON']>
				| ReturnType<ContextMenuCommand['toJSON']>
			)[]
		).filter(x => {
			if (!guildId) return !x.guild_id;
			return x.guild_id?.includes(guildId);
		});

		if (cachedCommands.length !== values.length) return true;

		for (const command of values.map(x => x.toJSON())) {
			const cached = cachedCommands.find(x => {
				if (x.name !== command.name) return false;
				if (command.guild_id) return command.guild_id.every(id => x.guild_id?.includes(id));
				return true;
			});
			if (!cached) return true;
			if (cached.description !== command.description) return true;
			if (cached.default_member_permissions !== command.default_member_permissions) return true;
			if (cached.type !== command.type) return true;
			if (cached.nsfw !== command.nsfw) return true;

			if (!!('options' in cached) !== !!('options' in command)) return true;
			if (!!cached.contexts !== !!command.contexts) return true;
			if (!!cached.integration_types !== !!command.integration_types) return true;
			if (this.shouldUploadLocales(command.name_localizations, cached.name_localizations)) return true;
			if (this.shouldUploadLocales(command.description_localizations, cached.description_localizations)) return true;

			if ('contexts' in command && 'contexts' in cached) {
				if (command.contexts.length !== cached.contexts.length) return true;
				if (command.contexts && cached.contexts) {
					if (command.contexts.some(ctx => !cached.contexts!.includes(ctx))) return true;
				}
			}

			if ('integration_types' in command && 'integration_types' in cached) {
				if (command.integration_types.length !== cached.integration_types.length) return true;
				if (command.integration_types && cached.integration_types) {
					if (command.integration_types.some(ctx => !cached.integration_types!.includes(ctx))) return true;
				}
			}

			if ('options' in command && 'options' in cached) {
				if (command.options.length !== cached.options.length) return true;
				for (const option of command.options) {
					const cachedOption = cached.options.find(x => x.name === option.name);
					if (!cachedOption) return true;
					if (this.shouldUploadOption(option, cachedOption)) return true;
				}
			}
		}

		return false;
	}

	async load(commandsDir: string, client: UsingClient) {
		const result = await this.loadFilesK<FileLoaded<null>>(await this.getFiles(commandsDir));
		this.values = [];

		for (const { commands, file } of result.map(x => ({ commands: this.onFile(x.file), file: x }))) {
			if (!commands) continue;
			for (const command of commands) {
				let commandInstance;
				try {
					commandInstance = this.onCommand(command);
					if (!commandInstance) continue;
				} catch (e) {
					if (e instanceof Error && e.message.includes('is not a constructor')) {
						this.logger.warn(
							`${file.path
								.split(process.cwd())
								.slice(1)
								.join(process.cwd())} doesn't export the class by \`export default <Command>\``,
						);
					} else this.logger.warn(e, command);
					continue;
				}
				if (commandInstance instanceof SubCommand) continue;

				commandInstance.__filePath = file.path;
				commandInstance.props ??= client.options.commands?.defaults?.props ?? {};
				const isAvailableCommand = this.stablishCommandDefaults(commandInstance);
				if (isAvailableCommand) {
					commandInstance = isAvailableCommand;
					if (commandInstance.__autoload) {
						//@AutoLoad
						const options = await this.getFiles(dirname(file.path));
						for (const option of options) {
							if (file.name === basename(option)) {
								continue;
							}
							try {
								const fileSubCommands = this.onFile(result.find(x => x.path === option)!.file);
								if (!fileSubCommands) {
									this.logger.warn(`SubCommand returned (${fileSubCommands}) ignoring.`);
									continue;
								}
								for (const fileSubCommand of fileSubCommands) {
									const subCommand = this.onSubCommand(fileSubCommand as HandleableSubCommand);
									if (subCommand && subCommand instanceof SubCommand) {
										subCommand.__filePath = option;
										commandInstance.options.push(subCommand);
									} else {
										this.logger.warn(subCommand ? 'SubCommand expected' : 'Invalid SubCommand', subCommand);
									}
								}
							} catch {
								//pass
							}
						}
					}
					for (const option of commandInstance.options ?? []) {
						if (option instanceof SubCommand) this.stablishSubCommandDefaults(commandInstance, option);
					}
				}
				this.stablishContextCommandDefaults(commandInstance);
				this.values.push(commandInstance);
				this.parseLocales(commandInstance);
			}
		}

		return this.values;
	}

	parseLocales(command: Command | SubCommand | ContextMenuCommand) {
		this.parseGlobalLocales(command);
		if (command instanceof ContextMenuCommand) {
			this.parseContextMenuLocales(command);
			return command;
		}

		if (command instanceof Command && command.__tGroups) {
			this.parseCommandLocales(command);
			for (const option of command.options ?? []) {
				if (option instanceof SubCommand) {
					this.parseSubCommandLocales(option);
					continue;
				}
				// @ts-expect-error
				if (option.locales) this.parseCommandOptionLocales(option);
			}
		}
		if (command instanceof SubCommand) {
			this.parseSubCommandLocales(command);
		}
		return command;
	}

	parseGlobalLocales(command: Command | SubCommand | ContextMenuCommand) {
		if (command.__t) {
			command.name_localizations = {};
			command.description_localizations = {};
			for (const locale of Object.keys(this.client.langs!.values)) {
				const locales = this.client.langs!.aliases.find(x => x[0] === locale)?.[1] ?? [];
				if (Object.values<string>(Locale).includes(locale)) locales.push(locale as LocaleString);

				if (command.__t.name) {
					for (const i of locales) {
						const valueName = this.client.langs!.getKey(locale, command.__t.name!);
						if (valueName) command.name_localizations[i] = valueName;
					}
				}

				if (command.__t.description) {
					for (const i of locales) {
						const valueKey = this.client.langs!.getKey(locale, command.__t.description!);
						if (valueKey) command.description_localizations[i] = valueKey;
					}
				}
			}
		}
	}

	parseCommandOptionLocales(option: MakeRequired<CommandOption, 'locales'>) {
		option.name_localizations = {};
		option.description_localizations = {};
		for (const locale of Object.keys(this.client.langs!.values)) {
			const locales = this.client.langs!.aliases.find(x => x[0] === locale)?.[1] ?? [];
			if (Object.values<string>(Locale).includes(locale)) locales.push(locale as LocaleString);

			if (option.locales.name) {
				for (const i of locales) {
					const valueName = this.client.langs!.getKey(locale, option.locales.name!);
					if (valueName) option.name_localizations[i] = valueName;
				}
			}

			if (option.locales.description) {
				for (const i of locales) {
					const valueKey = this.client.langs!.getKey(locale, option.locales.description!);
					if (valueKey) option.description_localizations[i] = valueKey;
				}
			}
		}
	}

	parseCommandLocales(command: Command) {
		command.groups = {};
		for (const locale of Object.keys(this.client.langs!.values)) {
			const locales = this.client.langs!.aliases.find(x => x[0] === locale)?.[1] ?? [];
			if (Object.values<string>(Locale).includes(locale)) locales.push(locale as LocaleString);
			for (const group in command.__tGroups) {
				command.groups[group] ??= {
					defaultDescription: command.__tGroups[group].defaultDescription,
					description: [],
					name: [],
				};

				if (command.__tGroups[group].name) {
					for (const i of locales) {
						const valueName = this.client.langs!.getKey(locale, command.__tGroups[group].name!);
						if (valueName) {
							command.groups[group].name!.push([i, valueName]);
						}
					}
				}

				if (command.__tGroups[group].description) {
					for (const i of locales) {
						const valueKey = this.client.langs!.getKey(locale, command.__tGroups[group].description!);
						if (valueKey) {
							command.groups[group].description!.push([i, valueKey]);
						}
					}
				}
			}
		}
	}

	parseContextMenuLocales(command: ContextMenuCommand) {
		return command;
	}

	parseSubCommandLocales(command: SubCommand) {
		for (const i of command.options ?? []) {
			// @ts-expect-error
			if (i.locales) this.parseCommandOptionLocales(i);
		}
		return command;
	}

	stablishContextCommandDefaults(commandInstance: InstanceType<HandleableCommand>): ContextMenuCommand | false {
		if (!(commandInstance instanceof ContextMenuCommand)) return false;
		commandInstance.onAfterRun ??= this.client.options.commands?.defaults?.onAfterRun;
		//@ts-expect-error magic.
		commandInstance.onBotPermissionsFail ??= this.client.options.commands?.defaults?.onBotPermissionsFail;
		//@ts-expect-error magic.
		commandInstance.onInternalError ??= this.client.options.commands?.defaults?.onInternalError;
		//@ts-expect-error magic.
		commandInstance.onMiddlewaresError ??= this.client.options.commands?.defaults?.onMiddlewaresError;
		//@ts-expect-error magic.
		commandInstance.onPermissionsFail ??= this.client.options.commands?.defaults?.onPermissionsFail;
		//@ts-expect-error magic.
		commandInstance.onRunError ??= this.client.options.commands?.defaults?.onRunError;
		return commandInstance;
	}

	stablishCommandDefaults(
		commandInstance: InstanceType<HandleableCommand>,
	): OmitInsert<Command, 'options', { options: NonNullable<Command['options']> }> | false {
		if (!(commandInstance instanceof Command)) return false;
		commandInstance.onAfterRun ??= this.client.options.commands?.defaults?.onAfterRun;
		commandInstance.onBotPermissionsFail ??= this.client.options.commands?.defaults?.onBotPermissionsFail;
		commandInstance.onInternalError ??= this.client.options.commands?.defaults?.onInternalError;
		commandInstance.onMiddlewaresError ??= this.client.options.commands?.defaults?.onMiddlewaresError;
		commandInstance.onOptionsError ??= this.client.options.commands?.defaults?.onOptionsError;
		commandInstance.onPermissionsFail ??= this.client.options.commands?.defaults?.onPermissionsFail;
		commandInstance.onRunError ??= this.client.options.commands?.defaults?.onRunError;
		commandInstance.options ??= [];
		return commandInstance as any;
	}

	stablishSubCommandDefaults(commandInstance: Command, option: SubCommand): SubCommand {
		option.middlewares = (commandInstance.middlewares ?? []).concat(option.middlewares ?? []);
		option.onMiddlewaresError =
			option.onMiddlewaresError?.bind(option) ??
			commandInstance.onMiddlewaresError?.bind(commandInstance) ??
			this.client.options.commands?.defaults?.onMiddlewaresError;
		option.onRunError =
			option.onRunError?.bind(option) ??
			commandInstance.onRunError?.bind(commandInstance) ??
			this.client.options.commands?.defaults?.onRunError;
		option.onOptionsError =
			option.onOptionsError?.bind(option) ??
			commandInstance.onOptionsError?.bind(commandInstance) ??
			this.client.options.commands?.defaults?.onOptionsError;
		option.onInternalError =
			option.onInternalError?.bind(option) ??
			commandInstance.onInternalError?.bind(commandInstance) ??
			this.client.options.commands?.defaults?.onInternalError;
		option.onAfterRun =
			option.onAfterRun?.bind(option) ??
			commandInstance.onAfterRun?.bind(commandInstance) ??
			this.client.options.commands?.defaults?.onAfterRun;
		option.onBotPermissionsFail =
			option.onBotPermissionsFail?.bind(option) ??
			commandInstance.onBotPermissionsFail?.bind(commandInstance) ??
			this.client.options.commands?.defaults?.onBotPermissionsFail;
		option.onPermissionsFail =
			option.onPermissionsFail?.bind(option) ??
			commandInstance.onPermissionsFail?.bind(commandInstance) ??
			this.client.options.commands?.defaults?.onPermissionsFail;
		option.botPermissions ??= commandInstance.botPermissions;
		option.defaultMemberPermissions ??= commandInstance.defaultMemberPermissions;
		option.contexts ??= commandInstance.contexts;
		option.integrationTypes ??= commandInstance.integrationTypes;
		option.props ??= commandInstance.props;
		return option;
	}

	onFile(file: FileLoaded): HandleableCommand[] | undefined {
		return file.default ? [file.default] : undefined;
	}

	onCommand(file: HandleableCommand): Command | SubCommand | ContextMenuCommand | false {
		return new file();
	}

	onSubCommand(file: HandleableSubCommand): SubCommand | false {
		return new file();
	}
}

export type FileLoaded<T = null> = {
	default?: NulleableCoalising<T, HandleableCommand>;
} & Record<string, NulleableCoalising<T, HandleableCommand>>;

export type HandleableCommand = new () => Command | SubCommand | ContextMenuCommand;
export type HandleableSubCommand = new () => SubCommand;
