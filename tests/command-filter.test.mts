import { describe, expect, test, vi } from 'vitest';
import { BaseClient } from '../lib/client/base';
import { Command, type CommandContext, SubCommand } from '../lib/commands';
import { HandleCommand } from '../lib/commands/handle';
import { ApplicationCommandOptionType, InteractionContextType } from '../lib/types';

function runtimeConfig() {
	return {
		token: Buffer.from('bot').toString('base64'),
		locations: { base: '' },
		intents: 0,
	};
}

function createClient() {
	const client = new BaseClient({ getRC: runtimeConfig });
	client.handleCommand = new HandleCommand(client as never);
	return client;
}

function createContext(client: BaseClient, command: Command | SubCommand) {
	return {
		client,
		command,
		guildId: 'guild-1',
		author: { id: 'user-1' },
		metadata: {},
		globalMetadata: {},
	} as never;
}

class FilteredCommand extends Command {
	name = 'filtered';
	description = 'Filtered';
	botPermissions = 1n;
	filter = vi.fn(() => false);
	onBeforeMiddlewares = vi.fn();
	onBotPermissionsFail = vi.fn();
	onMiddlewaresError = vi.fn();
	onInternalError = vi.fn();
	run = vi.fn();
}

class ThrowingFilterCommand extends Command {
	name = 'throwing-filter';
	description = 'Throwing filter';
	filter = vi.fn(() => {
		throw new Error('filter failed');
	});
	onInternalError = vi.fn();
	run = vi.fn();
}

class ParentCommand extends Command {
	name = 'parent';
	description = 'Parent';
	filter = vi.fn(() => false);
}

class ChildSubCommand extends SubCommand {
	name = 'child';
	description = 'Child';
	run = vi.fn();
}

class OwnFilterSubCommand extends SubCommand {
	name = 'own-child';
	description = 'Own child';
	seenThis = false;
	filter = vi.fn(function (this: OwnFilterSubCommand) {
		this.seenThis = this instanceof OwnFilterSubCommand;
		return true;
	});
	run = vi.fn();
}

class PrefixFilteredCommand extends Command {
	name = 'prefix';
	description = 'Prefix';
	contexts = [InteractionContextType.Guild];
	options = [
		{
			name: 'target',
			description: 'Target',
			type: ApplicationCommandOptionType.String,
			required: true,
		},
	];
	filter = vi.fn((context: CommandContext) => context.resolver.getString('target') === 'alpha');
	onOptionsError = vi.fn();
	run = vi.fn();
}

class PrefixPermissionCommand extends Command {
	name = 'restricted';
	description = 'Restricted';
	contexts = [InteractionContextType.Guild];
	defaultMemberPermissions = 1n;
	onPermissionsFail = vi.fn();
	run = vi.fn();
}

class PrefixParentCommand extends Command {
	name = 'parent-prefix';
	description = 'Parent prefix';
	contexts = [InteractionContextType.Guild];
}

class PrefixFilteredSubCommand extends SubCommand {
	name = 'child';
	description = 'Child';
	contexts = [InteractionContextType.Guild];
	options = [
		{
			name: 'target',
			description: 'Target',
			type: ApplicationCommandOptionType.String,
			required: true,
		},
	];
	filter = vi.fn(function (this: PrefixFilteredSubCommand, context: CommandContext) {
		return context.resolver.getCommand() === this && context.resolver.getString('target') === 'beta';
	});
	onOptionsError = vi.fn();
	run = vi.fn();
}

function createRawMessage(content: string) {
	return {
		id: '100000000000000001',
		channel_id: '100000000000000002',
		guild_id: '100000000000000003',
		content,
		timestamp: '2026-01-01T00:00:00.000Z',
		edited_timestamp: null,
		tts: false,
		mention_everyone: false,
		mentions: [],
		mention_roles: [],
		mention_channels: [],
		attachments: [],
		embeds: [],
		pinned: false,
		type: 0,
		author: {
			id: '100000000000000004',
			username: 'user',
			discriminator: '0001',
			avatar: null,
			global_name: null,
		},
		member: {
			roles: [],
			joined_at: '2026-01-01T00:00:00.000Z',
			deaf: false,
			mute: false,
			flags: 0,
		},
		components: [],
	};
}

