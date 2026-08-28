import { describe, expect, test, vi } from 'vitest';
import { HandleCommand } from '../src/commands/handle';
import { PermissionsBitField } from '../src/structures/extra/Permissions';

describe('command permission hooks', () => {
	test('preserves the default member and bot permission checks', async () => {
		const handle = new HandleCommand({} as never);
		const held = new PermissionsBitField(0n);
		const required = PermissionsBitField.resolve(['ManageGuild']);
		const command = { defaultMemberPermissions: required, botPermissions: required } as never;

		expect(await handle.checkMemberPermissions(command, {} as never, held)).toEqual(['ManageGuild']);
		expect(await handle.checkBotPermissions(command, {} as never, held)).toEqual(['ManageGuild']);
	});

	test('routes slash-command permission checks through overridable methods', async () => {
		const handle = new HandleCommand({} as never);
		const memberCheck = vi.spyOn(handle, 'checkMemberPermissions').mockResolvedValue(undefined);
		const botCheck = vi.spyOn(handle, 'checkBotPermissions').mockResolvedValue(undefined);
		vi.spyOn(handle, 'runOptions').mockResolvedValue(false);
		const command = {
			defaultMemberPermissions: PermissionsBitField.resolve(['ManageGuild']),
			botPermissions: PermissionsBitField.resolve(['SendMessages']),
		} as never;
		const context = { guildId: 'guild' } as never;
		const interaction = {
			appPermissions: new PermissionsBitField(0n),
			member: { permissions: new PermissionsBitField(0n) },
		} as never;

		await handle.chatInput(command, interaction, {} as never, context);

		expect(memberCheck).toHaveBeenCalledWith(command, context, interaction.member.permissions);
		expect(botCheck).toHaveBeenCalledWith(command, context, interaction.appPermissions);
	});
});
