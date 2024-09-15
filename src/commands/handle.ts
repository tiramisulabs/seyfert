import {
	BaseCommand,
	Command,
	type CommandAutocompleteOption,
	CommandContext,
	type CommandOption,
	type ContextMenuCommand,
	type ContextOptionsResolved,
	type EntryPointCommand,
	EntryPointContext,
	IgnoreCommand,
	MenuCommandContext,
	type MessageCommandOptionErrors,
	type RegisteredMiddlewares,
	type SeyfertChannelOption,
	type SeyfertIntegerOption,
	type SeyfertNumberOption,
	type SeyfertStringOption,
	SubCommand,
	type UsingClient,
} from '.';
import type { Client, WorkerClient } from '../client';
import { type MessageStructure, type OptionResolverStructure, Transformers } from '../client/transformers';
import type { MakeRequired } from '../common';
import { ComponentContext, ModalContext } from '../components';
import {
	AutocompleteInteraction,
	BaseInteraction,
	type ChatInputCommandInteraction,
	type ComponentInteraction,
	type EntryPointInteraction,
	type MessageCommandInteraction,
	type ModalSubmitInteraction,
	type UserCommandInteraction,
	type __InternalReplyFunction,
} from '../structures';
import type { PermissionsBitField } from '../structures/extra/Permissions';
import {
	type APIApplicationCommandInteraction,
	type APIApplicationCommandInteractionDataOption,
	type APIInteraction,
	type APIInteractionDataResolvedChannel,
	ApplicationCommandOptionType,
	ApplicationCommandType,
	ChannelType,
	type GatewayMessageCreateDispatchData,
	InteractionContextType,
	InteractionType,
} from '../types';

export type CommandOptionWithType = CommandOption & {
	type: ApplicationCommandOptionType;
};

export interface CommandFromContent {
	command?: Command | SubCommand;
	parent?: Command;
	fullCommandName: string;
}

export class HandleCommand {
	constructor(public client: UsingClient) {}

	async autocomplete(
		interaction: AutocompleteInteraction,
		optionsResolver: OptionResolverStructure,
		command?: CommandAutocompleteOption,
	) {
		// idc, is a YOU problem
		if (!command?.autocomplete) {
			return this.client.logger.warn(
				`${optionsResolver.fullCommandName} ${command?.name} command does not have 'autocomplete' callback`,
			);
		}

		try {
			try {
				try {
					await command.autocomplete(interaction);
				} catch (error) {
					if (!command.onAutocompleteError)
						return this.client.logger.error(
							`${optionsResolver.fullCommandName} ${command.name} just threw an error, ${
								error ? (typeof error === 'object' && 'message' in error ? error.message : error) : 'Unknown'
							}`,
						);
					await command.onAutocompleteError(interaction, error);
				}
			} catch (error) {
				await optionsResolver.getCommand()?.onInternalError?.(this.client, optionsResolver.getCommand()!, error);
			}
		} catch (error) {
			// pass
		}
	}

	async contextMenuMessage(
		command: ContextMenuCommand,
		interaction: MessageCommandInteraction,
		context: MenuCommandContext<MessageCommandInteraction>,
	) {
		// @ts-expect-error
		return this.contextMenuUser(command, interaction, context);
	}

	async contextMenuUser(
		command: ContextMenuCommand,
		interaction: UserCommandInteraction,
		context: MenuCommandContext<UserCommandInteraction>,
	) {
		if (command.botPermissions && interaction.appPermissions) {
			const permissions = this.checkPermissions(interaction.appPermissions, command.botPermissions);
			if (permissions) return command.onBotPermissionsFail(context, permissions);
		}

		const resultGlobal = await this.runGlobalMiddlewares(command, context);
		if (typeof resultGlobal === 'boolean') return;
		const resultMiddle = await this.runMiddlewares(command, context);
		if (typeof resultMiddle === 'boolean') return;

		try {
			try {
				await command.run!(context);
				await command.onAfterRun?.(context, undefined);
			} catch (error) {
				await command.onRunError(context, error);
				await command.onAfterRun?.(context, error);
			}
		} catch (error) {
			try {
				await command.onInternalError(this.client, command, error);
			} catch {
				// pass
			}
		}
	}

