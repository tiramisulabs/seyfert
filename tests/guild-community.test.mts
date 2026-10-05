import { createMockBot, mockWorld } from '@slipher/testing';
import { describe, expect, test } from 'vitest';

describe('Guild community shorters', () => {
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
		const log = await bot.client.guilds.audit.fetch(guild.id, { limit: 2, user_id: '500000000000000006' });

		expect(log.audit_log_entries).toEqual([]);
		expect(bot.restCalls().length).toBeGreaterThan(before);
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
