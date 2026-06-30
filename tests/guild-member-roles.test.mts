import { describe, expect, test, vi } from 'vitest';
import { GuildMember } from '../lib';
import { BanShorter } from '../lib/common/shorters/bans';
import { MemberShorter } from '../lib/common/shorters/members';

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
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
		try {
			const memberShorter = new MemberShorter({} as any);
			const edit = vi.spyOn(memberShorter, 'edit').mockResolvedValue({} as any);

			await memberShorter.timeout(guildId, targetId, 1_500, 'brief timeout');

			expect(edit).toHaveBeenCalledWith(
				guildId,
				targetId,
				{ communication_disabled_until: '2026-01-01T00:00:01.500Z' },
				'brief timeout',
			);
		} finally {
			vi.useRealTimers();
		}
	});

	test('ban shorters convert options to Discord ban body and audit reason', async () => {
		const createClient = () => {
			const put = vi.fn().mockResolvedValue(undefined);
			const removeIfNI = vi.fn().mockResolvedValue(undefined);
			const client = {
				proxy: {
					guilds(id: string) {
						expect(id).toBe(guildId);
						return {
							bans(memberId: string) {
								expect(memberId).toBe(targetId);
								return { put };
							},
						};
					},
				},
				cache: {
					members: { removeIfNI },
				},
			};

			return { client, put, removeIfNI };
		};

		const memberClient = createClient();
		await new MemberShorter(memberClient.client as any).ban(guildId, targetId, {
			deleteMessageSeconds: 60,
			reason: 'cleanup',
		});

		expect(memberClient.put).toHaveBeenCalledWith({
			body: { delete_message_seconds: 60 },
			reason: 'cleanup',
		});
		expect(memberClient.removeIfNI).toHaveBeenCalledWith('GuildModeration', targetId, guildId);

		const banClient = createClient();
		await new BanShorter(banClient.client as any).create(guildId, targetId, {
			deleteMessageSeconds: 120,
			reason: 'cleanup more',
		});

		expect(banClient.put).toHaveBeenCalledWith({
			body: { delete_message_seconds: 120 },
			reason: 'cleanup more',
		});
		expect(banClient.removeIfNI).toHaveBeenCalledWith('GuildModeration', targetId, guildId);
	});
});
