import { createMockBot, mockWorld } from '@slipher/testing';
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

	test('position edits forward the audit log reason and cache the returned roles', async () => {
		const world = mockWorld();
		const guild = world.registerGuild();
		const role = world.registerRole(guild.id);
		await using bot = await createMockBot({ world });
		bot.client.cache.intents = 0;
		const route = `/guilds/${guild.id}/roles`;
		const updated = { ...roleData, id: role.id, position: 3 } satisfies APIRole;
		bot.rest.intercept('PATCH', route, () => [updated]);

		const roles = await bot.client.roles.editPositions(guild.id, [{ id: role.id, position: 3 }], 'promote staff');

		expect(roles.map(r => [r.id, r.position])).toEqual([[role.id, 3]]);
		expect(await bot.client.cache.roles?.raw(role.id)).toMatchObject({ position: 3 });
		expect(bot.restCalls().filter(call => call.method === 'PATCH' && call.route === route)).toEqual([
			expect.objectContaining({ reason: 'promote staff' }),
		]);
	});
});
