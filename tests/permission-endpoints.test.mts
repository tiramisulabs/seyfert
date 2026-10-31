import { createMockBot, mockWorld } from '@slipher/testing';
import { describe, expect, test } from 'vitest';
import { PermissionFlagsBits } from '../lib';

const viewAndSend = PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages;

describe('computed permission endpoints', () => {
	test('guild member and role permissions resolve Discord bitfields', async () => {
		const world = mockWorld();
		const guild = world.registerGuild();
		const role = world.registerRole(guild.id);
		const member = world.registerMember(guild.id);
		await using bot = await createMockBot({ world });
		bot.rest.intercept('GET', `/guilds/${guild.id}/permissions/member/${member.user.id}`, () => ({
			permissions: PermissionFlagsBits.Administrator.toString(),
		}));
		bot.rest.intercept('GET', `/guilds/${guild.id}/permissions/role/${role.id}`, () => ({
			permissions: viewAndSend.toString(),
		}));

		const memberPermissions = await bot.client.members.fetchPermissions(guild.id, member.user.id);
		const rolePermissions = await bot.client.roles.fetchPermissions(guild.id, role.id);

		expect(memberPermissions.bits).toBe(PermissionFlagsBits.Administrator);
		expect(rolePermissions.bits).toBe(viewAndSend);
	});

	test('channel member and role permissions forward implicit masking', async () => {
		const world = mockWorld();
		const guild = world.registerGuild();
		const channel = world.registerChannel(guild.id);
		const role = world.registerRole(guild.id);
		const member = world.registerMember(guild.id);
		await using bot = await createMockBot({ world });
		const memberRoute = `/channels/${channel.id}/permissions/member/${member.user.id}`;
		const roleRoute = `/channels/${channel.id}/permissions/role/${role.id}`;
		bot.rest.intercept('GET', memberRoute, () => ({ permissions: viewAndSend.toString() }));
		bot.rest.intercept('GET', roleRoute, () => ({ permissions: '0' }));

		const memberPermissions = await bot.client.channels.fetchMemberPermissions(channel.id, member.user.id, false);
		const rolePermissions = await bot.client.channels.fetchRolePermissions(channel.id, role.id);

		expect(memberPermissions.bits).toBe(viewAndSend);
		expect(rolePermissions.bits).toBe(0n);
		const calls = bot.restCalls().filter(call => call.method === 'GET');
		expect(calls.find(call => call.route === memberRoute)?.query).toEqual({ implicit: false });
		expect(calls.find(call => call.route === roleRoute)?.query?.implicit).toBeUndefined();
	});
});