	async entryPoint(command: EntryPointCommand, interaction: EntryPointInteraction, context: EntryPointContext) {
		if (command.botPermissions && interaction.appPermissions) {
			const permissions = this.checkPermissions(interaction.appPermissions, command.botPermissions);
			if (permissions) return command.onBotPermissionsFail?.(context, permissions);
		}

		const resultGlobal = await this.runGlobalMiddlewares(command, context);
		if (typeof resultGlobal === 'boolean') return;
		const resultMiddle = await this.runMiddlewares(command, context);
		if (typeof resultMiddle === 'boolean') return;

		try {
			try {
				await command.run!(context);
				await command.onAfterRun?.(context, undefined);
			} catch (error) {
				await command.onRunError(context, error);
				await command.onAfterRun?.(context, error);
			}
		} catch (error) {
			try {
				await command.onInternalError(this.client, command, error);
			} catch {
				// pass
			}
		}
	}

	async chatInput(
		command: Command | SubCommand,
		interaction: ChatInputCommandInteraction,
		resolver: OptionResolverStructure,
		context: CommandContext,
	) {
		if (command.botPermissions && interaction.appPermissions) {
			const permissions = this.checkPermissions(interaction.appPermissions, command.botPermissions);
			if (permissions) return command.onBotPermissionsFail?.(context, permissions);
		}
		if (!(await this.runOptions(command, context, resolver))) return;

		const resultGlobal = await this.runGlobalMiddlewares(command, context);
		if (typeof resultGlobal === 'boolean') return;
		const resultMiddle = await this.runMiddlewares(command, context);
		if (typeof resultMiddle === 'boolean') return;

		try {
			try {
				await command.run!(context);
				await command.onAfterRun?.(context, undefined);
			} catch (error) {
				await command.onRunError?.(context, error);
				await command.onAfterRun?.(context, error);
			}
		} catch (error) {
			try {
				await command.onInternalError?.(this.client, command, error);
			} catch {
				// pass
			}
		}
	}

	async modal(interaction: ModalSubmitInteraction) {
		const context = new ModalContext(this.client, interaction);
		const extended = this.client.options?.context?.(interaction) ?? {};
		Object.assign(context, extended);
		await this.client.components?.executeModal(context);
	}

	async messageComponent(interaction: ComponentInteraction) {
		//@ts-expect-error
		const context = new ComponentContext(this.client, interaction);
		const extended = this.client.options?.context?.(interaction) ?? {};
		Object.assign(context, extended);
		await this.client.components?.executeComponent(context);
	}

	async interaction(body: APIInteraction, shardId: number, __reply?: __InternalReplyFunction) {
		this.client.debugger?.debug(`[${InteractionType[body.type] ?? body.type}] Interaction received.`);
		switch (body.type) {
			case InteractionType.ApplicationCommandAutocomplete:
				{
					const optionsResolver = this.makeResolver(
						this.client,
						body.data.options ?? [],
						this.getCommand<Command>(body.data),
						body.guild_id,
						body.data.resolved as ContextOptionsResolved,
					);
					const interaction = new AutocompleteInteraction(this.client, body, optionsResolver, __reply);
					const command = optionsResolver.getAutocomplete();
					await this.autocomplete(interaction, optionsResolver, command);
				}
				break;
			case InteractionType.ApplicationCommand: {
				switch (body.data.type) {
					case ApplicationCommandType.Message: {
						const data = this.makeMenuCommand(body, shardId, __reply);
						if (!data) return;
						// @ts-expect-error
						this.contextMenuMessage(data.command, data.interaction, data.context);
						break;
					}
					case ApplicationCommandType.User: {
						const data = this.makeMenuCommand(body, shardId, __reply);
						if (!data) return;
						// @ts-expect-error
						this.contextMenuUser(data.command, data.interaction, data.context);
						break;
					}
					case ApplicationCommandType.PrimaryEntryPoint: {
						const command = this.client.commands?.entryPoint;
						if (!command?.run) return;
						const interaction = BaseInteraction.from(this.client, body, __reply) as EntryPointInteraction;
						const context = new EntryPointContext(this.client, interaction, shardId, command);
						const extendContext = this.client.options?.context?.(interaction) ?? {};
						Object.assign(context, extendContext);
						await this.entryPoint(command, interaction, context);
						break;
					}
					case ApplicationCommandType.ChatInput: {
						const parentCommand = this.getCommand<Command>(body.data);
						const optionsResolver = this.makeResolver(
							this.client,
							body.data.options ?? [],
							parentCommand,
							body.guild_id,
							body.data.resolved as ContextOptionsResolved,
						);
						const interaction = BaseInteraction.from(this.client, body, __reply) as ChatInputCommandInteraction;
						const command = optionsResolver.getCommand();
						if (!command?.run)
							return this.client.logger.warn(`${optionsResolver.fullCommandName} command does not have 'run' callback`);
						const context = new CommandContext(this.client, interaction, optionsResolver, shardId, command);
						const extendContext = this.client.options?.context?.(interaction) ?? {};
						Object.assign(context, extendContext);
						await this.chatInput(command, interaction, optionsResolver, context);
						break;
					}
				}
				break;
			}
			case InteractionType.ModalSubmit:
				{
					const interaction = BaseInteraction.from(this.client, body, __reply) as ModalSubmitInteraction;
					if (this.client.components?.hasModal(interaction)) {
						await this.client.components.onModalSubmit(interaction);
					} else await this.modal(interaction);
				}
				break;
			case InteractionType.MessageComponent:
				{
					const interaction = BaseInteraction.from(this.client, body, __reply) as ComponentInteraction;
					if (this.client.components?.hasComponent(body.message.id, interaction.customId)) {
						await this.client.components.onComponent(body.message.id, interaction);
					} else await this.messageComponent(interaction);
				}
				break;
		}
	}

