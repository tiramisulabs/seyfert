// ho guild community coverage, onboarding + welcome + widget + audit + incidents
// btw hits real routes through intercepts so it proves the full shorter path
import { createMockBot, mockWorld } from '@slipher/testing';
import { describe, expect, test } from 'vitest';
import type { GuildWidgetStyle } from '../lib';
import { GuildOnboarding, GuildWelcomeScreen } from '../lib';

const onboardingPayload = {
	guild_id: '100000000000000001',
	prompts: [
		{
			id: '200000000000000002',
			options: [
				{
					id: '300000000000000003',
					channel_ids: ['400000000000000004'],
					role_ids: [],
					emoji: { id: null, name: 'wave', animated: false },
					title: 'Say hi',
					description: null,
				},
			],
			title: 'Pick one',
			single_select: true,
			required: true,
			in_onboarding: true,
			type: 0,
		},
		{
			id: '200000000000000005',
			options: [],
			title: 'Extra',
			single_select: false,
			required: false,
			in_onboarding: false,
			type: 1,
		},
	],
	default_channel_ids: ['400000000000000004'],
	enabled: true,
	mode: 0,
};

const welcomePayload = {
	description: 'Welcome in',
	welcome_channels: [
		{
			channel_id: '400000000000000004',
			description: 'Read this first',
			emoji_id: null,
			emoji_name: 'wave',
		},
	],
};

