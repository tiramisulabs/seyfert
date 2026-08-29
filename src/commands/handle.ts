import type { Client, WorkerClient } from '../client';
import { runContextScopes, runPluginAutocompleteWrappers, runPluginCommandObservers } from '../client/plugins';
import { type MessageStructure, type OptionResolverStructure, Transformers } from '../client/transformers';
import { type Awaitable, type MakeRequired, type PermissionStrings, SeyfertError } from '../common';
import { INTEGER_OPTION_VALUE_LIMIT } from '../common/it/constants';
import { ComponentContext, ModalContext } from '../components';
import {
	type __InternalReplyFunction,
	AutocompleteInteraction,
	BaseInteraction,
	type ChatInputCommandInteraction,
	type ComponentInteraction,
	type EntryPointInteraction,
	type MessageCommandInteraction,
	type ModalSubmitInteraction,
	type UserCommandInteraction,
} from '../structures';
import type { PermissionsBitField } from '../structures/extra/Permissions';
import {
	type APIApplicationCommandInteraction,
	type APIApplicationCommandInteractionDataBasicOption,
	type APIApplicationCommandInteractionDataOption,
	type APIGuildMember,
	type APIInteraction,
	type APIInteractionDataResolvedChannel,
	ApplicationCommandOptionType,
	ApplicationCommandType,
	ChannelType,
	type GatewayMessageCreateDispatchData,
	InteractionContextType,
	InteractionType,
	RESTJSONErrorCodes,
} from '../types';
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
	type ResolvedRegisteredMiddlewares,
	type SeyfertChannelOption,
	type SeyfertIntegerOption,
	type SeyfertNumberOption,
	type SeyfertStringOption,
	SubCommand,
	type UsingClient,
} from '.';

export type CommandOptionWithType = CommandOption & {
	type: ApplicationCommandOptionType;
};

export interface CommandFromContent {
	command?: Command | SubCommand;
	parent?: Command;
	fullCommandName: string;
}

type MessageCommandOptionParseError = {
	name: string;
	error: string;
	fullError: MessageCommandOptionErrors;
};

type BotPermissionCheckCommand = Command | SubCommand | ContextMenuCommand | EntryPointCommand;
type BotPermissionCheckContext<C extends BotPermissionCheckCommand> = C extends Command | SubCommand
	? CommandContext
	: C extends ContextMenuCommand
		? MenuCommandContext<MessageCommandInteraction | UserCommandInteraction>
		: EntryPointContext;

export class HandleCommand {
	constructor(public client: UsingClient) {}

	async autocomplete(
		interaction: AutocompleteInteraction,
		optionsResolver: OptionResolverStructure,
		command?: CommandAutocompleteOption,
	) {
		return runPluginAutocompleteWrappers(
			this.client,
			{ client: this.client, command, interaction, optionsResolver },
			() => this.runAutocomplete(interaction, optionsResolver, command),
		);
	}

