import { describe, expect, test, vi } from 'vitest';
import { GuildRole, type APIRole } from '../src';

const guildId = '100000000000000001';
const roleId = '200000000000000002';

const roleData = {
	id: roleId,
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

	test('edit forwards an audit-log reason to the role shorter', async () => {
		const body = { name: 'moderators' };
		const reason = 'sync role name';
		const edit = vi.fn().mockResolvedValue(undefined);
		const client = { roles: { edit } } as any;
		const role = new GuildRole(client, roleData, guildId);

		await role.edit(body, reason);

		expect(edit).toHaveBeenCalledWith(guildId, roleId, body, reason);
	});
});