	async message(rawMessage: GatewayMessageCreateDispatchData, shardId: number) {
		const self = this.client as Client | WorkerClient;
		if (!self.options.commands?.prefix) return;
		const message = Transformers.Message(this.client, rawMessage);
		const prefixes = (await self.options.commands.prefix(message)).sort((a, b) => b.length - a.length);
		const prefix = prefixes.find(x => rawMessage.content.startsWith(x));

		if (!(prefix !== undefined && rawMessage.content.startsWith(prefix))) return;

		const content = rawMessage.content.slice(prefix.length).trimStart();

		const { fullCommandName, command, parent, argsContent } = this.resolveCommandFromContent(
			content,
			prefix,
			rawMessage,
		);

		if (!command || argsContent === undefined) return;
		if (!command.run) return self.logger.warn(`${fullCommandName} command does not have 'run' callback`);

		if (!(command.contexts.includes(InteractionContextType.BotDM) || rawMessage.guild_id)) return;
		if (!command.contexts.includes(InteractionContextType.Guild) && rawMessage.guild_id) return;
		if (command.guildId && !command.guildId?.includes(rawMessage.guild_id!)) return;

		const resolved: MakeRequired<ContextOptionsResolved> = {
			channels: {},
			roles: {},
			users: {},
			members: {},
			attachments: {},
		};

		const args = this.argsParser(argsContent, command, message);
		const { options, errors } = await this.argsOptionsParser(command, rawMessage, args, resolved);
		const optionsResolver = this.makeResolver(self, options, parent as Command, rawMessage.guild_id, resolved);
		const context = new CommandContext(self, message, optionsResolver, shardId, command);
		//@ts-expect-error
		const extendContext = self.options?.context?.(message) ?? {};
		Object.assign(context, extendContext);

		try {
			if (errors.length) {
				return command.onOptionsError?.(
					context,
					Object.fromEntries(
						errors.map(x => {
							return [
								x.name,
								{
									failed: true,
									value: x.error,
									parseError: x.fullError,
								},
							];
						}),
					),
				);
			}

			if (rawMessage.guild_id) {
				if (command.defaultMemberPermissions) {
					const memberPermissions = await self.members.permissions(rawMessage.guild_id, rawMessage.author.id);
					const permissions = this.checkPermissions(memberPermissions, command.defaultMemberPermissions);
					const guild = await this.client.guilds.raw(rawMessage.guild_id);
					if (permissions && guild.owner_id !== rawMessage.author.id) {
						return command.onPermissionsFail?.(context, memberPermissions.keys(permissions));
					}
				}

				if (command.botPermissions) {
					const appPermissions = await self.members.permissions(rawMessage.guild_id, self.botId);
					const permissions = this.checkPermissions(appPermissions, command.botPermissions);
					if (!appPermissions.has('Administrator') && permissions) {
						return command.onBotPermissionsFail?.(context, permissions);
					}
				}
			}

			if (!(await this.runOptions(command, context, optionsResolver))) return;

			const resultGlobal = await this.runGlobalMiddlewares(command, context);
			if (typeof resultGlobal === 'boolean') return;
			const resultMiddle = await this.runMiddlewares(command, context);
			if (typeof resultMiddle === 'boolean') return;
			try {
				await command.run!(context);
				await command.onAfterRun?.(context, undefined);
			} catch (error) {
				await command.onRunError?.(context, error);
				await command.onAfterRun?.(context, error);
			}
		} catch (error) {
			try {
				await command.onInternalError?.(this.client, command, error);
			} catch {
				// http 418
			}
		}
	}

