import { createMockBot, mockWorld, Routes } from '@slipher/testing';
import { describe, expect, test } from 'vitest';
import { GuildScheduledEvent, GuildScheduledSubscriber } from '../lib';
import { GUILD_SCHEDULED_EVENT_CREATE, GUILD_SCHEDULED_EVENT_UPDATE } from '../lib/events/hooks/guild';
import type { APIGuildScheduledEvent } from '../lib';

const startTime = '2026-09-01T10:00:00.000Z';

describe('GuildScheduledEvent', () => {
	test('lists events through the guild scheduled-events route as structures', async () => {
		const world = mockWorld();
		const guild = world.registerGuild();
		const event = world.registerScheduledEvent(guild.id, { name: 'stage night' });
		await using bot = await createMockBot({ world });

		const events = await bot.client.guilds.events.list(guild.id);

		expect(events).toHaveLength(1);
		expect(events[0]).toBeInstanceOf(GuildScheduledEvent);
		expect(events[0]).toMatchObject({ id: event.id, guildId: guild.id, name: 'stage night' });
		expect(events[0]!.startAt).toBeInstanceOf(Date);
		expect(bot.restCalls(Routes.fetchScheduledEvents)).toContainEqual(
			expect.objectContaining({ params: { guildId: guild.id } }),
		);
	});

	test('creates an external event and exposes helper getters', async () => {
		const world = mockWorld();
		const guild = world.registerGuild();
		await using bot = await createMockBot({ world });

		const created = await bot.client.guilds.events.create(guild.id, {
			name: 'meetup',
			privacy_level: 2,
			scheduled_start_time: startTime,
			scheduled_end_time: '2026-09-01T12:00:00.000Z',
			entity_type: 3,
			entity_metadata: { location: 'central park' },
		});

		expect(created).toBeInstanceOf(GuildScheduledEvent);
		expect(created.name).toBe('meetup');
		expect(created.startAt?.toISOString()).toBe(startTime);
		expect(bot.world.all.scheduledEvent({ guildId: guild.id })).toHaveLength(1);
		expect(bot.restCalls(Routes.createScheduledEvent)).toContainEqual(
			expect.objectContaining({
				params: { guildId: guild.id },
				body: expect.objectContaining({ name: 'meetup' }),
			}),
		);
	});

	test('fetch, edit, and delete round-trip through the event routes', async () => {
		const world = mockWorld();
		const guild = world.registerGuild();
		const event = world.registerScheduledEvent(guild.id, { name: 'before' });
		await using bot = await createMockBot({ world });

		const fetched = await bot.client.guilds.events.fetch(guild.id, event.id);
		expect(fetched).toBeInstanceOf(GuildScheduledEvent);
		expect(bot.restCalls(Routes.fetchScheduledEvent)).toContainEqual(
			expect.objectContaining({ params: { guildId: guild.id, eventId: event.id } }),
		);

		const edited = await fetched.edit({ name: 'after' }, 'rename event');
		expect(edited.name).toBe('after');
		expect(bot.world.get.scheduledEvent({ guildId: guild.id, id: event.id }).name).toBe('after');
		expect(bot.restCalls(Routes.editScheduledEvent)).toContainEqual(
			expect.objectContaining({
				params: { guildId: guild.id, eventId: event.id },
				body: { name: 'after' },
				reason: 'rename event',
			}),
		);

		await edited.delete('no longer needed');
		expect(bot.world.query.scheduledEvent({ guildId: guild.id, id: event.id })).toBeUndefined();
		expect(bot.restCalls(Routes.deleteScheduledEvent)).toContainEqual(
			expect.objectContaining({ params: { guildId: guild.id, eventId: event.id }, reason: 'no longer needed' }),
		);
	});

	test('structure helpers delegate to the guild-scoped shorter', async () => {
		const world = mockWorld();
		const guild = world.registerGuild();
		const event = world.registerScheduledEvent(guild.id, { name: 'delegated' });
		await using bot = await createMockBot({ world });

		const fetched = await bot.client.guilds.events.fetch(guild.id, event.id);

		const refetched = await fetched.fetch();
		expect(refetched.id).toBe(event.id);

		const renamed = await fetched.edit({ name: 'delegated renamed' });
		expect(renamed.name).toBe('delegated renamed');

		const guildStructure = await bot.client.guilds.fetch(guild.id);
		expect((await guildStructure.events.list()).map(item => item.id)).toEqual([event.id]);
		expect((await guildStructure.events.fetch(event.id, { with_user_count: true })).id).toBe(event.id);
		expect(bot.restCalls(Routes.fetchScheduledEvent).at(-1)?.query).toEqual({ with_user_count: true });
	});

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

	test('gateway create/update hooks return event structures', () => {
		const payload = {
			id: '1',
			guild_id: '2',
			channel_id: null,
			name: 'hooked',
			scheduled_start_time: startTime,
			scheduled_end_time: null,
			privacy_level: 2,
			status: 1,
			entity_type: 3,
			entity_id: null,
			entity_metadata: { location: 'central park' },
			recurrence_rule: {
				start: startTime,
				frequency: 2,
				interval: 1,
			},
		} as unknown as APIGuildScheduledEvent;
		const fakeClient = {} as never;

		const created = GUILD_SCHEDULED_EVENT_CREATE(fakeClient, payload);
		const updated = GUILD_SCHEDULED_EVENT_UPDATE(fakeClient, payload);
		expect(created).toBeInstanceOf(GuildScheduledEvent);
		expect(updated).toBeInstanceOf(GuildScheduledEvent);
		expect(created.name).toBe('hooked');
		expect(created.isExternal).toBe(true);
		expect(created.startAt?.toISOString()).toBe(startTime);
	});

	test('event helpers parse dates and expose cover urls', async () => {
		const world = mockWorld();
		const guild = world.registerGuild();
		const event = world.registerScheduledEvent(guild.id, { name: 'helpers' });
		await using bot = await createMockBot({ world });

		const fetched = await bot.client.guilds.events.fetch(guild.id, event.id);
		expect(fetched.endAt).toBeUndefined();
		expect(fetched.isExternal).toBe(false);
		expect(fetched.coverURL()).toBeUndefined();
		expect(typeof fetched.guild).toBe('function');
		expect(typeof fetched.subscribers).toBe('function');
	});
});
