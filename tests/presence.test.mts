import { apiMember, apiUser } from '@slipher/testing';
import { describe, expect, test, vi } from 'vitest';
import { CacheFrom, Client, PresenceUpdateStatus } from '../lib';
import type { PresenceUpdateReceiveStatus } from '../lib';
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
	test('shorter and structures resolve the presence from their requested guild', async () => {
		const client = new Client();
		const userData = apiUser({ id: userId, username: 'user' });
		const member = new GuildMember(client, apiMember({ roles: [] }), userData, guildId);
		const user = new User(client, userData);
		await client.cache.presences?.set(CacheFrom.Test, userId, guildId, presenceData(guildId));
		await client.cache.presences?.set(
			CacheFrom.Test,
			userId,
			'guild-2',
			presenceData('guild-2', PresenceUpdateStatus.Idle),
		);

		expect(await client.members.presence(guildId, userId)).toMatchObject({ guild_id: guildId, status: 'online' });
		expect(await member.presence()).toMatchObject({ guild_id: guildId, status: 'online' });
		expect(await user.presence('guild-2')).toMatchObject({ guild_id: 'guild-2', status: 'idle' });
	});

	test('deduplicates presence updates independently per guild', () => {
		vi.useFakeTimers();
		try {
			const handler = new PresenceUpdateHandler();
			expect(handler.check(presenceData('guild-1'))).toBe(true);
			expect(handler.check(presenceData('guild-2'))).toBe(true);
			expect(handler.check(presenceData('guild-1'))).toBe(false);
		} finally {
			vi.clearAllTimers();
			vi.useRealTimers();
		}
	});
});
