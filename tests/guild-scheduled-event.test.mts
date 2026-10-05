import { createMockBot, mockWorld } from '@slipher/testing';
import { describe, expect, test } from 'vitest';
import { GuildScheduledSubscriber } from '../lib';

describe('GuildScheduledEvent', () => {
	test('subscriber listing preserves pagination and transforms users with optional membership', async () => {
		const world = mockWorld();
		const guild = world.registerGuild();
		const event = world.registerScheduledEvent(guild.id);
		const user = world.registerUser();
		const member = world.registerMember(guild.id, { user });
		const otherUser = world.registerUser();
		await using bot = await createMockBot({ world });
		const route = `/guilds/${guild.id}/scheduled-events/${event.id}/users`;
		const query = { limit: 2, with_member: true, after: '100000000000000000' };
		bot.rest.intercept('GET', route, request => {
			expect(request.query).toEqual(query);
			return [
				{ guild_scheduled_event_id: event.id, user, member },
				{ guild_scheduled_event_id: event.id, user: otherUser },
			];
		});

		const structure = await bot.client.guilds.events.fetch(guild.id, event.id);
		const subscribers = await structure.subscribers(query);
		expect(subscribers.map(item => item.id)).toEqual([user.id, otherUser.id]);
		expect(subscribers[0]).toBeInstanceOf(GuildScheduledSubscriber);
		expect(subscribers[0]).toMatchObject({ eventId: event.id, guildId: guild.id });
		expect(subscribers[0].user.toString()).toBe(`<@${user.id}>`);
		expect(subscribers[0].member?.guildId).toBe(guild.id);
		expect(subscribers[0].member?.user.id).toBe(user.id);
		expect(subscribers[1].member).toBeUndefined();

		bot.rest.intercept('GET', route, () => []);
		expect(await structure.subscribers()).toEqual([]);
	});
});