describe('command filter', () => {
	test('chat input filter false skips run and later infrastructure', async () => {
		const client = createClient();
		const command = new FilteredCommand();
		const observer = vi.fn();
		const observerRecord = {
			index: 0,
			plugin: { name: 'observer' },
			active: true,
		} as never;
		client.pluginRegistry.commandObservers.push({
			record: observerRecord,
			active: true,
			observer: { onBeforeMiddlewares: observer },
		} as never);
		client.middlewares = {
			audit: vi.fn(({ stop }) => stop('denied')),
		};
		client.options.globalMiddlewares = ['audit' as never];

		await client.handleCommand.chatInput(
			command,
			{ appPermissions: { has: () => false, values: () => [], missings: () => ['ManageGuild'], keys: () => ['ManageGuild'] } } as never,
			{ fullCommandName: command.name } as never,
			createContext(client, command),
		);

		expect(command.filter).toHaveBeenCalledTimes(1);
		expect(command.run).not.toHaveBeenCalled();
		expect(command.onBeforeMiddlewares).not.toHaveBeenCalled();
		expect(command.onBotPermissionsFail).not.toHaveBeenCalled();
		expect(command.onMiddlewaresError).not.toHaveBeenCalled();
		expect(observer).not.toHaveBeenCalled();
		expect(client.middlewares.audit).not.toHaveBeenCalled();
	});

	test('subcommand defaults inherit the parent filter when missing', async () => {
		const client = createClient();
		const parent = new ParentCommand();
		const child = new ChildSubCommand();

		client.commands.stablishSubCommandDefaults(parent, child);
		await client.handleCommand.chatInput(
			child,
			{} as never,
			{ fullCommandName: 'parent child' } as never,
			createContext(client, child),
		);

		expect(parent.filter).toHaveBeenCalledTimes(1);
		expect(child.run).not.toHaveBeenCalled();
	});

	test('subcommand defaults keep and bind an own filter', async () => {
		const client = createClient();
		const parent = new ParentCommand();
		const child = new OwnFilterSubCommand();
		const childFilter = child.filter;

		client.commands.stablishSubCommandDefaults(parent, child);
		await client.handleCommand.chatInput(
			child,
			{} as never,
			{ fullCommandName: 'parent own-child' } as never,
			createContext(client, child),
		);

		expect(parent.filter).not.toHaveBeenCalled();
		expect(childFilter).toHaveBeenCalledTimes(1);
		expect(child.seenThis).toBe(true);
		expect(child.run).toHaveBeenCalledTimes(1);
	});

	test('thrown filter routes to onInternalError', async () => {
		const client = createClient();
		const command = new ThrowingFilterCommand();

		await client.handleCommand.chatInput(
			command,
			{} as never,
			{ fullCommandName: command.name } as never,
			createContext(client, command),
		);

		expect(command.run).not.toHaveBeenCalled();
		expect(command.onInternalError.mock.calls.length).toBe(1);
		const [errorClient, errorCommand, error] = command.onInternalError.mock.calls[0];
		expect(errorClient === client).toBe(true);
		expect(errorCommand === command).toBe(true);
		expect(error).toMatchObject({ message: 'filter failed' });
	});

	test('prefix command filter preserves parsed options after passing', async () => {
		const client = createClient();
		const command = new PrefixFilteredCommand();
		client.options.commands!.prefix = async () => ['!'];
		client.commands.values.push(command);

		await client.handleCommand.message(createRawMessage('!prefix -target alpha') as never, 0);

		expect(command.filter).toHaveBeenCalledTimes(1);
		expect(command.onOptionsError).not.toHaveBeenCalled();
		expect(command.run).toHaveBeenCalledTimes(1);
		expect(command.run.mock.calls[0][0].options.target).toBe('alpha');
	});

	test('prefix subcommand filter sees the parsed subcommand resolver', async () => {
		const client = createClient();
		const parent = new PrefixParentCommand();
		const command = new PrefixFilteredSubCommand();
		parent.options = [command];
		client.options.commands!.prefix = async () => ['!'];
		client.commands.values.push(parent);

		await client.handleCommand.message(createRawMessage('!parent-prefix child -target beta') as never, 0);

		expect(command.filter).toHaveBeenCalledTimes(1);
		expect(command.onOptionsError).not.toHaveBeenCalled();
		expect(command.run).toHaveBeenCalledTimes(1);
		expect(command.run.mock.calls[0][0].options.target).toBe('beta');
	});

	test('prefix permission failures reuse resolved permission keys', async () => {
		const client = createClient();
		const command = new PrefixPermissionCommand();
		const keys = vi.fn(() => ['ManageGuild']);
		const memberPermissions = {
			has: vi.fn(() => false),
			values: vi.fn(() => [1n]),
			missings: vi.fn(() => [1n]),
			keys,
		};

		client.options.commands!.prefix = async () => ['!'];
		client.commands.values.push(command);
		client.members.permissions = vi.fn().mockResolvedValue(memberPermissions);
		client.guilds.raw = vi.fn().mockResolvedValue({ owner_id: 'not-user-1' });

		await client.handleCommand.message(createRawMessage('!restricted') as never, 0);

		expect(keys).toHaveBeenCalledTimes(1);
		expect(command.onPermissionsFail).toHaveBeenCalledTimes(1);
		expect(command.onPermissionsFail.mock.calls[0][1]).toEqual(['ManageGuild']);
		expect(command.run).not.toHaveBeenCalled();
	});
});