describe('Guild community shorters', () => {
	test('onboarding fetch returns a structure with flattened emoji fields', async () => {
		const world = mockWorld();
		const guild = world.registerGuild();
		await using bot = await createMockBot({ world });
		const route = `/guilds/${guild.id}/onboarding`;
		bot.rest.intercept('GET', route, () => ({ ...onboardingPayload, guild_id: guild.id }));

		const onboarding = await bot.client.guilds.onboarding.fetch(guild.id);

		expect(onboarding).toBeInstanceOf(GuildOnboarding);
		expect(onboarding.guildId).toBe(guild.id);
		expect(onboarding.isEnabled).toBe(true);
		expect(onboarding.flowPrompts).toHaveLength(1);
		expect(onboarding.requiredPrompts).toHaveLength(1);
		expect(onboarding.totalOptions).toBe(1);
		expect(onboarding.prompts[0]?.options[0]).toMatchObject({ emojiName: 'wave', emojiId: null });
	});

	test('onboarding edit forwards the body and reason', async () => {
		const world = mockWorld();
		const guild = world.registerGuild();
		await using bot = await createMockBot({ world });
		const route = `/guilds/${guild.id}/onboarding`;
		bot.rest.intercept('PUT', route, request => {
			expect(request.body).toMatchObject({ enabled: false });
			return { ...onboardingPayload, guild_id: guild.id, enabled: false };
		});

		const edited = await bot.client.guilds.onboarding.edit(guild.id, { enabled: false }, 'pause onboarding');

		expect(edited).toBeInstanceOf(GuildOnboarding);
		expect(edited.enabled).toBe(false);
		const calls = bot.restCalls().filter(call => call.method === 'PUT');
		expect(calls.at(-1)).toMatchObject({
			body: expect.objectContaining({ enabled: false }),
			reason: 'pause onboarding',
		});
	});

	test('welcome fetch and edit round-trip through the welcome-screen route', async () => {
		const world = mockWorld();
		const guild = world.registerGuild();
		await using bot = await createMockBot({ world });
		const route = `/guilds/${guild.id}/welcome-screen`;
		bot.rest.intercept('GET', route, () => welcomePayload);
		bot.rest.intercept('PATCH', route, request => ({ ...welcomePayload, ...(request.body as object) }));

		const screen = await bot.client.guilds.welcome.fetch(guild.id);

		expect(screen).toBeInstanceOf(GuildWelcomeScreen);
		expect(screen.guildId).toBe(guild.id);
		expect(screen.hasDescription).toBe(true);
		expect(screen.channelCount).toBe(1);
		expect(screen.welcomeChannels[0]).toMatchObject({ channelId: '400000000000000004', emojiName: 'wave' });

		const edited = await screen.edit({ description: 'New hello' }, 'refresh welcome');

		expect(edited.description).toBe('New hello');
		const calls = bot.restCalls().filter(call => call.method === 'PATCH');
		expect(calls.at(-1)).toMatchObject({ reason: 'refresh welcome' });
	});

	test('structure helpers delegate to the guild-scoped shorter', async () => {
		const world = mockWorld();
		const guild = world.registerGuild();
		await using bot = await createMockBot({ world });
		bot.rest.intercept('GET', `/guilds/${guild.id}/onboarding`, () => ({ ...onboardingPayload, guild_id: guild.id }));
		bot.rest.intercept('GET', `/guilds/${guild.id}/welcome-screen`, () => welcomePayload);

		const structure = await bot.client.guilds.fetch(guild.id);

		expect((await structure.community.onboarding()).id).toBe(guild.id);
		expect((await structure.community.welcomeScreen()).channelCount).toBe(1);
	});

	test('audit fetch validates limit and conflicting cursors before REST', async () => {
		const world = mockWorld();
		const guild = world.registerGuild();
		await using bot = await createMockBot({ world });
		const route = `/guilds/${guild.id}/audit-logs`;
		const emptyLog = {
			audit_log_entries: [],
			application_commands: [],
			webhooks: [],
			users: [],
			auto_moderation_rules: [],
			integrations: [],
			threads: [],
			guild_scheduled_events: [],
		};
		bot.rest.intercept('GET', route, request => {
			expect(request.query).toMatchObject({ limit: 2, user_id: '500000000000000006' });
			return emptyLog;
		});

		await expect(bot.client.guilds.audit.fetch(guild.id, { limit: 0 })).rejects.toMatchObject({
			code: 'INVALID_AUDIT_LOG_LIMIT',
		});
		await expect(bot.client.guilds.audit.fetch(guild.id, { limit: 101 })).rejects.toMatchObject({
			code: 'INVALID_AUDIT_LOG_LIMIT',
		});
		await expect(bot.client.guilds.audit.fetch(guild.id, { before: '1', after: '2' })).rejects.toMatchObject({
			code: 'CONFLICTING_AUDIT_LOG_CURSOR',
		});

		const before = bot.restCalls().length;
		const log = await bot.client.guilds.audit.byUser(guild.id, '500000000000000006', { limit: 2 });

		expect(log.audit_log_entries).toEqual([]);
		expect(bot.restCalls().length).toBeGreaterThan(before);
	});

	test('widget helpers hit settings, json, and image routes', async () => {
		const world = mockWorld();
		const guild = world.registerGuild();
		await using bot = await createMockBot({ world });
		bot.rest.intercept('GET', `/guilds/${guild.id}/widget`, () => ({ enabled: true, channel_id: null }));
		bot.rest.intercept('PATCH', `/guilds/${guild.id}/widget`, request => ({
			enabled: true,
			channel_id: null,
			...(request.body as object),
		}));
		bot.rest.intercept('GET', `/guilds/${guild.id}/widget.json`, () => ({
			id: guild.id,
			name: 'guild',
			instant_invite: null,
			channels: [],
			members: [],
			presence_count: 1,
		}));
		bot.rest.intercept('GET', `/guilds/${guild.id}/widget.png`, () => new Uint8Array([1, 2, 3]).buffer);

		expect((await bot.client.guilds.widget.settings(guild.id)).enabled).toBe(true);
		expect((await bot.client.guilds.widget.edit(guild.id, { enabled: false }, 'hide widget')).channel_id).toBe(null);
		expect((await bot.client.guilds.widget.fetch(guild.id)).presence_count).toBe(1);
		expect(await bot.client.guilds.widget.image(guild.id, { style: 'shield' as GuildWidgetStyle })).toBeDefined();
	});

	test('incidents requires at least one disable window', async () => {
		const world = mockWorld();
		const guild = world.registerGuild();
		await using bot = await createMockBot({ world });
		bot.rest.intercept('PUT', `/guilds/${guild.id}/incident-actions`, request => ({
			invites_disabled_until: null,
			dms_disabled_until: null,
			...(request.body as object),
		}));

		await expect(bot.client.guilds.incidents(guild.id, {})).rejects.toMatchObject({ code: 'MISSING_INCIDENT_ACTIONS' });

		const updated = await bot.client.guilds.incidents(guild.id, { invites_disabled_until: null }, 'calm down');

		expect(updated).toMatchObject({ invites_disabled_until: null });
	});
});
