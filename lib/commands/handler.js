"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandHandler = void 0;
const v10_1 = require("discord-api-types/v10");
const node_path_1 = require("node:path");
const common_1 = require("../common");
const chat_1 = require("./applications/chat");
const menu_1 = require("./applications/menu");
const node_fs_1 = require("node:fs");
class CommandHandler extends common_1.BaseHandler {
    logger;
    client;
    values = [];
    filter = (path) => path.endsWith('.js') || (!path.endsWith('.d.ts') && path.endsWith('.ts'));
    constructor(logger, client) {
        super(logger);
        this.logger = logger;
        this.client = client;
    }
    async reload(resolve) {
        if (typeof resolve === 'string') {
            return this.values.find(x => x.name === resolve)?.reload();
        }
        return resolve.reload();
    }
    async reloadAll(stopIfFail = true) {
        for (const command of this.values) {
            try {
                await this.reload(command.name);
            }
            catch (e) {
                if (stopIfFail) {
                    throw e;
                }
            }
        }
    }
    shouldUploadLocales(locales, cachedLocales) {
        if (!locales && !cachedLocales)
            return false;
        if (!locales && cachedLocales)
            return true;
        if (locales && !cachedLocales)
            return true;
        if (locales && cachedLocales) {
            const localesEntries = Object.entries(locales);
            const cachedLocalesEntries = Object.entries(cachedLocales);
            if (localesEntries.length !== cachedLocalesEntries.length)
                return true;
            for (const [key, value] of localesEntries) {
                const cached = cachedLocalesEntries.find(x => x[0] === key);
                if (!cached)
                    return true;
                if (value !== cached[1])
                    return true;
            }
        }
        return false;
    }
    shouldUploadOption(option, cached) {
        if (option.description !== cached.description)
            return true;
        if (option.type !== cached.type)
            return true;
        if (option.required !== cached.required)
            return true;
        if (option.name !== cached.name)
            return true;
        //TODO: locales
        if (this.shouldUploadLocales(option.name_localizations, cached.name_localizations))
            return true;
        if (this.shouldUploadLocales(option.description_localizations, cached.description_localizations))
            return true;
        switch (option.type) {
            case v10_1.ApplicationCommandOptionType.String:
                return (option.min_length !== cached.min_length ||
                    option.max_length !== cached.max_length);
            case v10_1.ApplicationCommandOptionType.Channel:
                {
                    if (option.channel_types?.length !== cached.channel_types?.length)
                        return true;
                    if ('channel_types' in option && 'channel_types' in cached) {
                        if (!(option.channel_types && cached.channel_types))
                            return true;
                        return option.channel_types.some(ct => !cached.channel_types.includes(ct));
                    }
                }
                return;
            case v10_1.ApplicationCommandOptionType.Subcommand:
            case v10_1.ApplicationCommandOptionType.SubcommandGroup:
                if (option.options?.length !==
                    cached.options?.length) {
                    return true;
                }
                if (option.options &&
                    cached.options)
                    for (const i of option.options) {
                        const cachedOption = cached.options.find(x => x.name === i.name);
                        if (!cachedOption)
                            return true;
                        if (this.shouldUploadOption(i, cachedOption))
                            return true;
                    }
                break;
            case v10_1.ApplicationCommandOptionType.Integer:
            case v10_1.ApplicationCommandOptionType.Number:
                return (option.min_value !== cached.min_value ||
                    option.max_value !== cached.max_value);
            case v10_1.ApplicationCommandOptionType.Attachment:
            case v10_1.ApplicationCommandOptionType.Boolean:
            case v10_1.ApplicationCommandOptionType.Mentionable:
            case v10_1.ApplicationCommandOptionType.Role:
            case v10_1.ApplicationCommandOptionType.User:
                break;
        }
        return false;
    }
    async shouldUpload(file, guildId) {
        const values = this.values.filter(x => {
            if (!guildId)
                return !x.guildId;
            return x.guildId?.includes(guildId);
        });
        if (!(await node_fs_1.promises.access(file).then(() => true, () => false))) {
            await node_fs_1.promises.writeFile(file, JSON.stringify(values.map(x => x.toJSON())));
            return true;
        }
        const cachedCommands = JSON.parse((await node_fs_1.promises.readFile(file)).toString()).filter(x => {
            if (!guildId)
                return !x.guild_id;
            return x.guild_id?.includes(guildId);
        });
        if (cachedCommands.length !== values.length)
            return true;
        for (const command of values.map(x => x.toJSON())) {
            const cached = cachedCommands.find(x => {
                if (x.name !== command.name)
                    return false;
                if (command.guild_id)
                    return command.guild_id.every(id => x.guild_id?.includes(id));
                return true;
            });
            if (!cached)
                return true;
            if (cached.description !== command.description)
                return true;
            if (cached.default_member_permissions !== command.default_member_permissions)
                return true;
            if (cached.type !== command.type)
                return true;
            if (cached.nsfw !== command.nsfw)
                return true;
            if (!!('options' in cached) !== !!('options' in command))
                return true;
            if (!!cached.contexts !== !!command.contexts)
                return true;
            if (!!cached.integration_types !== !!command.integration_types)
                return true;
            if (this.shouldUploadLocales(command.name_localizations, cached.name_localizations))
                return true;
            if (this.shouldUploadLocales(command.description_localizations, cached.description_localizations))
                return true;
            if ('contexts' in command && 'contexts' in cached) {
                if (command.contexts.length !== cached.contexts.length)
                    return true;
                if (command.contexts && cached.contexts) {
                    if (command.contexts.some(ctx => !cached.contexts.includes(ctx)))
                        return true;
                }
            }
            if ('integration_types' in command && 'integration_types' in cached) {
                if (command.integration_types.length !== cached.integration_types.length)
                    return true;
                if (command.integration_types && cached.integration_types) {
                    if (command.integration_types.some(ctx => !cached.integration_types.includes(ctx)))
                        return true;
                }
            }
            if ('options' in command && 'options' in cached) {
                if (command.options.length !== cached.options.length)
                    return true;
                for (const option of command.options) {
                    const cachedOption = cached.options.find(x => x.name === option.name);
                    if (!cachedOption)
                        return true;
                    if (this.shouldUploadOption(option, cachedOption))
                        return true;
                }
            }
        }
        return false;
    }
    async load(commandsDir, client) {
        const result = await this.loadFilesK(await this.getFiles(commandsDir));
        this.values = [];
        for (const { commands, file } of result.map(x => ({ commands: this.onFile(x.file), file: x }))) {
            if (!commands)
                continue;
            for (const command of commands) {
                let commandInstance;
                try {
                    commandInstance = this.onCommand(command);
                    if (!commandInstance)
                        continue;
                }
                catch (e) {
                    if (e instanceof Error && e.message.includes('is not a constructor')) {
                        this.logger.warn(`${file.path
                            .split(process.cwd())
                            .slice(1)
                            .join(process.cwd())} doesn't export the class by \`export default <Command>\``);
                    }
                    else
                        this.logger.warn(e, command);
                    continue;
                }
                if (commandInstance instanceof chat_1.SubCommand)
                    continue;
                commandInstance.__filePath = file.path;
                commandInstance.props ??= client.options.commands?.defaults?.props ?? {};
                const isAvailableCommand = this.stablishCommandDefaults(commandInstance);
                if (isAvailableCommand) {
                    commandInstance = isAvailableCommand;
                    if (commandInstance.__autoload) {
                        //@AutoLoad
                        const options = await this.getFiles((0, node_path_1.dirname)(file.path));
                        for (const option of options) {
                            if (file.name === (0, node_path_1.basename)(option)) {
                                continue;
                            }
                            try {
                                const fileSubCommands = this.onFile(result.find(x => x.path === option).file);
                                if (!fileSubCommands) {
                                    this.logger.warn(`SubCommand returned (${fileSubCommands}) ignoring.`);
                                    continue;
                                }
                                for (const fileSubCommand of fileSubCommands) {
                                    const subCommand = this.onSubCommand(fileSubCommand);
                                    if (subCommand && subCommand instanceof chat_1.SubCommand) {
                                        subCommand.__filePath = option;
                                        commandInstance.options.push(subCommand);
                                    }
                                    else {
                                        this.logger.warn(subCommand ? 'SubCommand expected' : 'Invalid SubCommand', subCommand);
                                    }
                                }
                            }
                            catch {
                                //pass
                            }
                        }
                    }
                    for (const option of commandInstance.options ?? []) {
                        if (option instanceof chat_1.SubCommand)
                            this.stablishSubCommandDefaults(commandInstance, option);
                    }
                }
                this.stablishContextCommandDefaults(commandInstance);
                this.values.push(commandInstance);
                this.parseLocales(commandInstance);
            }
        }
        return this.values;
    }
    parseLocales(command) {
        this.parseGlobalLocales(command);
        if (command instanceof menu_1.ContextMenuCommand) {
            this.parseContextMenuLocales(command);
            return command;
        }
        if (command instanceof chat_1.Command && command.__tGroups) {
            this.parseCommandLocales(command);
            for (const option of command.options ?? []) {
                if (option instanceof chat_1.SubCommand) {
                    this.parseSubCommandLocales(option);
                    continue;
                }
                // @ts-expect-error
                if (option.locales)
                    this.parseCommandOptionLocales(option);
            }
        }
        if (command instanceof chat_1.SubCommand) {
            this.parseSubCommandLocales(command);
        }
        return command;
    }
    parseGlobalLocales(command) {
        if (command.__t) {
            command.name_localizations = {};
            command.description_localizations = {};
            for (const locale of Object.keys(this.client.langs.values)) {
                const locales = this.client.langs.aliases.find(x => x[0] === locale)?.[1] ?? [];
                if (Object.values(v10_1.Locale).includes(locale))
                    locales.push(locale);
                if (command.__t.name) {
                    for (const i of locales) {
                        const valueName = this.client.langs.getKey(locale, command.__t.name);
                        if (valueName)
                            command.name_localizations[i] = valueName;
                    }
                }
                if (command.__t.description) {
                    for (const i of locales) {
                        const valueKey = this.client.langs.getKey(locale, command.__t.description);
                        if (valueKey)
                            command.description_localizations[i] = valueKey;
                    }
                }
            }
        }
    }
    parseCommandOptionLocales(option) {
        option.name_localizations = {};
        option.description_localizations = {};
        for (const locale of Object.keys(this.client.langs.values)) {
            const locales = this.client.langs.aliases.find(x => x[0] === locale)?.[1] ?? [];
            if (Object.values(v10_1.Locale).includes(locale))
                locales.push(locale);
            if (option.locales.name) {
                for (const i of locales) {
                    const valueName = this.client.langs.getKey(locale, option.locales.name);
                    if (valueName)
                        option.name_localizations[i] = valueName;
                }
            }
            if (option.locales.description) {
                for (const i of locales) {
                    const valueKey = this.client.langs.getKey(locale, option.locales.description);
                    if (valueKey)
                        option.description_localizations[i] = valueKey;
                }
            }
        }
    }
    parseCommandLocales(command) {
        command.groups = {};
        for (const locale of Object.keys(this.client.langs.values)) {
            const locales = this.client.langs.aliases.find(x => x[0] === locale)?.[1] ?? [];
            if (Object.values(v10_1.Locale).includes(locale))
                locales.push(locale);
            for (const group in command.__tGroups) {
                command.groups[group] ??= {
                    defaultDescription: command.__tGroups[group].defaultDescription,
                    description: [],
                    name: [],
                };
                if (command.__tGroups[group].name) {
                    for (const i of locales) {
                        const valueName = this.client.langs.getKey(locale, command.__tGroups[group].name);
                        if (valueName) {
                            command.groups[group].name.push([i, valueName]);
                        }
                    }
                }
                if (command.__tGroups[group].description) {
                    for (const i of locales) {
                        const valueKey = this.client.langs.getKey(locale, command.__tGroups[group].description);
                        if (valueKey) {
                            command.groups[group].description.push([i, valueKey]);
                        }
                    }
                }
            }
        }
    }
    parseContextMenuLocales(command) {
        return command;
    }
    parseSubCommandLocales(command) {
        for (const i of command.options ?? []) {
            // @ts-expect-error
            if (i.locales)
                this.parseCommandOptionLocales(i);
        }
        return command;
    }
    stablishContextCommandDefaults(commandInstance) {
        if (!(commandInstance instanceof menu_1.ContextMenuCommand))
            return false;
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
    stablishCommandDefaults(commandInstance) {
        if (!(commandInstance instanceof chat_1.Command))
            return false;
        commandInstance.onAfterRun ??= this.client.options.commands?.defaults?.onAfterRun;
        commandInstance.onBotPermissionsFail ??= this.client.options.commands?.defaults?.onBotPermissionsFail;
        commandInstance.onInternalError ??= this.client.options.commands?.defaults?.onInternalError;
        commandInstance.onMiddlewaresError ??= this.client.options.commands?.defaults?.onMiddlewaresError;
        commandInstance.onOptionsError ??= this.client.options.commands?.defaults?.onOptionsError;
        commandInstance.onPermissionsFail ??= this.client.options.commands?.defaults?.onPermissionsFail;
        commandInstance.onRunError ??= this.client.options.commands?.defaults?.onRunError;
        commandInstance.options ??= [];
        return commandInstance;
    }
    stablishSubCommandDefaults(commandInstance, option) {
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
    onFile(file) {
        return file.default ? [file.default] : undefined;
    }
    onCommand(file) {
        return new file();
    }
    onSubCommand(file) {
        return new file();
    }
}
exports.CommandHandler = CommandHandler;
