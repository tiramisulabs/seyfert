import { describe, expect, test, vi } from 'vitest';
import { GuildMember } from '../lib';

const guildId = '100000000000000001';
const botId = '200000000000000002';
const targetId = '300000000000000003';
const botRoleId = '400000000000000004';
const targetRoleId = '500000000000000005';

const userData = (id: string, bot = false) =>
	({
		id,
		username: `user-${id}`,
		discriminator: '0000',
		avatar: null,
		bot,
		global_name: null,
	}) as any;

const memberData = (roles: string[]) =>
	({
		roles,
		joined_at: null,
		deaf: false,
		mute: false,
	}) as any;

const createMember = (client: any, id: string, roles: string[], bot = false) =>
	new GuildMember(client, memberData(roles), userData(id, bot), guildId);

describe('GuildMember roles', () => {
	test('highest resolves undefined when a partial role list omits the member role', async () => {
		const list = vi.fn().mockResolvedValue([{ id: 'unrelated-role', position: 99 }]);
		const client = { roles: { list } } as any;
		const member = createMember(client, targetId, [targetRoleId]);

		await expect(member.roles.highest()).resolves.toBeUndefined();
		expect(list).toHaveBeenCalledWith(guildId, false);
	});

	test('manageable retries forced role lookups and returns false when highest role data is missing', async () => {
		const botRole = { id: botRoleId, position: 10 };
		const list = vi.fn().mockResolvedValue([botRole]);
		const client = {
			botId,
			roles: { list },
			guilds: {
				fetchSelf: vi.fn(),
				fetch: vi.fn().mockResolvedValue({ ownerId: '900000000000000009' }),
			},
		} as any;
		const botMember = createMember(client, botId, [botRoleId], true);
		const targetMember = createMember(client, targetId, [targetRoleId]);
		client.guilds.fetchSelf.mockResolvedValue(botMember);

		await expect(targetMember.manageable()).resolves.toBe(false);
		expect(list.mock.calls.map(call => call[1])).toEqual([false, false, true, true]);
	});

	test('manageable retries when a partial cache only resolves the target everyone role', async () => {
		const everyoneRole = { id: guildId, position: 0 };
		const botRole = { id: botRoleId, position: 10 };
		const targetRole = { id: targetRoleId, position: 20 };
		const list = vi
			.fn()
			.mockImplementation((_guildId: string, force = false) =>
				Promise.resolve(force ? [everyoneRole, botRole, targetRole] : [everyoneRole, botRole]),
			);
		const client = {
			botId,
			roles: { list },
			guilds: {
				fetchSelf: vi.fn(),
				fetch: vi.fn().mockResolvedValue({ ownerId: '900000000000000009' }),
			},
		} as any;
		const botMember = createMember(client, botId, [botRoleId], true);
		const targetMember = createMember(client, targetId, [targetRoleId]);
		client.guilds.fetchSelf.mockResolvedValue(botMember);

		await expect(targetMember.manageable()).resolves.toBe(false);
		expect(list.mock.calls.map(call => call[1])).toEqual([false, false, true, true]);
	});
});
