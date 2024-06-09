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
} from 'discord-api-types/v10';
import { basename, dirname } from 'node:path';
import type { Logger } from '../common';
import { BaseHandler } from '../common';
import { Command, SubCommand } from './applications/chat';
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

	protected shouldUploadOption(option: APIApplicationCommandOption, cached: APIApplicationCommandOption) {
		if (option.description !== cached.description) return true;
		if (option.type !== cached.type) return true;
		if (option.required !== cached.required) return true;
		if (option.name !== cached.name) return true;
		//TODO: locales

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

	async shouldUpload(file: string) {
		if (
			!(await promises.access(file).then(
				() => true,
				() => false,
			))
		) {
			await promises.writeFile(file, JSON.stringify(this.values.map(x => x.toJSON())));
			return true;
		}

		const cachedCommands: (ReturnType<Command['toJSON']> | ReturnType<ContextMenuCommand['toJSON']>)[] = JSON.parse(
			(await promises.readFile(file)).toString(),
		);

		if (cachedCommands.length !== this.values.length) return true;

		for (const command of this.values.map(x => x.toJSON())) {
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
			//TODO: locales

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

	async load(commandsDir: string, client: UsingClient, instances?: { new (): Command | ContextMenuCommand }[]) {
		const result =
			instances?.map(x => {
				const i = new x();
				return { name: i.name, file: x, path: i.__filePath ?? '*' };
			}) ??
			(
				await this.loadFilesK<{ new (): Command | SubCommand | ContextMenuCommand }>(await this.getFiles(commandsDir))
			).filter(x => x.file);
		this.values = [];

		for (const command of result) {
			let commandInstance;
			try {
				commandInstance = this.onCommand(command.file);
				if (!commandInstance) continue;
			} catch (e) {
				if (e instanceof Error && e.message.includes('is not a constructor')) {
					this.logger.warn(
						`${command.path
							.split(process.cwd())
							.slice(1)
							.join(process.cwd())} doesn't export the class by \`export default <Command>\``,
					);
				} else this.logger.warn(e, command);
				continue;
			}
			if (commandInstance instanceof ContextMenuCommand) {
				this.values.push(commandInstance);
				commandInstance.__filePath = command.path;
				this.__parseCommandLocales(commandInstance);
				commandInstance.props ??= client.options.commands?.defaults?.props ?? {};
				continue;
			}
			if (!(commandInstance instanceof Command)) {
				continue;
			}
			commandInstance.onAfterRun ??= client.options.commands?.defaults?.onAfterRun;
			commandInstance.onBotPermissionsFail ??= client.options.commands?.defaults?.onBotPermissionsFail;
			commandInstance.onInternalError ??= client.options.commands?.defaults?.onInternalError;
			commandInstance.onMiddlewaresError ??= client.options.commands?.defaults?.onMiddlewaresError;
			commandInstance.onOptionsError ??= client.options.commands?.defaults?.onOptionsError;
			commandInstance.onPermissionsFail ??= client.options.commands?.defaults?.onPermissionsFail;
			commandInstance.onRunError ??= client.options.commands?.defaults?.onRunError;
			commandInstance.__filePath = command.path;
			commandInstance.options ??= [] as NonNullable<Command['options']>;
			commandInstance.props ??= client.options.commands?.defaults?.props ?? {};
			if (commandInstance.__autoload) {
				//@AutoLoad
				const options = await this.getFiles(dirname(command.path));
				for (const option of options) {
					if (command.name === basename(option)) {
						continue;
					}
					try {
						const subCommand = this.onSubCommand(result.find(x => x.path === option)!.file as { new (): SubCommand });
						if (subCommand && subCommand instanceof SubCommand) {
							subCommand.__filePath = option;
							commandInstance.options.push(subCommand);
						}
					} catch {
						//pass
					}
				}
			}

			for (const option of commandInstance.options ?? []) {
				if (option instanceof SubCommand) {
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
				}
			}

			this.values.push(commandInstance);
			this.__parseCommandLocales(commandInstance);

			for (const i of commandInstance.options ?? []) {
				if (i instanceof SubCommand) {
					this.__parseCommandLocales(i);
				}
			}
		}

		return this.values;
	}

	private __parseCommandLocales(command: Command | SubCommand | ContextMenuCommand) {
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

		if (command instanceof ContextMenuCommand) return;

		for (const options of command.options ?? []) {
			if (options instanceof SubCommand || !options.locales) continue;
			options.name_localizations = {};
			options.description_localizations = {};
			for (const locale of Object.keys(this.client.langs!.values)) {
				const locales = this.client.langs!.aliases.find(x => x[0] === locale)?.[1] ?? [];
				if (Object.values<string>(Locale).includes(locale)) locales.push(locale as LocaleString);

				if (options.locales.name) {
					for (const i of locales) {
						const valueName = this.client.langs!.getKey(locale, options.locales.name!);
						if (valueName) options.name_localizations[i] = valueName;
					}
				}

				if (options.locales.description) {
					for (const i of locales) {
						const valueKey = this.client.langs!.getKey(locale, options.locales.description!);
						if (valueKey) options.description_localizations[i] = valueKey;
					}
				}
			}
		}

		if (command instanceof Command && command.__tGroups) {
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
	}

	setHandlers({
		onCommand,
		onSubCommand,
	}: {
		onCommand?: CommandHandler['onCommand'];
		onSubCommand?: CommandHandler['onSubCommand'];
	}) {
		if (onCommand) this.onCommand = onCommand;
		if (onSubCommand) this.onSubCommand = onSubCommand;
	}

	onCommand = (file: { new (): Command | SubCommand | ContextMenuCommand }):
		| Command
		| SubCommand
		| ContextMenuCommand
		| false => new file();
	onSubCommand = (file: { new (): SubCommand }): SubCommand | false => new file();
}
