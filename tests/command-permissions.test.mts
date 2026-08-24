import { assert, describe, test, vi } from 'vitest';
import { Client } from '../lib/client/client';
import { Command, ContextMenuCommand, EntryPointCommand } from '../lib/commands';
import { HandleCommand } from '../lib/commands/handle';
import { PermissionsBitField } from '../lib/structures/extra/Permissions';
import { InteractionContextType } from '../lib/types';

function createRuntimeConfig() {
	return {
		locations: { base: '' },
		token: Buffer.from('bot').toString('base64'),
		intents: 0,
	};
}

function createClient() {
	return new Client({
		getRC: createRuntimeConfig,
		commands: { prefix: async () => ['!'] },
	});
}

function createRestrictedCommand<T extends Command>(command: T) {
	command.name = 'restricted';
	command.description = 'Restricted command';
	command.contexts = [InteractionContextType.Guild];
	command.integrationTypes = [];
	command.defaultMemberPermissions = PermissionsBitField.resolve(['ManageGuild']);
	command.options = [];
	return command;
}

function createMessage(authorId = 'user') {
	return {
		attachments: [],
		author: { avatar: null, discriminator: '0', id: authorId, username: 'User' },
		channel_id: 'channel',
		components: [],
		content: '!restricted',
		edited_timestamp: null,
		embeds: [],
		guild_id: 'guild',
		id: 'message',
		mention_everyone: false,
		mention_roles: [],
		mentions: [],
		pinned: false,
		timestamp: new Date(0).toISOString(),
		tts: false,
		type: 0,
	};
}

function createInteractionContext(client: Client, command: unknown, authorId = 'user') {
	return {
		author: { id: authorId },
		client,
		command,
		globalMetadata: {},
		guildId: 'guild',
		metadata: {},
	} as never;
}

describe('command permissions', () => {
	test('preserves declared permissions in application command payloads', () => {
		const client = createClient();
		const command = createRestrictedCommand(new Command());
		client.commands.set([command]);

		assert.equal(command.defaultMemberPermissions, PermissionsBitField.resolve(['ManageGuild']));
		assert.equal(command.toJSON().default_member_permissions, PermissionsBitField.resolve(['ManageGuild']).toString());
	});

	test('checks declared permissions for slash and prefix commands by default', async () => {
		const client = createClient();
		const command = createRestrictedCommand(new Command());
		const run = vi.fn();
		const onPermissionsFail = vi.fn();
		command.run = run;
		command.onPermissionsFail = onPermissionsFail;
		client.commands.set([command]);
		vi.spyOn(client.members, 'permissions').mockResolvedValue(new PermissionsBitField());
		vi.spyOn(client.guilds, 'raw').mockResolvedValue({ owner_id: 'owner' } as never);
		const handle = new HandleCommand(client as never);

		await handle.chatInput(
			command,
			{ member: { permissions: new PermissionsBitField() } } as never,
			{} as never,
			createInteractionContext(client, command),
		);
		await handle.message(createMessage() as never, 0);

		assert.equal(run.mock.calls.length, 0);
		assert.equal(onPermissionsFail.mock.calls.length, 2);
		assert.deepEqual(onPermissionsFail.mock.calls[0]?.[1], ['ManageGuild']);
		assert.deepEqual(onPermissionsFail.mock.calls[1]?.[1], ['ManageGuild']);
	});

	test('lets custom command handlers override member and bot permission checks', async () => {
		const client = createClient();
		const command = createRestrictedCommand(new Command());
		command.botPermissions = PermissionsBitField.resolve(['SendMessages']);
		const run = vi.fn();
		const menuRun = vi.fn();
		const entryPointRun = vi.fn();
		command.run = run;
		client.commands.set([command]);
		vi.spyOn(client.members, 'permissions').mockResolvedValue(new PermissionsBitField());
		vi.spyOn(client.guilds, 'raw').mockResolvedValue({ owner_id: 'owner' } as never);
		const handle = new DeveloperHandleCommand(client as never);

		await handle.chatInput(
			command,
			{ appPermissions: new PermissionsBitField(), member: { permissions: new PermissionsBitField() } } as never,
			{} as never,
			createInteractionContext(client, command, 'developer'),
		);
		await handle.message(createMessage('developer') as never, 0);

		const menu = new TestContextMenuCommand();
		menu.name = 'Restricted menu';
		menu.botPermissions = PermissionsBitField.resolve(['SendMessages']);
		menu.run = menuRun;
		await handle.contextMenu(
			menu,
			{ appPermissions: new PermissionsBitField() } as never,
			createInteractionContext(client, menu, 'developer'),
		);

		const entryPoint = new TestEntryPointCommand();
		entryPoint.name = 'restricted-entry-point';
		entryPoint.botPermissions = PermissionsBitField.resolve(['SendMessages']);
		entryPoint.run = entryPointRun;
		await handle.entryPoint(
			entryPoint,
			{ appPermissions: new PermissionsBitField() } as never,
			createInteractionContext(client, entryPoint, 'developer'),
		);

		assert.equal(handle.checkedMemberAuthors.mock.calls.length, 2);
		assert.deepEqual(
			handle.checkedMemberAuthors.mock.calls.map(([authorId]) => authorId),
			['developer', 'developer'],
		);
		assert.equal(handle.checkedBotAuthors.mock.calls.length, 4);
		assert.deepEqual(
			handle.checkedBotAuthors.mock.calls.map(([authorId]) => authorId),
			['developer', 'developer', 'developer', 'developer'],
		);
		assert.equal(run.mock.calls.length, 2);
		assert.equal(menuRun.mock.calls.length, 1);
		assert.equal(entryPointRun.mock.calls.length, 1);
	});
});

class DeveloperHandleCommand extends HandleCommand {
	checkedMemberAuthors = vi.fn<(authorId: string) => void>();
	checkedBotAuthors = vi.fn<(authorId: string) => void>();

	override async checkMemberPermissions(...args: Parameters<HandleCommand['checkMemberPermissions']>) {
		this.checkedMemberAuthors(args[1].author.id);
		if (args[1].author.id === 'developer') return;
		return super.checkMemberPermissions(...args);
	}

	override async checkBotPermissions(...args: Parameters<HandleCommand['checkBotPermissions']>) {
		this.checkedBotAuthors(args[1].author.id);
		if (args[1].author.id === 'developer') return;
		return super.checkBotPermissions(...args);
	}
}

class TestContextMenuCommand extends ContextMenuCommand {
	run() {}
}

class TestEntryPointCommand extends EntryPointCommand {
	run() {}
}
