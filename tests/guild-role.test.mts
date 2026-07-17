import { Routes, createMockBot, mockWorld } from '@slipher/testing';
import { describe, expect, test } from 'vitest';
import { GuildRole } from '../lib';

describe('GuildRole', () => {
	test('edit forwards the body and audit-log reason through the role shorter', async () => {
		const world = mockWorld();
		const guild = world.registerGuild({ everyonePermissions: ['ManageRoles'] });
		const role = world.registerRole(guild.id, { name: 'moderator', position: 1 });
		await using bot = await createMockBot({ world });
		const structure = await bot.client.roles.fetch(guild.id, role.id);

		const edited = await structure.edit({ name: 'moderators' }, 'sync role name');

		expect(structure).toBeInstanceOf(GuildRole);
		expect(edited.name).toBe('moderators');
		expect(bot.world.get.role({ guildId: guild.id, id: role.id }).name).toBe('moderators');
		const action = bot.rest.requireAction(Routes.editRole, { guildId: guild.id, roleId: role.id });
		expect(action.body).toEqual({ name: 'moderators' });
		expect(action.reason).toBe('sync role name');
	});
});
