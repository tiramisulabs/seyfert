import {
	ApplicationCommandOptionType,
	ChannelType,
	type APIApplicationCommandInteractionDataOption,
	type GatewayMessageCreateDispatchData,
} from 'discord-api-types/v10';
import {
	Command,
	CommandContext,
	IgnoreCommand,
	InteractionContextTypes,
	OptionResolver,
	SubCommand,
	User,
	type Client,
	type CommandOption,
	type ContextOptionsResolved,
	type SeyfertChannelOption,
	type SeyfertIntegerOption,
	type SeyfertNumberOption,
	type SeyfertStringOption,
	type WorkerClient,
} from '..';
import type { MakeRequired } from '../common';
import { Message } from '../structures';

function getCommandFromContent(
	commandRaw: string[],
	self: Client | WorkerClient,
): {
	command?: Command | SubCommand;
	parent?: Command;
	fullCommandName: string;
} {
	const parentName = commandRaw[0];
	const groupName = commandRaw.length === 3 ? commandRaw[1] : undefined;
	const subcommandName = groupName ? commandRaw[2] : commandRaw[1];
	const parent = self.commands!.values.find(
		x => (!('ignore' in x) || x.ignore !== IgnoreCommand.Message) && x.name === parentName,
	);
	const fullCommandName = `${parentName}${
		groupName ? ` ${groupName} ${subcommandName}` : `${subcommandName ? ` ${subcommandName}` : ''}`
	}`;

	if (!(parent instanceof Command)) return { fullCommandName };

	if (groupName && !parent.groups?.[groupName!]) return getCommandFromContent([parentName, groupName], self);
	if (subcommandName && !parent.options?.some(x => x instanceof SubCommand && x.name === subcommandName))
		return getCommandFromContent([parentName], self);

	const command =
		groupName || subcommandName
			? (parent.options?.find(opt => {
					if (opt instanceof SubCommand) {
						if (groupName) {
							if (opt.group !== groupName) return false;
						}
						if (opt.group && !groupName) return false;
						return subcommandName === opt.name;
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

export async function onMessageCreate(
	self: Client | WorkerClient,
	rawMessage: GatewayMessageCreateDispatchData,
	shardId: number,
) {
	if (!self.options?.commands) return;
	const message = new Message(self, rawMessage);
	const prefixes = (await self.options.commands.prefix(message)).sort((a, b) => b.length - a.length);
	const prefix = prefixes.find(x => message.content.startsWith(x));

	if (!prefix || !message.content.startsWith(prefix)) return;

	const content = message.content.slice(prefix.length).trimStart();
	const { fullCommandName, command, parent } = getCommandFromContent(
		content
			.split(' ')
			.filter(x => x)
			.slice(0, 3),
		self,
	);

	if (!command) return;
	if (!command.run) return self.logger.warn(`${fullCommandName} command does not have 'run' callback`);

	if (!command.contexts?.includes(InteractionContextTypes.BOT_DM) && !message.guildId) return;
	if (command.guildId && !command.guildId?.includes(message.guildId!)) return;

	const resolved: MakeRequired<ContextOptionsResolved> = {
		channels: {},
		roles: {},
		users: {},
		members: {},
		attachments: {},
	};
	const args = (self.options?.commands?.argsParser ?? defaultArgsParser)(content, command);
	const { options, errors } = await parseOptions(self, command, rawMessage, args, resolved);
	const optionsResolver = new OptionResolver(self, options, parent as Command, message.guildId, resolved);
	const context = new CommandContext(self, message, optionsResolver, shardId, command);
	//@ts-expect-error
	const extendContext = self.options?.context?.(message) ?? {};
	Object.assign(context, extendContext);
	try {
		if (command.defaultMemberPermissions && message.guildId) {
			const memberPermissions = await self.members.permissions(message.guildId, message.author.id);
			const permissions = memberPermissions.missings(...memberPermissions.values([command.defaultMemberPermissions]));
			if (
				!memberPermissions.has('Administrator') &&
				permissions.length &&
				(await message.guild())!.ownerId !== message.author.id
			) {
				return command.onPermissionsFail?.(context, memberPermissions.keys(permissions));
			}
		}
		if (command.botPermissions && message.guildId) {
			const meMember = await self.cache.members?.get(self.botId, message.guildId);
			if (!meMember) return; //enable member cache and "Guilds" intent, lol
			const appPermissions = await meMember.fetchPermissions();
			const permissions = appPermissions.missings(...appPermissions.values([command.botPermissions]));
			if (!appPermissions.has('Administrator') && permissions.length) {
				return command.onBotPermissionsFail?.(context, appPermissions.keys(permissions));
			}
		}
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
							},
						];
					}),
				),
			);
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
			await command.run?.(context);
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

async function parseOptions(
	self: Client | WorkerClient,
	command: Command | SubCommand,
	message: GatewayMessageCreateDispatchData,
	args: Partial<Record<string, string>>,
	resolved: MakeRequired<ContextOptionsResolved>,
) {
	const options: APIApplicationCommandInteractionDataOption[] = [];
	const errors: { name: string; error: string }[] = [];
	for (const i of (command.options ?? []) as (CommandOption & { type: ApplicationCommandOptionType })[]) {
		try {
			let value: string | boolean | number | undefined;
			let indexAttachment = -1;
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
						const rawId =
							message.content.match(/(?<=<#)[0-9]{17,19}(?=>)/g)?.find(x => args[i.name]?.includes(x)) ||
							args[i.name]?.match(/[0-9]{17,19}/g)?.[0];
						if (rawId) {
							const channel =
								(await self.cache.channels?.get(rawId)) ?? (i.required ? await self.channels.fetch(rawId) : undefined);
							if (channel) {
								if ('channel_types' in i) {
									if (!(i as SeyfertChannelOption).channel_types!.includes(channel.type)) {
										errors.push({
											name: i.name,
											error: `The entered channel type is not one of ${(i as SeyfertChannelOption)
												.channel_types!.map(t => ChannelType[t])
												.join(', ')}`,
										});
										break;
									}
								}
								value = rawId;
								resolved.channels[rawId] = channel;
							}
						}
					}
					break;
				case ApplicationCommandOptionType.Mentionable:
					{
						const matches = message.content.match(/<@[0-9]{17,19}(?=>)|<@&[0-9]{17,19}(?=>)/g) ?? [];
						for (const match of matches) {
							if (match.includes('&')) {
								const rawId = match.slice(3);
								if (rawId) {
									const role =
										(await self.cache.roles?.get(rawId)) ??
										(i.required ? (await self.roles.list(message.guild_id!)).find(x => x.id === rawId) : undefined);
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
						const rawId =
							message.mention_roles.find(x => args[i.name]?.includes(x)) || args[i.name]?.match(/[0-9]{17,19}/g)?.[0];
						if (rawId) {
							const role =
								(await self.cache.roles?.get(rawId)) ??
								(i.required ? (await self.roles.list(message.guild_id!)).find(x => x.id === rawId) : undefined);

							if (role) {
								value = rawId;
								resolved.roles[rawId] = role;
							}
						}
					}
					break;
				case ApplicationCommandOptionType.User:
					{
						const rawId =
							message.mentions.find(x => args[i.name]?.includes(x.id))?.id || args[i.name]?.match(/[0-9]{17,19}/g)?.[0];
						if (rawId) {
							const raw =
								message.mentions.find(x => args[i.name]?.includes(x.id)) ??
								(await self.cache.users?.get(rawId)) ??
								(i.required ? await self.users.fetch(rawId) : undefined);
							if (raw) {
								value = raw.id;
								if (raw instanceof User) {
									resolved.users[raw.id] = raw;
									if (message.guild_id) {
										const member =
											message.mentions.find(x => args[i.name]?.includes(x.id))?.member ??
											(await self.cache.members?.get(rawId, message.guild_id)) ??
											(i.required ? await self.members.fetch(rawId, message.guild_id) : undefined);
										if (member) resolved.members[raw.id] = member;
									}
								} else {
									const { member, ...user } = raw;
									resolved.users[user.id] = user;
									if (member) resolved.members[user.id] = member;
								}
							}
						}
					}
					break;
				case ApplicationCommandOptionType.String:
					{
						value = args[i.name];
						const option = i as SeyfertStringOption;
						if (value) {
							if (option.min_length) {
								if (value.length < option.min_length) {
									value = undefined;
									errors.push({
										name: i.name,
										error: `The entered string has less than ${option.min_length} characters. The minimum required is ${option.min_length} characters.`,
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
									});
									break;
								}
							}
							if (option.choices?.length) {
								if (!option.choices.some(x => x.name === value)) {
									value = undefined;
									errors.push({
										name: i.name,
										error: `The entered choice is invalid. Please choose one of the following options: ${option.choices
											.map(x => x.name)
											.join(', ')}.`,
									});
									break;
								}
								value = option.choices.find(x => x.name === value)!.value;
							}
						}
					}
					break;
				case ApplicationCommandOptionType.Number:
				case ApplicationCommandOptionType.Integer:
					{
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
							});
							break;
						}
						const option = i as SeyfertNumberOption | SeyfertIntegerOption;
						if (option.min_value) {
							if (value < option.min_value) {
								value = undefined;
								errors.push({
									name: i.name,
									error: `The entered number is less than ${option.min_value}. The minimum allowed is ${option.min_value}`,
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
								});
								break;
							}
						}
						if (option.choices?.length) {
							if (!option.choices.some(x => x.name === value)) {
								value = undefined;
								errors.push({
									name: i.name,
									error: `The entered choice is invalid. Please choose one of the following options: ${option.choices
										.map(x => x.name)
										.join(', ')}.`,
								});
								break;
							}
							value = option.choices.find(x => x.name === value)!.value;
						}
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
				errors.push({
					error: 'Option is required but returned undefined',
					name: i.name,
				});
		} catch (e) {
			errors.push({
				error: e && typeof e === 'object' && 'message' in e ? (e.message as string) : `${e}`,
				name: i.name,
			});
		}
	}

	return { errors, options };
}

function defaultArgsParser(content: string) {
	const args: Record<string, string> = {};
	for (const i of content.match(/-(.*?)(?=\s-|$)/gs) ?? []) {
		args[i.slice(1).split(' ')[0]] = i.split(' ').slice(1).join(' ');
	}
	return args;
}

//-(.*?)(?=\s-|$)/gs
//-(?<text>[^-]*)/gm
