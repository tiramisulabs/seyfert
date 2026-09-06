import { createMockBot, mockWorld, Routes } from '@slipher/testing';
import { describe, expect, test } from 'vitest';
import { type APIRole, GuildRole } from '../lib';

const guildId = '100000000000000001';

const roleData = {
	id: '200000000000000002',
	name: 'moderator',
	color: 0,
	colors: {
		primary_color: 0,
		secondary_color: null,
		tertiary_color: null,
	},
	hoist: false,
	icon: null,
	unicode_emoji: null,
	position: 1,
	permissions: '0',
	managed: false,
	mentionable: false,
	flags: 0 as APIRole['flags'],
} satisfies APIRole;

describe('GuildRole', () => {
	test('compares role hierarchy by position before snowflake id', () => {
		const client = {} as any;
		const higherPosition = new GuildRole(client, { ...roleData, id: '300000000000000003', position: 2 }, guildId);
		const olderTiedRole = new GuildRole(client, { ...roleData, id: '200000000000000002', position: 1 }, guildId);
		const newerTiedRole = new GuildRole(client, { ...roleData, id: '400000000000000004', position: 1 }, guildId);

		expect(higherPosition.comparePositionTo(olderTiedRole)).toBeGreaterThan(0);
		expect(olderTiedRole.comparePositionTo(newerTiedRole)).toBeGreaterThan(0);
		expect(newerTiedRole.comparePositionTo(olderTiedRole)).toBeLessThan(0);
		expect(olderTiedRole.comparePositionTo(olderTiedRole)).toBe(0);
	});

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
		expect(bot.restCalls(Routes.editRole)).toContainEqual(
			expect.objectContaining({
				params: { guildId: guild.id, roleId: role.id },
				body: { name: 'moderators' },
				reason: 'sync role name',
			}),
		);
	});
});
