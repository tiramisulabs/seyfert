import { apiUser, createMockBot, mockWorld, rendered } from '@slipher/testing';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
	ApplicationCommandType,
	Command,
	type CommandContext,
	ContextMenuCommand,
	Declare,
	EntryPointCommand,
	type EntryPointContext,
	EntryPointCommandHandlerType,
	type MenuCommandContext,
	type UserCommandInteraction,
} from '../lib';
import { HandleCommand } from '../lib/commands/handle';
import { PermissionsBitField } from '../lib/structures/extra/Permissions';

const developer = apiUser({ id: 'developer' });
const restrictedRun = vi.fn();
const memberPermissionsFail = vi.fn();

function createPermissionWorld() {
	const world = mockWorld();
	const guild = world.registerGuild({
		id: 'guild',
		ownerId: 'owner',
		everyonePermissions: [],
	});
	const channel = guild.registerChannel({ id: 'channel' });
	const member = guild.registerMember({ roles: [], user: developer });
	guild.registerBotMember({ roles: [] });
	return { channel, guild, member, world };
}

describe('command permissions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('preserves declared permissions in application command payloads', () => {
		const command = new RestrictedCommand();

		expect(command.defaultMemberPermissions).toBe(PermissionsBitField.resolve(['ManageGuild']));
		expect(command.toJSON().default_member_permissions).toBe(
			PermissionsBitField.resolve(['ManageGuild']).toString(),
		);
	});

	test('checks declared permissions for slash and prefix commands by default', async () => {
		const { channel, guild, member, world } = createPermissionWorld();
		await using bot = await createMockBot({ commands: [RestrictedCommand], prefixes: ['!'], world });

		const slash = await bot.slash({
			name: 'restricted',
			channel,
			guildId: guild.id,
			memberPermissions: [],
			user: member.user,
		});
		await bot.say('!restricted', { channel, guildId: guild.id, user: member.user });

		rendered(slash).get.denial({ kind: 'permissions', missing: 'ManageGuild' });
		expect(memberPermissionsFail).toHaveBeenCalledTimes(2);
		expect(memberPermissionsFail.mock.calls.map(([, permissions]) => permissions)).toEqual([
			['ManageGuild'],
			['ManageGuild'],
		]);
		expect(restrictedRun).not.toHaveBeenCalled();
	});

	test('lets custom command handlers override member and bot permission checks', async () => {
		const { channel, guild, member, world } = createPermissionWorld();
		await using bot = await createMockBot({
			commands: [RestrictedCommand, RestrictedMenuCommand, RestrictedEntryPointCommand],
			prefixes: ['!'],
			world,
		});
		bot.client.setServices({ handleCommand: DeveloperHandleCommand });
		const handle = bot.client.handleCommand as DeveloperHandleCommand;
		const interaction = {
			channel,
			guildId: guild.id,
			permissions: [],
			user: member.user,
		};

		const slash = await bot.slash({ name: 'restricted', memberPermissions: [], ...interaction });
		const prefix = await bot.say('!restricted', { channel, guildId: guild.id, user: member.user });
		const menu = await bot.userMenu({ name: 'Restricted menu', target: developer, ...interaction });
		const entryPoint = await bot.entryPoint({ name: 'restricted-entry-point', ...interaction });

		expect(handle.checkedMemberAuthors).toHaveBeenCalledTimes(2);
		expect(handle.checkedMemberAuthors.mock.calls.map(([authorId]) => authorId)).toEqual([
			'developer',
			'developer',
		]);
		expect(handle.checkedBotAuthors).toHaveBeenCalledTimes(4);
		expect(handle.checkedBotAuthors.mock.calls.map(([authorId]) => authorId)).toEqual([
			'developer',
			'developer',
			'developer',
			'developer',
		]);
		expect([slash.content, prefix.content, menu.content, entryPoint.content]).toEqual([
			'restricted ran',
			'restricted ran',
			'menu ran',
			'entry point ran',
		]);
	});
});

@Declare({
	name: 'restricted',
	description: 'Restricted command',
	contexts: ['Guild'],
	integrationTypes: [],
	defaultMemberPermissions: ['ManageGuild'],
	botPermissions: ['SendMessages'],
})
class RestrictedCommand extends Command {
	run(context: CommandContext) {
		restrictedRun();
		return context.write({ content: 'restricted ran' });
	}

	onPermissionsFail(...args: Parameters<NonNullable<Command['onPermissionsFail']>>) {
		memberPermissionsFail(...args);
	}
}

@Declare({
	name: 'Restricted menu',
	type: ApplicationCommandType.User,
	integrationTypes: [],
	botPermissions: ['SendMessages'],
})
class RestrictedMenuCommand extends ContextMenuCommand {
	run(context: MenuCommandContext<UserCommandInteraction>) {
		return context.write({ content: 'menu ran' });
	}
}

@Declare({
	name: 'restricted-entry-point',
	description: 'Restricted entry point',
	type: ApplicationCommandType.PrimaryEntryPoint,
	handler: EntryPointCommandHandlerType.AppHandler,
	integrationTypes: [],
	botPermissions: ['SendMessages'],
})
class RestrictedEntryPointCommand extends EntryPointCommand {
	run(context: EntryPointContext) {
		return context.write({ content: 'entry point ran' });
	}
}

class DeveloperHandleCommand extends HandleCommand {
	checkedMemberAuthors = vi.fn<(authorId: string) => void>();
	checkedBotAuthors = vi.fn<(authorId: string) => void>();

	override async checkMemberPermissions(...args: Parameters<HandleCommand['checkMemberPermissions']>) {
		this.checkedMemberAuthors(args[1].author.id);
		if (args[1].author.id === developer.id) return;
		return super.checkMemberPermissions(...args);
	}

	override async checkBotPermissions(...args: Parameters<HandleCommand['checkBotPermissions']>) {
		this.checkedBotAuthors(args[1].author.id);
		if (args[1].author.id === developer.id) return;
		return super.checkBotPermissions(...args);
	}
}