	private async runAutocomplete(
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
			this.client.logger.error(`[${optionsResolver.fullCommandName}] Internal error:`, error);
		}
	}

	async contextMenu(
		command: ContextMenuCommand,
		interaction: MessageCommandInteraction | UserCommandInteraction,
		context: MenuCommandContext<MessageCommandInteraction | UserCommandInteraction>,
	) {
		return runContextScopes(this.client.options.contextScopes, context, async () => {
			try {
				if (context.guildId && command.botPermissions) {
					const missingPermissions = await this.checkBotPermissions(command, context, interaction.appPermissions);
					if (missingPermissions) return await command.onBotPermissionsFail?.(context, missingPermissions);
				}

				await command.onBeforeMiddlewares?.(context);
				await runPluginCommandObservers(this.client, 'onBeforeMiddlewares', context);
				const resultGlobal = await this.runGlobalMiddlewares(command, context);
				if (typeof resultGlobal === 'boolean') return;
				const resultMiddle = await this.runMiddlewares(command, context);
				if (typeof resultMiddle === 'boolean') return;

				try {
					await command.run!(context);
					await command.onAfterRun?.(context, undefined);
					await runPluginCommandObservers(this.client, 'onAfterRun', context, undefined);
				} catch (error) {
					await command.onRunError?.(context, error);
					await runPluginCommandObservers(this.client, 'onRunError', context, error);
					await command.onAfterRun?.(context, error);
					await runPluginCommandObservers(this.client, 'onAfterRun', context, error);
				}
			} catch (error) {
				try {
					await command.onInternalError?.(this.client, command, error);
					await runPluginCommandObservers(this.client, 'onInternalError', this.client, command, error);
				} catch (err) {
					this.client.logger.error(`[${command.name}] Internal error:`, err);
				}
			}
		});
	}

	contextMenuMessage(
		command: ContextMenuCommand,
		interaction: MessageCommandInteraction,
		context: MenuCommandContext<MessageCommandInteraction>,
	) {
		return this.contextMenu(command, interaction, context);
	}

	contextMenuUser(
		command: ContextMenuCommand,
		interaction: UserCommandInteraction,
		context: MenuCommandContext<UserCommandInteraction>,
	) {
		return this.contextMenu(command, interaction, context);
	}

	async entryPoint(command: EntryPointCommand, interaction: EntryPointInteraction, context: EntryPointContext) {
		return runContextScopes(this.client.options.contextScopes, context, async () => {
			try {
				if (context.guildId && command.botPermissions) {
					const missingPermissions = await this.checkBotPermissions(command, context, interaction.appPermissions);
					if (missingPermissions) return await command.onBotPermissionsFail(context, missingPermissions);
				}

				await command.onBeforeMiddlewares?.(context);
				await runPluginCommandObservers(this.client, 'onBeforeMiddlewares', context);
				const resultGlobal = await this.runGlobalMiddlewares(command, context);
				if (typeof resultGlobal === 'boolean') return;
				const resultMiddle = await this.runMiddlewares(command, context);
				if (typeof resultMiddle === 'boolean') return;

				try {
					await command.run!(context);
					await command.onAfterRun?.(context, undefined);
					await runPluginCommandObservers(this.client, 'onAfterRun', context, undefined);
				} catch (error) {
					await command.onRunError(context, error);
					await runPluginCommandObservers(this.client, 'onRunError', context, error);
					await command.onAfterRun?.(context, error);
					await runPluginCommandObservers(this.client, 'onAfterRun', context, error);
				}
			} catch (error) {
				try {
					await command.onInternalError(this.client, command, error);
					await runPluginCommandObservers(this.client, 'onInternalError', this.client, command, error);
				} catch (err) {
					this.client.logger.error(`[${command.name}] Internal error:`, err);
				}
			}
		});
	}

	async chatInput(
		command: Command | SubCommand,
		interaction: ChatInputCommandInteraction,
		resolver: OptionResolverStructure,
		context: CommandContext,
	) {
		return runContextScopes(this.client.options.contextScopes, context, async () => {
			try {
				if (context.guildId) {
					if (command.botPermissions) {
						const missingPermissions = await this.checkBotPermissions(command, context, interaction.appPermissions);
						if (missingPermissions) return await command.onBotPermissionsFail?.(context, missingPermissions);
					}

					if (command.defaultMemberPermissions) {
						const missingPermissions = await this.checkMemberPermissions(
							command,
							context,
							interaction.member!.permissions,
						);
						if (missingPermissions) return await command.onPermissionsFail?.(context, missingPermissions);
					}
				}

				await command.onBeforeOptions?.(context);
				await runPluginCommandObservers(this.client, 'onBeforeOptions', context);
				if (!(await this.runOptions(command, context, resolver))) return;

				await command.onBeforeMiddlewares?.(context);
				await runPluginCommandObservers(this.client, 'onBeforeMiddlewares', context);
				const resultGlobal = await this.runGlobalMiddlewares(command, context);
				if (typeof resultGlobal === 'boolean') return;
				const resultMiddle = await this.runMiddlewares(command, context);
				if (typeof resultMiddle === 'boolean') return;

				try {
					await command.run!(context);
					await command.onAfterRun?.(context, undefined);
					await runPluginCommandObservers(this.client, 'onAfterRun', context, undefined);
				} catch (error) {
					await command.onRunError?.(context, error);
					await runPluginCommandObservers(this.client, 'onRunError', context, error);
					await command.onAfterRun?.(context, error);
					await runPluginCommandObservers(this.client, 'onAfterRun', context, error);
				}
			} catch (error) {
				try {
					await command.onInternalError?.(this.client, command, error);
					await runPluginCommandObservers(this.client, 'onInternalError', this.client, command, error);
				} catch (err) {
					this.client.logger.error(`[${command.name}] Internal error:`, err);
				}
			}
		});
	}

	async modal(interaction: ModalSubmitInteraction) {
		const context = new ModalContext(this.client, interaction);
		const extended = this.client.options?.context?.(interaction) ?? {};
		Object.assign(context, extended);
		await this.client.components.executeModal(context);
	}

	async messageComponent(interaction: ComponentInteraction) {
		const context = new ComponentContext(this.client, interaction as never);
		const extended = this.client.options?.context?.(interaction) ?? {};
		Object.assign(context, extended);
		await this.client.components.executeComponent(context);
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
						await this.contextMenuMessage(
							data.command,
							data.interaction as MessageCommandInteraction,
							data.context as MenuCommandContext<MessageCommandInteraction>,
						);
						break;
					}
					case ApplicationCommandType.User: {
						const data = this.makeMenuCommand(body, shardId, __reply);
						if (!data) return;
						await this.contextMenuUser(
							data.command,
							data.interaction as UserCommandInteraction,
							data.context as MenuCommandContext<UserCommandInteraction>,
						);
						break;
					}
					case ApplicationCommandType.PrimaryEntryPoint: {
						const command = this.client.commands.entryPoint;
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
						const command = optionsResolver.getCommand();
						if (!command?.run)
							return this.client.logger.warn(`${optionsResolver.fullCommandName} command does not have 'run' callback`);
						const interaction = BaseInteraction.from(this.client, body, __reply) as ChatInputCommandInteraction;
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
					if (this.client.components.hasModal(interaction)) {
						await this.client.components.onModalSubmit(interaction);
					} else {
						this.client.components.restoreModalCustomId(interaction);
						await this.modal(interaction);
					}
				}
				break;
			case InteractionType.MessageComponent:
				{
					const interaction = BaseInteraction.from(this.client, body, __reply) as ComponentInteraction;
					if (this.client.components.hasComponent(body.message.id, interaction.customId)) {
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

		try {
			const args = this.argsParser(argsContent, command, message);
			const { options, errors } = await this.argsOptionsParser(command, rawMessage, args, resolved);
			const resolverOptions: APIApplicationCommandInteractionDataOption[] =
				command instanceof SubCommand
					? [
							command.group
								? {
										type: ApplicationCommandOptionType.SubcommandGroup,
										name: command.group,
										options: [{ type: ApplicationCommandOptionType.Subcommand, name: command.name, options }],
									}
								: { type: ApplicationCommandOptionType.Subcommand, name: command.name, options },
						]
					: options;
			const optionsResolver = this.makeResolver(
				self,
				resolverOptions,
				parent as Command,
				rawMessage.guild_id,
				resolved,
			);
			const context = new CommandContext(self, message, optionsResolver, shardId, command);
			const extendContext = self.options?.context?.(message as never) ?? {};
			Object.assign(context, extendContext);

			return await runContextScopes(self.options.contextScopes, context, async () => {
				if (errors.length) {
					return await command.onOptionsError?.(
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
						const missingPermissions = await this.checkMemberPermissions(command, context, memberPermissions);
						const guild = await this.client.guilds.raw(rawMessage.guild_id);
						if (missingPermissions && guild.owner_id !== rawMessage.author.id) {
							return await command.onPermissionsFail?.(context, missingPermissions);
						}
					}

					if (command.botPermissions) {
						const appPermissions = await self.members.permissions(rawMessage.guild_id, self.botId);
						const missingPermissions = await this.checkBotPermissions(command, context, appPermissions);
						if (missingPermissions) {
							return await command.onBotPermissionsFail?.(context, missingPermissions);
						}
					}
				}

				await command.onBeforeOptions?.(context);
				await runPluginCommandObservers(this.client, 'onBeforeOptions', context);
				if (!(await this.runOptions(command, context, optionsResolver))) return;

				await command.onBeforeMiddlewares?.(context);
				await runPluginCommandObservers(this.client, 'onBeforeMiddlewares', context);
				const resultGlobal = await this.runGlobalMiddlewares(command, context);
				if (typeof resultGlobal === 'boolean') return;
				const resultMiddle = await this.runMiddlewares(command, context);
				if (typeof resultMiddle === 'boolean') return;
				try {
					await command.run!(context);
					await command.onAfterRun?.(context, undefined);
					await runPluginCommandObservers(this.client, 'onAfterRun', context, undefined);
				} catch (error) {
					await command.onRunError?.(context, error);
					await runPluginCommandObservers(this.client, 'onRunError', context, error);
					await command.onAfterRun?.(context, error);
					await runPluginCommandObservers(this.client, 'onAfterRun', context, error);
				}
			});
		} catch (error) {
			try {
				await command.onInternalError?.(this.client, command, error);
				await runPluginCommandObservers(this.client, 'onInternalError', this.client, command, error);
			} catch (err) {
				this.client.logger.error(`[${command.name}] Internal error:`, err);
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
			_message.guild_id,
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

	getCommandFromContent(commandRaw: string[], guildId?: string): CommandFromContent {
		return this.resolveCommandFromNameParts(commandRaw, guildId);
	}

	/**
	 * Resolves a message command by its full name.
	 *
	 * Guild-scoped commands require a matching `guildId`; without one, they intentionally resolve to `undefined`.
	 */
	resolveByName(fullName: string, guildId?: string): CommandFromContent | undefined {
		const parts = fullName
			.trim()
			.split(/\s+/)
			.filter(x => x)
			.slice(0, 3);
		if (!parts.length) return undefined;

		const resolved = this.resolveCommandFromNameParts(parts, guildId, false);
		return resolved.command ? resolved : undefined;
	}

	private resolveCommandFromNameParts(
		commandRaw: string[],
		guildId?: string,
		allowFallback = true,
	): CommandFromContent {
		const rawParentName = commandRaw[0];
		const rawGroupName = commandRaw.length === 3 ? commandRaw[1] : undefined;
		const rawSubcommandName = rawGroupName ? commandRaw[2] : commandRaw[1];
		const parent = this.getParentMessageCommand(rawParentName, guildId);
		const fullCommandName = `${rawParentName}${
			rawGroupName ? ` ${rawGroupName} ${rawSubcommandName}` : `${rawSubcommandName ? ` ${rawSubcommandName}` : ''}`
		}`;

		if (!(parent instanceof Command)) return { fullCommandName };

		if (rawGroupName && !parent.groups?.[rawGroupName] && !parent.groupsAliases?.[rawGroupName]) {
			if (!allowFallback) return { fullCommandName };
			return this.resolveCommandFromNameParts([rawParentName, rawGroupName], guildId);
		}
		if (
			rawSubcommandName &&
			!parent.options?.some(
				x => x instanceof SubCommand && (x.name === rawSubcommandName || x.aliases?.includes(rawSubcommandName)),
			)
		) {
			if (!allowFallback) return { fullCommandName };
			return this.resolveCommandFromNameParts([rawParentName], guildId);
		}

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

	makeResolver(...args: Parameters<(typeof Transformers)['OptionResolver']>): OptionResolverStructure {
		return Transformers.OptionResolver(...args);
	}

	getParentMessageCommand(rawParentName: string, guildId?: string) {
		return this.client.commands.values.find(
			x =>
				(!('ignore' in x) || x.ignore !== IgnoreCommand.Message) &&
				this.commandCanRunInGuild(x, guildId) &&
				(x.name === rawParentName || ('aliases' in x ? x.aliases?.includes(rawParentName) : false)),
		);
	}

	private commandCanRunInGuild(command: Command | ContextMenuCommand, guildId?: string) {
		if (!command.guildId?.length) return true;
		return guildId ? command.guildId.includes(guildId) : false;
	}

	getCommand<T extends Command | ContextMenuCommand | EntryPointCommand>(data: {
		guild_id?: string;
		name: string;
	}): T | undefined {
		return this.client.commands.values.find(command => {
			if (data.guild_id) {
				return command.guildId?.includes(data.guild_id) && command.name === data.name;
			}
			return command.name === data.name;
		}) as T;
	}

	/**
	 * Checks the member permissions required by a command.
	 *
	 * @remarks
	 * This method runs for guild executions when the command declares `defaultMemberPermissions`.
	 * Override it to customize member permission checks; overrides can return synchronously or asynchronously.
	 * Thrown errors and rejected promises are routed through the command's internal error handler.
	 *
	 * @param command - The command whose member permissions are being checked.
	 * @param _context - The context of the command execution.
	 * @param heldPermissions - The permissions currently held by the member.
	 * @returns The missing permission names, or `undefined` when command execution can continue.
	 */
	checkMemberPermissions(
		command: Command | SubCommand,
		_context: CommandContext,
		heldPermissions: PermissionsBitField,
	): Awaitable<PermissionStrings | undefined> {
		if (!command.defaultMemberPermissions) return;
		return this.checkPermissions(heldPermissions, command.defaultMemberPermissions);
	}

	/**
	 * Checks the bot permissions required by a command.
	 *
	 * @remarks
	 * This method runs for guild executions when the command declares `botPermissions`.
	 * Override it to customize bot permission checks; overrides can return synchronously or asynchronously.
	 * Thrown errors and rejected promises are routed through the command's internal error handler.
	 *
	 * @param command - The command whose bot permissions are being checked.
	 * @param _context - The context of the command execution.
	 * @param heldPermissions - The permissions currently held by the bot.
	 * @returns The missing permission names, or `undefined` when command execution can continue.
	 */
	checkBotPermissions<C extends BotPermissionCheckCommand>(
		command: C,
		_context: BotPermissionCheckContext<C>,
		heldPermissions: PermissionsBitField,
	): Awaitable<PermissionStrings | undefined> {
		if (!command.botPermissions) return;
		return this.checkPermissions(heldPermissions, command.botPermissions);
	}

	checkPermissions(heldPermissions: PermissionsBitField, requiredPermissions: bigint) {
		if (heldPermissions.has(['Administrator'])) return;

		const missingPermissions = heldPermissions.missings(heldPermissions.values([requiredPermissions]));
		if (missingPermissions.length) {
			return heldPermissions.keys(missingPermissions);
		}
		return;
	}

	fetchChannel(_option: CommandOptionWithType, query: string) {
		const id = query.match(/[0-9]{17,19}/g)?.[0];
		if (id) return this.client.channels.raw(id);
		return null;
	}

	fetchUser(_option: CommandOptionWithType, query: string) {
		const id = query.match(/[0-9]{17,19}/g)?.[0];
		if (id) return this.client.users.raw(id);
		return null;
	}

	async fetchMember(_option: CommandOptionWithType, query: string, guildId: string): Promise<APIGuildMember | null> {
		const id = query.match(/[0-9]{17,19}/g)?.[0];
		if (!id) return null;

		try {
			return await this.client.members.raw(guildId, id);
		} catch (error) {
			const response = SeyfertError.is(error) ? error.metadata?.response : undefined;
			if (
				typeof response === 'object' &&
				response !== null &&
				'code' in response &&
				[RESTJSONErrorCodes.UnknownMember, RESTJSONErrorCodes.UnknownUser].includes(response.code as RESTJSONErrorCodes)
			) {
				return null;
			}
			throw error;
		}
	}

	fetchRole(_option: CommandOptionWithType, query: string, guildId?: string) {
		const id = query.match(/[0-9]{17,19}/g)?.[0];
		if (id && guildId) return this.client.roles.raw(guildId, id);
		return null;
	}

	async runGlobalMiddlewares(
		command: Command | ContextMenuCommand | SubCommand | EntryPointCommand,
		context: CommandContext<{}, never> | MenuCommandContext<any> | EntryPointContext,
	) {
		try {
			const resultRunGlobalMiddlewares = await BaseCommand.__runMiddlewares(
				context,
				(this.client.options?.globalMiddlewares ?? []) as readonly (keyof ResolvedRegisteredMiddlewares)[],
				true,
			);
			if (resultRunGlobalMiddlewares.pass) {
				return false;
			}
			if ('error' in resultRunGlobalMiddlewares) {
				const metadata = resultRunGlobalMiddlewares.metadata ?? { middleware: 'unknown', scope: 'global' as const };
				await command.onMiddlewaresError?.(
					context as never,
					resultRunGlobalMiddlewares.error ?? 'Unknown error',
					metadata,
				);
				await runPluginCommandObservers(
					this.client,
					'onMiddlewaresError',
					context as never,
					resultRunGlobalMiddlewares.error ?? 'Unknown error',
					metadata,
				);
				return false;
			}
			return resultRunGlobalMiddlewares;
		} catch (e) {
			try {
				await command.onInternalError?.(this.client, command as never, e);
				await runPluginCommandObservers(this.client, 'onInternalError', this.client, command as never, e);
			} catch (err) {
				this.client.logger.error(`[${command.name}] Internal error:`, err);
			}
		}
		return false;
	}

	async runMiddlewares(
		command: Command | ContextMenuCommand | SubCommand | EntryPointCommand,
		context: CommandContext<{}, never> | MenuCommandContext<any> | EntryPointContext,
	) {
		try {
			const resultRunMiddlewares = await BaseCommand.__runMiddlewares(context, command.middlewares, false);
			if (resultRunMiddlewares.pass) {
				return false;
			}
			if ('error' in resultRunMiddlewares) {
				const metadata = resultRunMiddlewares.metadata ?? { middleware: 'unknown', scope: 'command' as const };
				await command.onMiddlewaresError?.(context as never, resultRunMiddlewares.error ?? 'Unknown error', metadata);
				await runPluginCommandObservers(
					this.client,
					'onMiddlewaresError',
					context as never,
					resultRunMiddlewares.error ?? 'Unknown error',
					metadata,
				);
				return false;
			}
			return resultRunMiddlewares;
		} catch (e) {
			try {
				await command.onInternalError?.(this.client, command as never, e);
				await runPluginCommandObservers(this.client, 'onInternalError', this.client, command as never, e);
			} catch (err) {
				this.client.logger.error(`[${command.name}] Internal error:`, err);
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
			await command.onOptionsError?.(context, result);
			return false;
		}
		return true;
	}

	private async resolveChannelOption(
		option: CommandOptionWithType,
		message: GatewayMessageCreateDispatchData,
		argument: string,
		resolved: MakeRequired<ContextOptionsResolved>,
		errors: MessageCommandOptionParseError[],
	) {
		const rawQuery = message.content.match(/(?<=<#)[0-9]{17,19}(?=>)/g)?.find(id => argument.includes(id)) || argument;
		const channel = (await this.client.cache.channels?.raw(rawQuery)) ?? (await this.fetchChannel(option, rawQuery));
		if (!channel) return;

		if ('channel_types' in option) {
			const channelTypes = (option as SeyfertChannelOption).channel_types!;
			if (!channelTypes.includes(channel.type)) {
				errors.push({
					name: option.name,
					error: `The entered channel type is not one of ${channelTypes.map(type => ChannelType[type]).join(', ')}`,
					fullError: ['CHANNEL_TYPES', channelTypes],
				});
				return;
			}
		}

		//discord funny memoentnt!!!!!!!!
		resolved.channels[channel.id] = channel as APIInteractionDataResolvedChannel;
		return channel.id;
	}

	private async resolveMentionableOption(
		option: CommandOptionWithType,
		message: GatewayMessageCreateDispatchData,
		argument: string,
		resolved: MakeRequired<ContextOptionsResolved>,
	) {
		const matches = argument.match(/<@[0-9]{17,19}(?=>)|<@&[0-9]{17,19}(?=>)/g) ?? [];
		for (const match of matches) {
			if (match.includes('&')) {
				const rawId = match.slice(3);
				if (rawId) {
					const role =
						(await this.client.cache.roles?.raw(rawId)) ?? (await this.fetchRole(option, rawId, message.guild_id));
					if (role) {
						resolved.roles[rawId] = role;
						return rawId;
					}
				}
			} else {
				const rawId = match.slice(2);
				const raw = message.mentions.find(mention => rawId === mention.id);
				if (raw) {
					const { member, ...user } = raw;
					resolved.users[raw.id] = user;
					if (member) resolved.members[raw.id] = member;
					return raw.id;
				}
			}
		}
		return;
	}

	private async resolveRoleOption(
		option: CommandOptionWithType,
		message: GatewayMessageCreateDispatchData,
		argument: string,
		resolved: MakeRequired<ContextOptionsResolved>,
	) {
		const rawQuery = message.mention_roles.find(id => argument.includes(id)) || argument;
		const role =
			(await this.client.cache.roles?.raw(rawQuery)) ?? (await this.fetchRole(option, rawQuery, message.guild_id));
		if (!role) return;

		resolved.roles[role.id] = role;
		return role.id;
	}

	private async resolveUserOption(
		option: CommandOptionWithType,
		message: GatewayMessageCreateDispatchData,
		argument: string,
		resolved: MakeRequired<ContextOptionsResolved>,
	) {
		const mentionedUser = message.mentions.find(mention => argument.includes(mention.id));
		const rawQuery = mentionedUser?.id || argument;
		const raw =
			mentionedUser ?? (await this.client.cache.users?.raw(rawQuery)) ?? (await this.fetchUser(option, rawQuery));
		if (!raw) return;

		resolved.users[raw.id] = raw;
		if (message.guild_id) {
			const member =
				mentionedUser?.member ??
				(await this.client.cache.members?.raw(raw.id, message.guild_id)) ??
				(await this.fetchMember(option, raw.id, message.guild_id));
			if (member) resolved.members[raw.id] = member;
		}
		return raw.id;
	}

	private resolveStringOption(
		option: SeyfertStringOption & { name: string },
		argument: string,
		errors: MessageCommandOptionParseError[],
	) {
		if (option.choices?.length) {
			const choice = option.choices.find(choice => choice.name === argument);
			if (!choice) {
				errors.push({
					name: option.name,
					error: `The entered choice is invalid. Please choose one of the following options: ${option.choices
						.map(choice => choice.name)
						.join(', ')}`,
					fullError: ['STRING_INVALID_CHOICE', option.choices],
				});
				return;
			}
			return choice.value;
		}
		if (option.min_length !== undefined && argument.length < option.min_length) {
			errors.push({
				name: option.name,
				error: `The entered string has less than ${option.min_length} characters. The minimum required is ${option.min_length} characters`,
				fullError: ['STRING_MIN_LENGTH', option.min_length],
			});
			return;
		}
		if (option.max_length !== undefined && argument.length > option.max_length) {
			errors.push({
				name: option.name,
				error: `The entered string has more than ${option.max_length} characters. The maximum required is ${option.max_length} characters`,
				fullError: ['STRING_MAX_LENGTH', option.max_length],
			});
			return;
		}
		return argument;
	}

	private resolveNumericOption(
		option: (SeyfertNumberOption | SeyfertIntegerOption) & { name: string; type: ApplicationCommandOptionType },
		argument: string,
		errors: MessageCommandOptionParseError[],
	) {
		if (option.choices?.length) {
			const choice = option.choices.find(choice => choice.name === argument);
			if (!choice) {
				errors.push({
					name: option.name,
					error: `The entered choice is invalid. Please choose one of the following options: ${option.choices
						.map(choice => choice.name)
						.join(', ')}`,
					fullError: ['NUMBER_INVALID_CHOICE', option.choices],
				});
				return;
			}
			return choice.value;
		}

		const value =
			option.type === ApplicationCommandOptionType.Integer ? Math.trunc(Number(argument)) : Number(argument);
		if (Number.isNaN(value)) {
			errors.push({
				name: option.name,
				error: 'The entered choice is an invalid number',
				fullError: ['NUMBER_NAN', argument],
			});
			return;
		}
		if (value <= -INTEGER_OPTION_VALUE_LIMIT || value >= INTEGER_OPTION_VALUE_LIMIT) {
			errors.push({
				name: option.name,
				error: 'The entered number must be between -2^53 and 2^53',
				fullError: ['NUMBER_OUT_OF_BOUNDS', INTEGER_OPTION_VALUE_LIMIT],
			});
			return;
		}
		if (option.min_value !== undefined && value < option.min_value) {
			errors.push({
				name: option.name,
				error: `The entered number is less than ${option.min_value}. The minimum allowed is ${option.min_value}`,
				fullError: ['NUMBER_MIN_VALUE', option.min_value],
			});
			return;
		}
		if (option.max_value !== undefined && value > option.max_value) {
			errors.push({
				name: option.name,
				error: `The entered number is greater than ${option.max_value}. The maximum allowed is ${option.max_value}`,
				fullError: ['NUMBER_MAX_VALUE', option.max_value],
			});
			return;
		}
		return value;
	}

	async argsOptionsParser(
		command: Command | SubCommand,
		message: GatewayMessageCreateDispatchData,
		args: Record<string, string>,
		resolved: MakeRequired<ContextOptionsResolved>,
	) {
		const options: APIApplicationCommandInteractionDataBasicOption[] = [];
		const errors: MessageCommandOptionParseError[] = [];
		let indexAttachment = -1;
		for (const i of (command.options ?? []) as (CommandOption & {
			type: ApplicationCommandOptionType;
		})[]) {
			try {
				if (!args[i.name] && i.type !== ApplicationCommandOptionType.Attachment) continue;
				const argument = args[i.name];
				let value: string | boolean | number | undefined;
				switch (i.type) {
					case ApplicationCommandOptionType.Attachment:
						if (message.attachments[++indexAttachment]) {
							value = message.attachments[indexAttachment].id;
							resolved.attachments[value] = message.attachments[indexAttachment];
						}
						break;
					case ApplicationCommandOptionType.Boolean:
						value = ['yes', 'y', 'true', 'treu'].includes(argument.toLowerCase());
						break;
					case ApplicationCommandOptionType.Channel:
						value = await this.resolveChannelOption(i, message, argument, resolved, errors);
						break;
					case ApplicationCommandOptionType.Mentionable:
						value = await this.resolveMentionableOption(i, message, argument, resolved);
						break;
					case ApplicationCommandOptionType.Role:
						value = await this.resolveRoleOption(i, message, argument, resolved);
						break;
					case ApplicationCommandOptionType.User:
						value = await this.resolveUserOption(i, message, argument, resolved);
						break;
					case ApplicationCommandOptionType.String:
						value = this.resolveStringOption(i as SeyfertStringOption & { name: string }, argument, errors);
						break;
					case ApplicationCommandOptionType.Number:
					case ApplicationCommandOptionType.Integer:
						value = this.resolveNumericOption(
							i as (SeyfertNumberOption | SeyfertIntegerOption) & {
								name: string;
								type: ApplicationCommandOptionType;
							},
							argument,
							errors,
						);
						break;
				}
				if (value !== undefined) {
					options.push({
						name: i.name,
						type: i.type,
						value,
					} as APIApplicationCommandInteractionDataBasicOption);
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
