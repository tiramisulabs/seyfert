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
	flags: 0,
} satisfies APIRole;

describe('GuildRole', () => {
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
