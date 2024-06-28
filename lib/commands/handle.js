"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandleCommand = void 0;
const v10_1 = require("discord-api-types/v10");
const _1 = require(".");
const structures_1 = require("../structures");
const components_1 = require("../components");
const transformers_1 = require("../client/transformers");
class HandleCommand {
    client;
    constructor(client) {
        this.client = client;
    }
    async autocomplete(interaction, optionsResolver, command) {
        // idc, is a YOU problem
        if (!command?.autocomplete) {
            return this.client.logger.warn(`${optionsResolver.fullCommandName} ${command?.name} command does not have 'autocomplete' callback`);
        }
        try {
            try {
                try {
                    await command.autocomplete(interaction);
                }
                catch (error) {
                    if (!command.onAutocompleteError)
                        return this.client.logger.error(`${optionsResolver.fullCommandName} ${command.name} just threw an error, ${error ? (typeof error === 'object' && 'message' in error ? error.message : error) : 'Unknown'}`);
                    await command.onAutocompleteError(interaction, error);
                }
            }
            catch (error) {
                await optionsResolver.getCommand()?.onInternalError?.(this.client, optionsResolver.getCommand(), error);
            }
        }
        catch (error) {
            // pass
        }
    }
    async contextMenuMessage(command, interaction, context) {
        // @ts-expect-error
        return this.contextMenuUser(command, interaction, context);
    }
    async contextMenuUser(command, interaction, context) {
        if (command.botPermissions && interaction.appPermissions) {
            const permissions = this.checkPermissions(interaction.appPermissions, command.botPermissions);
            if (permissions)
                return command.onBotPermissionsFail(context, permissions);
        }
        const resultGlobal = await this.runGlobalMiddlewares(command, context);
        if (typeof resultGlobal === 'boolean')
            return;
        const resultMiddle = await this.runMiddlewares(command, context);
        if (typeof resultMiddle === 'boolean')
            return;
        try {
            try {
                await command.run(context);
                await command.onAfterRun?.(context, undefined);
            }
            catch (error) {
                await command.onRunError(context, error);
                await command.onAfterRun?.(context, error);
            }
        }
        catch (error) {
            try {
                await command.onInternalError(this.client, command, error);
            }
            catch {
                // pass
            }
        }
    }
    async chatInput(command, interaction, resolver, context) {
        if (command.botPermissions && interaction.appPermissions) {
            const permissions = this.checkPermissions(interaction.appPermissions, command.botPermissions);
            if (permissions)
                return command.onBotPermissionsFail?.(context, permissions);
        }
        if (!(await this.runOptions(command, context, resolver)))
            return;
        const resultGlobal = await this.runGlobalMiddlewares(command, context);
        if (typeof resultGlobal === 'boolean')
            return;
        const resultMiddle = await this.runMiddlewares(command, context);
        if (typeof resultMiddle === 'boolean')
            return;
        try {
            try {
                await command.run(context);
                await command.onAfterRun?.(context, undefined);
            }
            catch (error) {
                await command.onRunError?.(context, error);
                await command.onAfterRun?.(context, error);
            }
        }
        catch (error) {
            try {
                await command.onInternalError?.(this.client, command, error);
            }
            catch {
                // pass
            }
        }
    }
    async modal(interaction) {
        const context = new components_1.ModalContext(this.client, interaction);
        const extended = this.client.options?.context?.(interaction) ?? {};
        Object.assign(context, extended);
        await this.client.components?.executeModal(context);
    }
    async messageComponent(interaction) {
        //@ts-expect-error
        const context = new components_1.ComponentContext(this.client, interaction);
        const extended = this.client.options?.context?.(interaction) ?? {};
        Object.assign(context, extended);
        await this.client.components?.executeComponent(context);
    }
    async interaction(body, shardId, __reply) {
        this.client.debugger?.debug(`[${v10_1.InteractionType[body.type] ?? body.type}] Interaction received.`);
        switch (body.type) {
            case v10_1.InteractionType.ApplicationCommandAutocomplete:
                {
                    const optionsResolver = this.makeResolver(this.client, body.data.options ?? [], this.getCommand(body.data), body.guild_id, body.data.resolved);
                    const interaction = new structures_1.AutocompleteInteraction(this.client, body, optionsResolver, __reply);
                    const command = optionsResolver.getAutocomplete();
                    await this.autocomplete(interaction, optionsResolver, command);
                }
                break;
            case v10_1.InteractionType.ApplicationCommand: {
                switch (body.data.type) {
                    case v10_1.ApplicationCommandType.Message: {
                        const data = this.makeMenuCommand(body, shardId, __reply);
                        if (!data)
                            return;
                        // @ts-expect-error
                        this.contextMenuMessage(data.command, data.interaction, data.context);
                        break;
                    }
                    case v10_1.ApplicationCommandType.User: {
                        const data = this.makeMenuCommand(body, shardId, __reply);
                        if (!data)
                            return;
                        // @ts-expect-error
                        this.contextMenuUser(data.command, data.interaction, data.context);
                        break;
                    }
                    case v10_1.ApplicationCommandType.ChatInput: {
                        const parentCommand = this.getCommand(body.data);
                        const optionsResolver = this.makeResolver(this.client, body.data.options ?? [], parentCommand, body.guild_id, body.data.resolved);
                        const interaction = structures_1.BaseInteraction.from(this.client, body, __reply);
                        const command = optionsResolver.getCommand();
                        if (!command?.run)
                            return this.client.logger.warn(`${optionsResolver.fullCommandName} command does not have 'run' callback`);
                        const context = new _1.CommandContext(this.client, interaction, optionsResolver, shardId, command);
                        const extendContext = this.client.options?.context?.(interaction) ?? {};
                        Object.assign(context, extendContext);
                        await this.chatInput(command, interaction, optionsResolver, context);
                        break;
                    }
                }
                break;
            }
            case v10_1.InteractionType.ModalSubmit:
                {
                    const interaction = structures_1.BaseInteraction.from(this.client, body, __reply);
                    if (this.client.components?.hasModal(interaction)) {
                        await this.client.components.onModalSubmit(interaction);
                    }
                    else
                        await this.modal(interaction);
                }
                break;
            case v10_1.InteractionType.MessageComponent:
                {
                    const interaction = structures_1.BaseInteraction.from(this.client, body, __reply);
                    if (this.client.components?.hasComponent(body.message.id, interaction.customId)) {
                        await this.client.components.onComponent(body.message.id, interaction);
                    }
                    else
                        await this.messageComponent(interaction);
                }
                break;
        }
    }
    async message(rawMessage, shardId) {
        const self = this.client;
        if (!self.options.commands?.prefix)
            return;
        const message = transformers_1.Transformers.Message(this.client, rawMessage);
        const prefixes = (await self.options.commands.prefix(message)).sort((a, b) => b.length - a.length);
        const prefix = prefixes.find(x => rawMessage.content.startsWith(x));
        if (!(prefix !== undefined && rawMessage.content.startsWith(prefix)))
            return;
        const content = rawMessage.content.slice(prefix.length).trimStart();
        const { fullCommandName, command, parent, argsContent } = this.resolveCommandFromContent(content, prefix, rawMessage);
        if (!command || argsContent === undefined)
            return;
        if (!command.run)
            return self.logger.warn(`${fullCommandName} command does not have 'run' callback`);
        if (!(command.contexts.includes(v10_1.InteractionContextType.BotDM) || rawMessage.guild_id))
            return;
        if (!command.contexts.includes(v10_1.InteractionContextType.Guild) && rawMessage.guild_id)
            return;
        if (command.guildId && !command.guildId?.includes(rawMessage.guild_id))
            return;
        const resolved = {
            channels: {},
            roles: {},
            users: {},
            members: {},
            attachments: {},
        };
        const args = this.argsParser(argsContent, command, message);
        const { options, errors } = await this.argsOptionsParser(command, rawMessage, args, resolved);
        const optionsResolver = this.makeResolver(self, options, parent, rawMessage.guild_id, resolved);
        const context = new _1.CommandContext(self, message, optionsResolver, shardId, command);
        //@ts-expect-error
        const extendContext = self.options?.context?.(message) ?? {};
        Object.assign(context, extendContext);
        try {
            if (errors.length) {
                return command.onOptionsError?.(context, Object.fromEntries(errors.map(x => {
                    return [
                        x.name,
                        {
                            failed: true,
                            value: x.error,
                            parseError: x.fullError,
                        },
                    ];
                })));
            }
            if (command.defaultMemberPermissions && rawMessage.guild_id) {
                const memberPermissions = await self.members.permissions(rawMessage.guild_id, rawMessage.author.id);
                const permissions = this.checkPermissions(memberPermissions, command.defaultMemberPermissions);
                const guild = await this.client.guilds.raw(rawMessage.guild_id);
                if (permissions && guild.owner_id !== rawMessage.author.id) {
                    return command.onPermissionsFail?.(context, memberPermissions.keys(permissions));
                }
            }
            if (command.botPermissions && rawMessage.guild_id) {
                const meMember = await self.cache.members?.get(self.botId, rawMessage.guild_id);
                if (!meMember)
                    return; //enable member cache and "Guilds" intent, lol
                const appPermissions = await meMember.fetchPermissions();
                const permissions = this.checkPermissions(appPermissions, command.botPermissions);
                if (!appPermissions.has('Administrator') && permissions) {
                    return command.onBotPermissionsFail?.(context, permissions);
                }
            }
            if (!(await this.runOptions(command, context, optionsResolver)))
                return;
            const resultGlobal = await this.runGlobalMiddlewares(command, context);
            if (typeof resultGlobal === 'boolean')
                return;
            const resultMiddle = await this.runMiddlewares(command, context);
            if (typeof resultMiddle === 'boolean')
                return;
            try {
                await command.run(context);
                await command.onAfterRun?.(context, undefined);
            }
            catch (error) {
                await command.onRunError?.(context, error);
                await command.onAfterRun?.(context, error);
            }
        }
        catch (error) {
            try {
                await command.onInternalError?.(this.client, command, error);
            }
            catch { }
        }
    }
    argsParser(content, _command, _message) {
        const args = {};
        for (const i of content.match(/-(.*?)(?=\s-|$)/gs) ?? []) {
            args[i.slice(1).split(' ')[0]] = i.split(' ').slice(1).join(' ');
        }
        return args;
    }
    resolveCommandFromContent(content, _prefix, _message) {
        const result = this.getCommandFromContent(content
            .split(' ')
            .filter(x => x)
            .slice(0, 3));
        if (!result.command)
            return result;
        let newContent = content;
        for (const i of result.fullCommandName.split(' ')) {
            newContent = newContent.slice(newContent.indexOf(i) + i.length);
        }
        return {
            ...result,
            argsContent: newContent.slice(1),
        };
    }
    getCommandFromContent(commandRaw) {
        const rawParentName = commandRaw[0];
        const rawGroupName = commandRaw.length === 3 ? commandRaw[1] : undefined;
        const rawSubcommandName = rawGroupName ? commandRaw[2] : commandRaw[1];
        const parent = this.getParentMessageCommand(rawParentName);
        const fullCommandName = `${rawParentName}${rawGroupName ? ` ${rawGroupName} ${rawSubcommandName}` : `${rawSubcommandName ? ` ${rawSubcommandName}` : ''}`}`;
        if (!(parent instanceof _1.Command))
            return { fullCommandName };
        if (rawGroupName && !parent.groups?.[rawGroupName] && !parent.groupsAliases?.[rawGroupName])
            return this.getCommandFromContent([rawParentName, rawGroupName]);
        if (rawSubcommandName &&
            !parent.options?.some(x => x instanceof _1.SubCommand && (x.name === rawSubcommandName || x.aliases?.includes(rawSubcommandName))))
            return this.getCommandFromContent([rawParentName]);
        const groupName = rawGroupName ? parent.groupsAliases?.[rawGroupName] || rawGroupName : undefined;
        const command = groupName || rawSubcommandName
            ? parent.options?.find(opt => {
                if (opt instanceof _1.SubCommand) {
                    if (groupName) {
                        if (opt.group !== groupName)
                            return false;
                    }
                    if (opt.group && !groupName)
                        return false;
                    return rawSubcommandName === opt.name || opt.aliases?.includes(rawSubcommandName);
                }
                return false;
            })
            : parent;
        return {
            command,
            fullCommandName,
            parent,
        };
    }
    makeResolver(...args) {
        return transformers_1.Transformers.OptionResolver(...args);
    }
    getParentMessageCommand(rawParentName) {
        return this.client.commands.values.find(x => (!('ignore' in x) || x.ignore !== _1.IgnoreCommand.Message) &&
            (x.name === rawParentName || ('aliases' in x ? x.aliases?.includes(rawParentName) : false)));
    }
    getCommand(data) {
        return this.client.commands.values.find(command => {
            if (data.guild_id) {
                return command.guildId?.includes(data.guild_id) && command.name === data.name;
            }
            return command.name === data.name;
        });
    }
    checkPermissions(app, bot) {
        const permissions = app.missings(...app.values([bot]));
        if (!app.has('Administrator') && permissions.length) {
            return app.keys(permissions);
        }
        return false;
    }
    async fetchChannel(_option, id) {
        return this.client.channels.raw(id);
    }
    async fetchUser(_option, id) {
        return this.client.users.raw(id);
    }
    async fetchMember(_option, id, guildId) {
        return this.client.members.raw(guildId, id);
    }
    async fetchRole(_option, id, guildId) {
        return guildId ? (await this.client.roles.listRaw(guildId)).find(x => x.id === id) : undefined;
    }
    async runGlobalMiddlewares(command, context) {
        try {
            const resultRunGlobalMiddlewares = await _1.BaseCommand.__runMiddlewares(context, (this.client.options?.globalMiddlewares ?? []), true);
            if (resultRunGlobalMiddlewares.pass) {
                return false;
            }
            if ('error' in resultRunGlobalMiddlewares) {
                await command.onMiddlewaresError?.(context, resultRunGlobalMiddlewares.error ?? 'Unknown error');
                return;
            }
            return resultRunGlobalMiddlewares;
        }
        catch (e) {
            try {
                await command.onInternalError?.(this.client, command, e);
            }
            catch { }
        }
        return false;
    }
    async runMiddlewares(command, context) {
        try {
            const resultRunMiddlewares = await _1.BaseCommand.__runMiddlewares(context, command.middlewares, false);
            if (resultRunMiddlewares.pass) {
                return false;
            }
            if ('error' in resultRunMiddlewares) {
                await command.onMiddlewaresError?.(context, resultRunMiddlewares.error ?? 'Unknown error');
                return;
            }
            return resultRunMiddlewares;
        }
        catch (e) {
            try {
                await command.onInternalError?.(this.client, command, e);
            }
            catch { }
        }
        return false;
    }
    makeMenuCommand(body, shardId, __reply) {
        const command = this.getCommand(body.data);
        const interaction = structures_1.BaseInteraction.from(this.client, body, __reply);
        // idc, is a YOU problem
        if (!command?.run)
            return this.client.logger.warn(`${command?.name ?? 'Unknown'} command does not have 'run' callback`);
        const context = new _1.MenuCommandContext(this.client, interaction, shardId, command);
        const extendContext = this.client.options?.context?.(interaction) ?? {};
        Object.assign(context, extendContext);
        return { command, interaction, context };
    }
    async runOptions(command, context, resolver) {
        const [erroredOptions, result] = await command.__runOptions(context, resolver);
        if (erroredOptions) {
            try {
                await command.onOptionsError?.(context, result);
            }
            catch (e) {
                try {
                    await command.onInternalError?.(this.client, command, e);
                }
                catch { }
            }
            return false;
        }
        return true;
    }
    async argsOptionsParser(command, message, args, resolved) {
        const options = [];
        const errors = [];
        for (const i of (command.options ?? [])) {
            try {
                let value;
                let indexAttachment = -1;
                switch (i.type) {
                    case v10_1.ApplicationCommandOptionType.Attachment:
                        if (message.attachments[++indexAttachment]) {
                            value = message.attachments[indexAttachment].id;
                            resolved.attachments[value] = message.attachments[indexAttachment];
                        }
                        break;
                    case v10_1.ApplicationCommandOptionType.Boolean:
                        if (args[i.name]) {
                            value = ['yes', 'y', 'true', 'treu'].includes(args[i.name].toLowerCase());
                        }
                        break;
                    case v10_1.ApplicationCommandOptionType.Channel:
                        {
                            const rawId = message.content.match(/(?<=<#)[0-9]{17,19}(?=>)/g)?.find(x => args[i.name]?.includes(x)) ||
                                args[i.name]?.match(/[0-9]{17,19}/g)?.[0];
                            if (!rawId)
                                continue;
                            const channel = (await this.client.cache.channels?.raw(rawId)) ?? (await this.fetchChannel(i, rawId));
                            if (channel) {
                                if ('channel_types' in i) {
                                    if (!i.channel_types.includes(channel.type)) {
                                        errors.push({
                                            name: i.name,
                                            error: `The entered channel type is not one of ${i
                                                .channel_types.map(t => v10_1.ChannelType[t])
                                                .join(', ')}`,
                                            fullError: ['CHANNEL_TYPES', i.channel_types],
                                        });
                                        break;
                                    }
                                }
                                value = rawId;
                                //discord funny memoentnt!!!!!!!!
                                resolved.channels[rawId] = channel;
                            }
                        }
                        break;
                    case v10_1.ApplicationCommandOptionType.Mentionable:
                        {
                            const matches = message.content.match(/<@[0-9]{17,19}(?=>)|<@&[0-9]{17,19}(?=>)/g) ?? [];
                            for (const match of matches) {
                                if (match.includes('&')) {
                                    const rawId = match.slice(3);
                                    if (rawId) {
                                        const role = (await this.client.cache.roles?.raw(rawId)) ?? (await this.fetchRole(i, rawId, message.guild_id));
                                        if (role) {
                                            value = rawId;
                                            resolved.roles[rawId] = role;
                                            break;
                                        }
                                    }
                                }
                                else {
                                    const rawId = match.slice(2);
                                    const raw = message.mentions.find(x => rawId === x.id);
                                    if (raw) {
                                        const { member, ...user } = raw;
                                        value = raw.id;
                                        resolved.users[raw.id] = user;
                                        if (member)
                                            resolved.members[raw.id] = member;
                                        break;
                                    }
                                }
                            }
                        }
                        break;
                    case v10_1.ApplicationCommandOptionType.Role:
                        {
                            const rawId = message.mention_roles.find(x => args[i.name]?.includes(x)) || args[i.name]?.match(/[0-9]{17,19}/g)?.[0];
                            if (!rawId)
                                continue;
                            const role = (await this.client.cache.roles?.raw(rawId)) ?? (await this.fetchRole(i, rawId, message.guild_id));
                            if (role) {
                                value = rawId;
                                resolved.roles[rawId] = role;
                            }
                        }
                        break;
                    case v10_1.ApplicationCommandOptionType.User:
                        {
                            const rawId = message.mentions.find(x => args[i.name]?.includes(x.id))?.id ||
                                args[i.name]?.match(/[0-9]{17,19}/g)?.[0];
                            if (!rawId)
                                continue;
                            const raw = message.mentions.find(x => args[i.name]?.includes(x.id)) ??
                                (await this.client.cache.users?.raw(rawId)) ??
                                (await this.fetchUser(i, rawId));
                            if (raw) {
                                value = raw.id;
                                resolved.users[raw.id] = raw;
                                if (message.guild_id) {
                                    const member = message.mentions.find(x => args[i.name]?.includes(x.id))?.member ??
                                        (await this.client.cache.members?.raw(rawId, message.guild_id)) ??
                                        (await this.fetchMember(i, rawId, message.guild_id));
                                    if (member)
                                        resolved.members[raw.id] = member;
                                }
                            }
                        }
                        break;
                    case v10_1.ApplicationCommandOptionType.String:
                        {
                            value = args[i.name];
                            const option = i;
                            if (!value)
                                break;
                            if (option.min_length) {
                                if (value.length < option.min_length) {
                                    value = undefined;
                                    errors.push({
                                        name: i.name,
                                        error: `The entered string has less than ${option.min_length} characters. The minimum required is ${option.min_length} characters.`,
                                        fullError: ['STRING_MIN_LENGTH', option.min_length],
                                    });
                                    break;
                                }
                            }
                            if (option.max_length) {
                                if (value.length > option.max_length) {
                                    value = undefined;
                                    errors.push({
                                        name: i.name,
                                        error: `The entered string has more than ${option.max_length} characters. The maximum required is ${option.max_length} characters.`,
                                        fullError: ['STRING_MAX_LENGTH', option.max_length],
                                    });
                                    break;
                                }
                            }
                            if (option.choices?.length) {
                                const choice = option.choices.find(x => x.name === value);
                                if (!choice) {
                                    value = undefined;
                                    errors.push({
                                        name: i.name,
                                        error: `The entered choice is invalid. Please choose one of the following options: ${option.choices
                                            .map(x => x.name)
                                            .join(', ')}.`,
                                        fullError: ['STRING_INVALID_CHOICE', option.choices],
                                    });
                                    break;
                                }
                                value = choice.value;
                            }
                        }
                        break;
                    case v10_1.ApplicationCommandOptionType.Number:
                    case v10_1.ApplicationCommandOptionType.Integer:
                        {
                            const option = i;
                            if (!option.choices?.length) {
                                value = Number(args[i.name]);
                                if (args[i.name] === undefined) {
                                    value = undefined;
                                    break;
                                }
                                if (Number.isNaN(value)) {
                                    value = undefined;
                                    errors.push({
                                        name: i.name,
                                        error: 'The entered choice is an invalid number.',
                                        fullError: ['NUMBER_NAN', args[i.name]],
                                    });
                                    break;
                                }
                                if (option.min_value) {
                                    if (value < option.min_value) {
                                        value = undefined;
                                        errors.push({
                                            name: i.name,
                                            error: `The entered number is less than ${option.min_value}. The minimum allowed is ${option.min_value}`,
                                            fullError: ['NUMBER_MIN_VALUE', option.min_value],
                                        });
                                        break;
                                    }
                                }
                                if (option.max_value) {
                                    if (value > option.max_value) {
                                        value = undefined;
                                        errors.push({
                                            name: i.name,
                                            error: `The entered number is greater than ${option.max_value}. The maximum allowed is ${option.max_value}`,
                                            fullError: ['NUMBER_MAX_VALUE', option.max_value],
                                        });
                                        break;
                                    }
                                }
                                break;
                            }
                            const choice = option.choices.find(x => x.name === args[i.name]);
                            if (!choice) {
                                value = undefined;
                                errors.push({
                                    name: i.name,
                                    error: `The entered choice is invalid. Please choose one of the following options: ${option.choices
                                        .map(x => x.name)
                                        .join(', ')}.`,
                                    fullError: ['NUMBER_INVALID_CHOICE', option.choices],
                                });
                                break;
                            }
                            value = choice.value;
                        }
                        break;
                    default:
                        break;
                }
                if (value !== undefined) {
                    options.push({
                        name: i.name,
                        type: i.type,
                        value,
                    });
                }
                else if (i.required)
                    if (!errors.some(x => x.name === i.name))
                        errors.push({
                            error: 'Option is required but returned undefined',
                            name: i.name,
                            fullError: ['OPTION_REQUIRED'],
                        });
            }
            catch (e) {
                errors.push({
                    error: e && typeof e === 'object' && 'message' in e ? e.message : `${e}`,
                    name: i.name,
                    fullError: ['UNKNOWN', e],
                });
            }
        }
        return { errors, options };
    }
}
exports.HandleCommand = HandleCommand;
