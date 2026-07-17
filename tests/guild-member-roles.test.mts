import { Routes, apiMember, apiUser, createMockBot, mockWorld } from '@slipher/testing';
import { describe, expect, test, vi } from 'vitest';
import { GuildMember } from '../lib';

const guildId = '100000000000000001';
const botId = '200000000000000002';
const targetId = '300000000000000003';
const botRoleId = '400000000000000004';
const targetRoleId = '500000000000000005';

const userData = (id: string, bot = false) =>
	apiUser({
		id,
		username: `user-${id}`,
		bot,
		globalName: null,
	});

const memberData = (roles: string[]) =>
	apiMember({
		roles,
	});

const createMember = (client: any, id: string, roles: string[], bot = false) =>
	new GuildMember(client, memberData(roles), userData(id, bot), guildId);

const deferred = <T,>() => {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>(res => {
		resolve = res;
	});
	return { promise, resolve };
};

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

	test('manageable starts self and guild fetches before waiting for either result', async () => {
		const everyoneRole = { id: guildId, position: 0 };
		const botRole = { id: botRoleId, position: 20 };
		const targetRole = { id: targetRoleId, position: 10 };
		const list = vi.fn().mockResolvedValue([everyoneRole, botRole, targetRole]);
		const self = deferred<GuildMember>();
		const guild = deferred<{ ownerId: string }>();
		const client = {
			botId,
			roles: { list },
			guilds: {
				fetchSelf: vi.fn(() => self.promise),
				fetch: vi.fn(() => guild.promise),
			},
		} as any;
		const botMember = createMember(client, botId, [botRoleId], true);
		const targetMember = createMember(client, targetId, [targetRoleId]);

		const manageable = targetMember.manageable();
		await Promise.resolve();

		expect(client.guilds.fetchSelf).toHaveBeenCalledWith(guildId, false);
		expect(client.guilds.fetch).toHaveBeenCalledWith(guildId, false);

		self.resolve(botMember);
		guild.resolve({ ownerId: '900000000000000009' });
		await expect(manageable).resolves.toBe(true);
	});
});

describe('GuildMember moderation helpers', () => {
	test('timeout treats numbers as milliseconds', async () => {
		const world = mockWorld();
		const guild = world.registerGuild({ everyonePermissions: ['ModerateMembers'] });
		const target = world.registerMember(guild.id);
		await using bot = await createMockBot({ world });
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
		try {
			await bot.client.members.timeout(guild.id, target.user.id, 1_500, 'brief timeout');

			const action = bot.rest.requireAction(Routes.editMember, {
				guildId: guild.id,
				userId: target.user.id,
			});
			expect(action.body).toEqual({ communication_disabled_until: '2026-01-01T00:00:01.500Z' });
			expect(action.reason).toBe('brief timeout');
		} finally {
			vi.useRealTimers();
		}
	});

	test('ban shorters convert options to Discord ban body and audit reason', async () => {
		const memberWorld = mockWorld();
		const memberGuild = memberWorld.registerGuild({ everyonePermissions: ['BanMembers'] });
		const memberTarget = memberWorld.registerMember(memberGuild.id);
		await using memberBot = await createMockBot({ world: memberWorld });

		await memberBot.client.members.ban(memberGuild.id, memberTarget.user.id, {
			deleteMessageSeconds: 60,
			reason: 'cleanup',
		});

		const memberAction = memberBot.rest.requireAction(Routes.ban, {
			guildId: memberGuild.id,
			userId: memberTarget.user.id,
		});
		expect(memberAction.body).toEqual({ delete_message_seconds: 60 });
		expect(memberAction.reason).toBe('cleanup');
		expect(memberBot.world.get.ban({ guildId: memberGuild.id, userId: memberTarget.user.id })).toBeDefined();

		const banWorld = mockWorld();
		const banGuild = banWorld.registerGuild({ everyonePermissions: ['BanMembers'] });
		const banTarget = banWorld.registerMember(banGuild.id);
		await using banBot = await createMockBot({ world: banWorld });
		await banBot.client.bans.create(banGuild.id, banTarget.user.id, {
			deleteMessageSeconds: 120,
			reason: 'cleanup more',
		});

		const banAction = banBot.rest.requireAction(Routes.ban, {
			guildId: banGuild.id,
			userId: banTarget.user.id,
		});
		expect(banAction.body).toEqual({ delete_message_seconds: 120 });
		expect(banAction.reason).toBe('cleanup more');
		expect(banBot.world.get.ban({ guildId: banGuild.id, userId: banTarget.user.id })).toBeDefined();
	});
});
