import { ApplicationCommandType, InteractionType, type APIInteraction } from 'discord-api-types/v10';
import { CommandContext, MenuCommandContext, OptionResolver, type Command, type ContextMenuCommand } from '../commands';
import type {
	ChatInputCommandInteraction,
	ComponentInteraction,
	MessageCommandInteraction,
	ModalSubmitInteraction,
	UserCommandInteraction,
	__InternalReplyFunction,
} from '../structures';
import { AutocompleteInteraction, BaseInteraction } from '../structures';
import type { BaseClient } from './base';

export async function onInteractionCreate(
	self: BaseClient,
	body: APIInteraction,
	shardId: number,
	__reply?: __InternalReplyFunction,
) {
	self.debugger?.debug(`[${InteractionType[body.type] ?? body.type}] Interaction received.`);
	switch (body.type) {
		case InteractionType.ApplicationCommandAutocomplete:
			{
				const parentCommand = self.commands.values.find(x => {
					if (x.guild_id && !x.guild_id.includes(body.data.guild_id ?? '')) {
						return false;
					}
					return x.name === body.data.name;
				});
				const optionsResolver = new OptionResolver(
					self,
					body.data.options ?? [],
					parentCommand as Command,
					body.data.guild_id,
					body.data.resolved,
				);
				const interaction = new AutocompleteInteraction(self, body, __reply);
				const command = optionsResolver.getAutocomplete();

				// idc, is a YOU problem
				if (!command?.autocomplete)
					return self.logger.warn(
						`${optionsResolver.fullCommandName} ${command?.name} command does not have 'autocomplete' callback`,
					);
				try {
					try {
						await command.autocomplete(interaction);
					} catch (error) {
						if (!command.onAutocompleteError)
							return self.logger.error(
								`${optionsResolver.fullCommandName} ${command.name} just threw an error, ${
									error ? (typeof error === 'object' && 'message' in error ? error.message : error) : 'Unknown'
								}`,
							);
						await command.onAutocompleteError(interaction, error);
					}
				} catch (error) {
					try {
						await optionsResolver.getCommand()?.onInternalError?.(self, error);
					} catch {
						// supress error
					}
				}
			}
			break;
		case InteractionType.ApplicationCommand:
			{
				switch (body.data.type) {
					case ApplicationCommandType.Message:
					case ApplicationCommandType.User:
						{
							const command = self.commands.values.find(x => {
								if (x.guild_id && !x.guild_id.includes(body.data.guild_id ?? '')) {
									return false;
								}
								return x.name === body.data.name;
							}) as ContextMenuCommand;
							const interaction = BaseInteraction.from(self, body, __reply) as
								| UserCommandInteraction
								| MessageCommandInteraction;
							// idc, is a YOU problem
							if (!command?.run)
								return self.logger.warn(`${command.name ?? 'Unknown'} command does not have 'run' callback`);
							const context = new MenuCommandContext(self, interaction, shardId);
							const extendContext = self.options?.context?.(interaction) ?? {};
							Object.assign(context, extendContext);
							try {
								if (command.botPermissions && interaction.appPermissions) {
									const permissions = interaction.appPermissions.missings(
										...interaction.appPermissions.values(command.botPermissions),
									);
									if (permissions.length) {
										return command.onPermissionsFail?.(context, interaction.appPermissions.keys(permissions));
									}
								}
								const resultRunGlobalMiddlewares = await command.__runGlobalMiddlewares(context);
								if (resultRunGlobalMiddlewares.pass) {
									return;
								}
								if ('error' in resultRunGlobalMiddlewares) {
									return command.onMiddlewaresError(context, resultRunGlobalMiddlewares.error ?? 'Unknown error');
								}

								const resultRunMiddlewares = await command.__runMiddlewares(context);
								if (resultRunMiddlewares.pass) {
									return;
								}
								if ('error' in resultRunMiddlewares) {
									return command.onMiddlewaresError(context, resultRunMiddlewares.error ?? 'Unknown error');
								}

								try {
									await command.run(context);
									await command.onAfterRun?.(context, undefined);
								} catch (error) {
									await command.onRunError?.(context, error);
									await command.onAfterRun?.(context, error);
								}
							} catch (error) {
								try {
									await command.onInternalError(self, error);
								} catch {
									// supress error
								}
							}
						}
						break;
					case ApplicationCommandType.ChatInput:
						{
							const packetData = body.data;
							const parentCommand = self.commands.values.find(x => {
								if (x.guild_id && !x.guild_id.includes(packetData.guild_id ?? '')) {
									return false;
								}
								return x.name === packetData.name;
							});
							const optionsResolver = new OptionResolver(
								self,
								packetData.options ?? [],
								parentCommand as Command,
								packetData.guild_id,
								packetData.resolved,
							);
							const interaction = BaseInteraction.from(self, body, __reply) as ChatInputCommandInteraction;
							const command = optionsResolver.getCommand();
							if (!command?.run)
								return self.logger.warn(`${optionsResolver.fullCommandName} command does not have 'run' callback`);
							const context = new CommandContext(self, interaction, optionsResolver, shardId);
							const extendContext = self.options?.context?.(interaction) ?? {};
							Object.assign(context, extendContext);
							try {
								if (command.botPermissions && interaction.appPermissions) {
									const permissions = interaction.appPermissions.missings(
										...interaction.appPermissions.values(command.botPermissions),
									);
									if (permissions.length) {
										return command.onPermissionsFail?.(context, interaction.appPermissions.keys(permissions));
									}
								}
								const [erroredOptions, result] = await command.__runOptions(context, optionsResolver);
								if (erroredOptions) {
									return command.onOptionsError?.(context, result);
								}
								const resultRunGlobalMiddlewares = await command.__runGlobalMiddlewares(context);
								if (resultRunGlobalMiddlewares.pass) {
									return;
								}
								if ('error' in resultRunGlobalMiddlewares) {
									return command.onMiddlewaresError?.(context, resultRunGlobalMiddlewares.error ?? 'Unknown error');
								}
								const resultRunMiddlewares = await command.__runMiddlewares(context);
								if (resultRunMiddlewares.pass) {
									return;
								}
								if ('error' in resultRunMiddlewares) {
									return command.onMiddlewaresError?.(context, resultRunMiddlewares.error ?? 'Unknown error');
								}

								try {
									await command.run(context);
									await command.onAfterRun?.(context, undefined);
								} catch (error) {
									await command.onRunError?.(context, error);
									await command.onAfterRun?.(context, error);
								}
							} catch (error) {
								try {
									await command.onInternalError?.(self, error);
								} catch {
									// supress error
								}
							}
						}
						break;
				}
			}
			break;

		case InteractionType.ModalSubmit:
			{
				const interaction = BaseInteraction.from(self, body, __reply) as ModalSubmitInteraction;
				if (self.components.hasModal(interaction)) {
					await self.components.onModalSubmit(interaction);
				} else {
					await self.components.executeModal(interaction);
				}
			}
			break;
		case InteractionType.MessageComponent:
			{
				const interaction = BaseInteraction.from(self, body, __reply) as ComponentInteraction;
				if (self.components.hasComponent(body.message.interaction?.id ?? body.message.id, interaction.customId)) {
					await self.components.onComponent(body.message.interaction?.id ?? body.message.id, interaction);
				} else {
					await self.components.executeComponent(interaction);
				}
			}
			break;
	}
}