	argsParser(content: string, _command: SubCommand | Command, _message: MessageStructure): Record<string, string> {
		const args: Record<string, string> = {};
		for (const i of content.match(/-(.*?)(?=\s-|$)/gs) ?? []) {
			args[i.slice(1).split(' ')[0]] = i.split(' ').slice(1).join(' ');
		}
		return args;
	}

	resolveCommandFromContent(
		content: string,
		_prefix: string,
		_message: GatewayMessageCreateDispatchData,
	): CommandFromContent & { argsContent?: string } {
		const result = this.getCommandFromContent(
			content
				.split(' ')
				.filter(x => x)
				.slice(0, 3),
		);

		if (!result.command) return result;

		let newContent = content;
		for (const i of result.fullCommandName.split(' ')) {
			newContent = newContent.slice(newContent.indexOf(i) + i.length);
		}

		return {
			...result,
			argsContent: newContent.slice(1),
		};
	}

	getCommandFromContent(commandRaw: string[]): CommandFromContent {
		const rawParentName = commandRaw[0];
		const rawGroupName = commandRaw.length === 3 ? commandRaw[1] : undefined;
		const rawSubcommandName = rawGroupName ? commandRaw[2] : commandRaw[1];
		const parent = this.getParentMessageCommand(rawParentName);
		const fullCommandName = `${rawParentName}${
			rawGroupName ? ` ${rawGroupName} ${rawSubcommandName}` : `${rawSubcommandName ? ` ${rawSubcommandName}` : ''}`
		}`;

		if (!(parent instanceof Command)) return { fullCommandName };

		if (rawGroupName && !parent.groups?.[rawGroupName] && !parent.groupsAliases?.[rawGroupName])
			return this.getCommandFromContent([rawParentName, rawGroupName]);
		if (
			rawSubcommandName &&
			!parent.options?.some(
				x => x instanceof SubCommand && (x.name === rawSubcommandName || x.aliases?.includes(rawSubcommandName)),
			)
		)
			return this.getCommandFromContent([rawParentName]);

		const groupName = rawGroupName ? parent.groupsAliases?.[rawGroupName] || rawGroupName : undefined;

		const command =
			groupName || rawSubcommandName
				? (parent.options?.find(opt => {
						if (opt instanceof SubCommand) {
							if (groupName) {
								if (opt.group !== groupName) return false;
							}
							if (opt.group && !groupName) return false;
							return rawSubcommandName === opt.name || opt.aliases?.includes(rawSubcommandName);
						}
						return false;
					}) as SubCommand)
				: parent;

		return {
			command,
			fullCommandName,
			parent,
		};
	}

	makeResolver(...args: Parameters<(typeof Transformers)['OptionResolver']>) {
		return Transformers.OptionResolver(...args);
	}

	getParentMessageCommand(rawParentName: string) {
		return this.client.commands!.values.find(
			x =>
				(!('ignore' in x) || x.ignore !== IgnoreCommand.Message) &&
				(x.name === rawParentName || ('aliases' in x ? x.aliases?.includes(rawParentName) : false)),
		);
	}

	getCommand<T extends Command | ContextMenuCommand | EntryPointCommand>(data: {
		guild_id?: string;
		name: string;
	}): T | undefined {
		return this.client.commands!.values.find(command => {
			if (data.guild_id) {
				return command.guildId?.includes(data.guild_id) && command.name === data.name;
			}
			return command.name === data.name;
		}) as T;
	}

	checkPermissions(app: PermissionsBitField, bot: bigint) {
		const permissions = app.missings(...app.values([bot]));
		if (!app.has('Administrator') && permissions.length) {
			return app.keys(permissions);
		}
		return;
	}

	async fetchChannel(_option: CommandOptionWithType, query: string) {
		const id = query.match(/[0-9]{17,19}/g)?.[0];
		if (id) return this.client.channels.raw(id);
		return null;
	}

	async fetchUser(_option: CommandOptionWithType, query: string) {
		const id = query.match(/[0-9]{17,19}/g)?.[0];
		if (id) return this.client.users.raw(id);
		return null;
	}

	async fetchMember(_option: CommandOptionWithType, query: string, guildId: string) {
		const id = query.match(/[0-9]{17,19}/g)?.[0];
		if (id) return this.client.members.raw(guildId, id);
		return null;
	}

