import {
	type APIApplicationCommandInteraction,
	ApplicationCommandType,
	InteractionType,
	type APIInteraction,
} from 'discord-api-types/v10';
import {
	type Command,
	type ContextOptionsResolved,
	OptionResolver,
	type UsingClient,
	type CommandAutocompleteOption,
	type ContextMenuCommand,
	MenuCommandContext,
	BaseCommand,
	CommandContext,
	type RegisteredMiddlewares,
	type SubCommand,
} from '../commands';
import {
	AutocompleteInteraction,
	BaseInteraction,
	type ComponentInteraction,
	type ModalSubmitInteraction,
	type ChatInputCommandInteraction,
	type MessageCommandInteraction,
	type UserCommandInteraction,
	type __InternalReplyFunction,
} from '../structures';
import type { PermissionsBitField } from '../structures/extra/Permissions';
import { ComponentContext, ModalContext } from '../components';

export interface CustomResolver {}

export type HandleResolver<C = CustomResolver, D = typeof OptionResolver> = keyof C extends never ? D : C;

export class HandleCommand<HR extends HandleResolver = HandleResolver> {
	optionsResolver: HR;
	constructor(
		public client: UsingClient,
		optionsResolver: HR,
	) {
		this.optionsResolver = optionsResolver ?? OptionResolver;
	}

	async autocomplete(
		interaction: AutocompleteInteraction,
		optionsResolver: InstanceType<HR>,
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
				await command.onInternalError(this.client, error);
			} catch {
				// pass
			}
		}
	}

	async chatInput(
		command: Command | SubCommand,
		interaction: ChatInputCommandInteraction,
		resolver: InstanceType<HR>,
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

	makeResolver<T extends unknown[] = []>(...args: [...ConstructorParameters<typeof OptionResolver>, ...T]) {
		// @ts-expect-error
		return new this.optionsResolver(...args) as InstanceType<HR>;
	}

	getCommand<T extends Command | ContextMenuCommand>(data: {
		guild_id?: string;
		name: string;
	}): T {
		// @ts-expect-error
		return this.client.commands?.values.find(command => {
			if (data.guild_id) {
				return command.guildId?.includes(data.guild_id) && command.name === data.name;
			}
			return command.name === data.name;
		});
	}

	checkPermissions(app: PermissionsBitField, bot: bigint) {
		const permissions = app.missings(...app.values([bot]));
		if (!app.has('Administrator') && permissions.length) {
			return app.keys(permissions);
		}
		return false;
	}

	async runGlobalMiddlewares(
		command: Command | ContextMenuCommand | SubCommand,
		context: CommandContext<{}, never> | MenuCommandContext<any>,
	) {
		const resultRunGlobalMiddlewares = await BaseCommand.__runMiddlewares(
			context,
			(this.client.options?.globalMiddlewares ?? []) as keyof RegisteredMiddlewares,
			true,
		);
		if (resultRunGlobalMiddlewares.pass) {
			return true;
		}
		if ('error' in resultRunGlobalMiddlewares) {
			// @ts-expect-error
			await command.onMiddlewaresError(context, resultRunGlobalMiddlewares.error ?? 'Unknown error');
			return;
		}
		return resultRunGlobalMiddlewares;
	}

	async runMiddlewares(
		command: Command | ContextMenuCommand | SubCommand,
		context: CommandContext<{}, never> | MenuCommandContext<any>,
	) {
		const resultRunMiddlewares = await BaseCommand.__runMiddlewares(
			context,
			command.middlewares as keyof RegisteredMiddlewares,
			false,
		);
		if (resultRunMiddlewares.pass) {
			return false;
		}
		if ('error' in resultRunMiddlewares) {
			// @ts-expect-error
			await command.onMiddlewaresError(context, resultRunMiddlewares.error ?? 'Unknown error');
			return;
		}
		return resultRunMiddlewares;
	}

	makeMenuCommand(body: APIApplicationCommandInteraction, shardId: number, __reply?: __InternalReplyFunction) {
		const command = this.getCommand<ContextMenuCommand>(body.data);
		const interaction = BaseInteraction.from(this.client, body, __reply) as
			| UserCommandInteraction
			| MessageCommandInteraction;
		// idc, is a YOU problem
		if (!command?.run)
			return this.client.logger.warn(`${command.name ?? 'Unknown'} command does not have 'run' callback`);
		const context = new MenuCommandContext(this.client, interaction, shardId, command);
		const extendContext = this.client.options?.context?.(interaction) ?? {};
		Object.assign(context, extendContext);

		return { command, interaction, context };
	}

	async runOptions(command: Command | SubCommand, context: CommandContext, resolver: InstanceType<HR>) {
		const [erroredOptions, result] = await command.__runOptions(context, resolver);
		if (erroredOptions) {
			command.onOptionsError?.(context, result);
			return false;
		}
		return true;
	}
}
