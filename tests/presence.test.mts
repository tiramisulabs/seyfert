import { apiMember, apiUser } from '@slipher/testing';
import { describe, expect, test, vi } from 'vitest';
import { PresenceUpdateStatus } from '../lib';
import type { PresenceUpdateReceiveStatus } from '../lib';
import { MemberShorter } from '../lib/common/shorters/members';
import { GuildMember, User } from '../lib/structures';
import { PresenceUpdateHandler } from '../lib/websocket/discord/events/presenceUpdate';

const guildId = '100000000000000001';
const userId = '200000000000000002';

const presenceData = (currentGuildId: string, status: PresenceUpdateReceiveStatus = PresenceUpdateStatus.Online) => ({
	activities: [],
	client_status: {},
	guild_id: currentGuildId,
	status,
	user: { id: userId },
});

describe('guild-scoped presence consumers', () => {
	test('member shorter reads the member from the requested guild', () => {
		const get = vi.fn().mockReturnValue({ status: 'online' });
		const shorter = new MemberShorter({ cache: { presences: { get } } } as any);

		expect(shorter.presence(guildId, userId)).toEqual({ status: 'online' });
		expect(get).toHaveBeenCalledWith(userId, guildId);
	});

	test('guild members provide their guild while isolated users require one', () => {
		const presence = vi.fn().mockReturnValue({ status: 'online' });
		const client = { members: { presence } } as any;
		const userData = apiUser({ id: userId, username: 'user' });
		const member = new GuildMember(client, apiMember({ roles: [] }), userData, guildId);
		const user = new User(client, userData);

		expect(member.presence()).toEqual({ status: 'online' });
		expect(user.presence(guildId)).toEqual({ status: 'online' });
		expect(presence.mock.calls).toEqual([
			[guildId, userId],
			[guildId, userId],
		]);
	});

	test('deduplicates presence updates independently per guild', () => {
		vi.useFakeTimers();
		try {
			const handler = new PresenceUpdateHandler();
			expect(handler.check(presenceData('guild-1'))).toBe(true);
			expect(handler.check(presenceData('guild-2'))).toBe(true);
			expect(handler.check(presenceData('guild-1'))).toBe(false);
			expect(handler.presenceUpdate.size).toBe(2);
		} finally {
			vi.clearAllTimers();
			vi.useRealTimers();
		}
	});
});