	async fetchRole(_option: CommandOptionWithType, query: string, guildId?: string) {
		const id = query.match(/[0-9]{17,19}/g)?.[0];
		if (id && guildId) return (await this.client.roles.listRaw(guildId)).find(x => x.id === id);
		return null;
	}

	async runGlobalMiddlewares(
		command: Command | ContextMenuCommand | SubCommand | EntryPointCommand,
		context: CommandContext<{}, never> | MenuCommandContext<any> | EntryPointContext,
	) {
		try {
			const resultRunGlobalMiddlewares = await BaseCommand.__runMiddlewares(
				context,
				(this.client.options?.globalMiddlewares ?? []) as keyof RegisteredMiddlewares,
				true,
			);
			if (resultRunGlobalMiddlewares.pass) {
				return false;
			}
			if ('error' in resultRunGlobalMiddlewares) {
				await command.onMiddlewaresError?.(context as never, resultRunGlobalMiddlewares.error ?? 'Unknown error');
				return false;
			}
			return resultRunGlobalMiddlewares;
		} catch (e) {
			try {
				await command.onInternalError?.(this.client, command as never, e);
			} catch {
				// http 418
			}
		}
		return false;
	}

	async runMiddlewares(
		command: Command | ContextMenuCommand | SubCommand | EntryPointCommand,
		context: CommandContext<{}, never> | MenuCommandContext<any> | EntryPointContext,
	) {
		try {
			const resultRunMiddlewares = await BaseCommand.__runMiddlewares(
				context,
				command.middlewares as keyof RegisteredMiddlewares,
				false,
			);
			if (resultRunMiddlewares.pass) {
				return false;
			}
			if ('error' in resultRunMiddlewares) {
				await command.onMiddlewaresError?.(context as never, resultRunMiddlewares.error ?? 'Unknown error');
				return false;
			}
			return resultRunMiddlewares;
		} catch (e) {
			try {
				await command.onInternalError?.(this.client, command as never, e);
			} catch {
				// http 418
			}
		}
		return false;
	}

	makeMenuCommand(body: APIApplicationCommandInteraction, shardId: number, __reply?: __InternalReplyFunction) {
		const command = this.getCommand<ContextMenuCommand>(body.data);
		const interaction = BaseInteraction.from(this.client, body, __reply) as
			| UserCommandInteraction
			| MessageCommandInteraction;
		// idc, is a YOU problem
		if (!command?.run)
			return this.client.logger.warn(`${command?.name ?? 'Unknown'} command does not have 'run' callback`);
		const context = new MenuCommandContext(this.client, interaction, shardId, command);
		const extendContext = this.client.options?.context?.(interaction) ?? {};
		Object.assign(context, extendContext);

		return { command, interaction, context };
	}

	async runOptions(command: Command | SubCommand, context: CommandContext, resolver: OptionResolverStructure) {
		const [erroredOptions, result] = await command.__runOptions(context, resolver);
		if (erroredOptions) {
			try {
				await command.onOptionsError?.(context, result);
			} catch (e) {
				try {
					await command.onInternalError?.(this.client, command, e);
				} catch {
					// http 418
				}
			}
			return false;
		}
		return true;
	}

	async argsOptionsParser(
		command: Command | SubCommand,
		message: GatewayMessageCreateDispatchData,
		args: Partial<Record<string, string>>,
		resolved: MakeRequired<ContextOptionsResolved>,
	) {
		const options: APIApplicationCommandInteractionDataOption[] = [];
		const errors: { name: string; error: string; fullError: MessageCommandOptionErrors }[] = [];
		let indexAttachment = -1;
		for (const i of (command.options ?? []) as (CommandOption & { type: ApplicationCommandOptionType })[]) {
			try {
				let value: string | boolean | number | undefined;
				switch (i.type) {
					case ApplicationCommandOptionType.Attachment:
						if (message.attachments[++indexAttachment]) {
							value = message.attachments[indexAttachment].id;
							resolved.attachments[value] = message.attachments[indexAttachment];
						}
						break;
					case ApplicationCommandOptionType.Boolean:
						if (args[i.name]) {
							value = ['yes', 'y', 'true', 'treu'].includes(args[i.name]!.toLowerCase());
						}
						break;
					case ApplicationCommandOptionType.Channel:
						{
							const rawQuery =
								message.content.match(/(?<=<#)[0-9]{17,19}(?=>)/g)?.find(x => args[i.name]?.includes(x)) ||
								args[i.name];
							if (!rawQuery) continue;
							const channel =
								(await this.client.cache.channels?.raw(rawQuery)) ?? (await this.fetchChannel(i, rawQuery));
							if (channel) {
								if ('channel_types' in i) {
									if (!(i as SeyfertChannelOption).channel_types!.includes(channel.type)) {
										if (i.required)
											errors.push({
												name: i.name,
												error: `The entered channel type is not one of ${(i as SeyfertChannelOption)
													.channel_types!.map(t => ChannelType[t])
													.join(', ')}`,
												fullError: ['CHANNEL_TYPES', (i as SeyfertChannelOption).channel_types!],
											});
										break;
									}
								}
								value = channel.id;
								//discord funny memoentnt!!!!!!!!
								resolved.channels[channel.id] = channel as APIInteractionDataResolvedChannel;
							}
						}
						break;
					case ApplicationCommandOptionType.Mentionable:
						{
							const matches = args[i.name]?.match(/<@[0-9]{17,19}(?=>)|<@&[0-9]{17,19}(?=>)/g) ?? [];
							for (const match of matches) {
								if (match.includes('&')) {
									const rawId = match.slice(3);
									if (rawId) {
										const role =
											(await this.client.cache.roles?.raw(rawId)) ?? (await this.fetchRole(i, rawId, message.guild_id));
										if (role) {
											value = rawId;
											resolved.roles[rawId] = role;
											break;
										}
									}
								} else {
									const rawId = match.slice(2);
									const raw = message.mentions.find(x => rawId === x.id);
									if (raw) {
										const { member, ...user } = raw;
										value = raw.id;
										resolved.users[raw.id] = user;
										if (member) resolved.members[raw.id] = member;
										break;
									}
								}
							}
						}
						break;
					case ApplicationCommandOptionType.Role:
						{
							const rawQuery = message.mention_roles.find(x => args[i.name]?.includes(x)) || args[i.name];
							if (!rawQuery) continue;
							const role =
								(await this.client.cache.roles?.raw(rawQuery)) ?? (await this.fetchRole(i, rawQuery, message.guild_id));
							if (role) {
								value = role.id;
								resolved.roles[role.id] = role;
							}
						}
						break;
					case ApplicationCommandOptionType.User:
						{
							const rawQuery = message.mentions.find(x => args[i.name]?.includes(x.id))?.id || args[i.name];
							if (!rawQuery) continue;
							const raw =
								message.mentions.find(x => args[i.name]?.includes(x.id)) ??
								(await this.client.cache.users?.raw(rawQuery)) ??
								(await this.fetchUser(i, rawQuery));
							if (raw) {
								value = raw.id;
								resolved.users[raw.id] = raw;
								if (message.guild_id) {
									const member =
										message.mentions.find(x => args[i.name]?.includes(x.id))?.member ??
										(await this.client.cache.members?.raw(value, message.guild_id)) ??
										(await this.fetchMember(i, value, message.guild_id));
									if (member) resolved.members[value] = member;
								}
							}
						}
						break;
					case ApplicationCommandOptionType.String:
						{
							value = args[i.name];
							const option = i as SeyfertStringOption;
							if (!value) break;
							if (option.min_length) {
								if (value.length < option.min_length) {
									value = undefined;
									if (i.required)
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
									if (i.required)
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
									if (i.required)
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
					case ApplicationCommandOptionType.Number:
					case ApplicationCommandOptionType.Integer:
						{
							const option = i as SeyfertNumberOption | SeyfertIntegerOption;
							if (!option.choices?.length) {
								value = Number(args[i.name]);
								if (args[i.name] === undefined) {
									value = undefined;
									break;
								}
								if (Number.isNaN(value)) {
									value = undefined;
									if (i.required)
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
										if (i.required)
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
										if (i.required)
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
								if (i.required)
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
					} as APIApplicationCommandInteractionDataOption);
				} else if (i.required)
					if (!errors.some(x => x.name === i.name))
						errors.push({
							error: 'Option is required but returned undefined',
							name: i.name,
							fullError: ['OPTION_REQUIRED'],
						});
			} catch (e) {
				errors.push({
					error: e && typeof e === 'object' && 'message' in e ? (e.message as string) : `${e}`,
					name: i.name,
					fullError: ['UNKNOWN', e],
				});
			}
		}

		return { errors, options };
	}
}
