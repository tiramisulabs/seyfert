import { createMockBot, mockWorld, Routes } from '@slipher/testing';
import { describe, expect, test } from 'vitest';
import { GatewayIntentBits, StageInstance } from '../lib';
import { STAGE_INSTANCE_CREATE, STAGE_INSTANCE_DELETE, STAGE_INSTANCE_UPDATE } from '../lib/events/hooks/stage';

const topic = 'weekly stage planning';

function stagePayload(channelId: string, guildId: string, id = '900000000000000001') {
	return {
		id,
		guild_id: guildId,
		channel_id: channelId,
		topic,
		privacy_level: 2,
	};
}

describe('StageInstance', () => {
	test('creates a live stage through the stage-instances route as a structure', async () => {
		const world = mockWorld();
		const guild = world.registerGuild();
		const channel = world.registerChannel(guild.id, { type: 13 });
		await using bot = await createMockBot({ world });

		const created = await bot.client.stageInstances.create({ channel_id: channel.id, topic, privacy_level: 2 });

		expect(created).toBeInstanceOf(StageInstance);
		expect(created).toMatchObject({ id: expect.any(String), guildId: guild.id, channelId: channel.id, topic });
		expect(created.isGuildOnly).toBe(true);
		expect(bot.restCalls(Routes.createStageInstance)).toContainEqual(
			expect.objectContaining({ body: expect.objectContaining({ channel_id: channel.id, topic, privacy_level: 2 }) }),
		);
		expect(await bot.client.cache.stageInstances?.raw(channel.id)).toMatchObject({ topic });
	});

	test('create validates the topic before touching REST', async () => {
		const world = mockWorld();
		const guild = world.registerGuild();
		const channel = world.registerChannel(guild.id, { type: 13 });
		await using bot = await createMockBot({ world });

		const before = bot.restCalls().length;
		await expect(bot.client.stageInstances.create({ channel_id: channel.id, topic: '' })).rejects.toMatchObject({
			code: 'INVALID_STAGE_INSTANCE_TOPIC',
		});
		expect(bot.restCalls().length).toBe(before);
	});

	test('fetch, edit and delete round-trip through the channel-keyed routes', async () => {
		const world = mockWorld();
		const guild = world.registerGuild();
		const channel = world.registerChannel(guild.id, { type: 13 });
		const stage = world.registerStageInstance(channel.id, { topic });
		await using bot = await createMockBot({ world });

		await bot.client.cache.stageInstances?.flush();
		const fetched = await bot.client.stageInstances.fetch(channel.id);
		expect(fetched).toBeInstanceOf(StageInstance);
		expect(fetched).toMatchObject({ id: stage.id, channelId: channel.id, topic });
		expect(bot.restCalls(Routes.fetchStageInstance)).toContainEqual(
			expect.objectContaining({ params: { channelId: channel.id } }),
		);

		const edited = await fetched.edit({ topic: 'renamed stage' }, 'fix title');
		expect(edited.topic).toBe('renamed stage');
		expect(bot.restCalls(Routes.editStageInstance)).toContainEqual(
			expect.objectContaining({
				params: { channelId: channel.id },
				body: { topic: 'renamed stage' },
				reason: 'fix title',
			}),
		);

		await expect(bot.client.stageInstances.edit(channel.id, { topic: '' })).rejects.toMatchObject({
			code: 'INVALID_STAGE_INSTANCE_TOPIC',
		});

		await edited.delete('wrap up');
		expect(bot.world.query.stageInstance({ channelId: channel.id })).toBeUndefined();
		expect(bot.restCalls(Routes.deleteStageInstance)).toContainEqual(
			expect.objectContaining({ params: { channelId: channel.id }, reason: 'wrap up' }),
		);
		expect((await bot.client.cache.stageInstances?.raw(channel.id)) ?? undefined).toBeUndefined();
	});

	test('fetch prefers the cache unless forced', async () => {
		const world = mockWorld();
		const guild = world.registerGuild();
		const channel = world.registerChannel(guild.id, { type: 13 });
		world.registerStageInstance(channel.id, { topic });
		await using bot = await createMockBot({ world });

		await bot.client.stageInstances.fetch(channel.id);
		const before = bot.restCalls().length;
		const cached = await bot.client.stageInstances.fetch(channel.id);
		expect(cached.topic).toBe(topic);
		expect(bot.restCalls().length).toBe(before);

		await bot.client.stageInstances.fetch(channel.id, true);
		expect(bot.restCalls().length).toBeGreaterThan(before);
	});

	test('structure helpers delegate to the channel-keyed shorter', async () => {
		const world = mockWorld();
		const guild = world.registerGuild();
		const channel = world.registerChannel(guild.id, { type: 13 });
		world.registerStageInstance(channel.id, { topic });
		await using bot = await createMockBot({ world });

		const fetched = await bot.client.stageInstances.fetch(channel.id);
		expect((await fetched.fetch()).id).toBe(fetched.id);
		expect((await fetched.fetch(true)).id).toBe(fetched.id);

		const renamed = await fetched.edit({ topic: 'from structure' });
		expect(renamed.topic).toBe('from structure');

		const channelStructure = await bot.client.channels.fetch(channel.id);
		expect(channelStructure.isStage()).toBe(true);
		if (channelStructure.isStage()) {
			expect((await channelStructure.stage.fetch()).id).toBe(fetched.id);
			expect((await channelStructure.stage.fetch(true)).id).toBe(fetched.id);
			expect((await channelStructure.stage.edit({ topic: 'from channel' })).topic).toBe('from channel');
		}
	});

	test('guild create seeds the channel-keyed cache and gateway packets maintain it', async () => {
		const world = mockWorld();
		const guild = world.registerGuild();
		const channel = world.registerChannel(guild.id, { type: 13 });
		const stage = world.registerStageInstance(channel.id, { topic });
		await using bot = await createMockBot({ world });

		const guildPayload = {
			id: guild.id,
			stage_instances: [{ id: stage.id, guild_id: guild.id, channel_id: channel.id, topic, privacy_level: 2 }],
		} as never;
		await bot.client.cache.guilds?.set(1, guild.id, guildPayload);
		expect((await bot.client.cache.stageInstances?.raw(channel.id))?.id).toBe(stage.id);
		expect((await bot.client.cache.stageInstances?.get(channel.id))?.topic).toBe(topic);

		const updated = { id: stage.id, guild_id: guild.id, channel_id: channel.id, topic: 'live now', privacy_level: 2 };
		await bot.client.cache.onPacket({ t: 'STAGE_INSTANCE_UPDATE', d: updated } as never);
		expect((await bot.client.cache.stageInstances?.get(channel.id))?.topic).toBe('live now');

		await bot.client.cache.onPacket({ t: 'STAGE_INSTANCE_DELETE', d: updated } as never);
		expect((await bot.client.cache.stageInstances?.raw(channel.id)) ?? undefined).toBeUndefined();
	});

	test('rest edit leaves the previous topic for the gateway update', async () => {
		const world = mockWorld();
		const guild = world.registerGuild();
		const channel = world.registerChannel(guild.id, { type: 13 });
		world.registerStageInstance(channel.id, { topic });
		await using bot = await createMockBot({ world });

		bot.client.cache.intents = GatewayIntentBits.Guilds;
		await bot.client.cache.stageInstances?.flush();
		await bot.client.stageInstances.fetch(channel.id);

		// The default mock handler mirrors Discord by caching the REST write
		// itself, so override it here: only the shorter under test may touch
		// the cache, otherwise the old value could never survive the edit.
		bot.rest.intercept('PATCH', `/stage-instances/${channel.id}`, request => ({
			id: '900000000000000001',
			guild_id: guild.id,
			channel_id: channel.id,
			topic: (request.body as { topic: string }).topic,
			privacy_level: 2,
		}));

		const edited = await bot.client.stageInstances.edit(channel.id, { topic: 'from rest' });
		expect(edited.topic).toBe('from rest');
		// With guild state cached the REST write stays out of the way,
		// so the gateway payload still carries the previous topic.
		expect((await bot.client.cache.stageInstances?.raw(channel.id))?.topic).toBe(topic);

		const [updated, old] = await STAGE_INSTANCE_UPDATE(bot.client, {
			id: edited.id,
			guild_id: guild.id,
			channel_id: channel.id,
			topic: 'from rest',
			privacy_level: 2,
		} as never);
		expect(updated.topic).toBe('from rest');
		expect(old?.topic).toBe(topic);
	});

	test('gateway hooks return structures and keep the update old value', async () => {
		const world = mockWorld();
		const guild = world.registerGuild();
		const channel = world.registerChannel(guild.id, { type: 13 });
		const stage = world.registerStageInstance(channel.id, { topic });
		await using bot = await createMockBot({ world });
		const payload = stagePayload(channel.id, guild.id, stage.id);

		const created = STAGE_INSTANCE_CREATE(bot.client, payload as never);
		expect(created).toBeInstanceOf(StageInstance);
		expect(created.topic).toBe(topic);

		const deleted = STAGE_INSTANCE_DELETE(bot.client, payload as never);
		expect(deleted).toBeInstanceOf(StageInstance);

		await bot.client.cache.stageInstances?.set(1, channel.id, guild.id, payload as never);
		const [updated, old] = await STAGE_INSTANCE_UPDATE(bot.client, { ...payload, topic: 'new topic' } as never);
		expect(updated).toBeInstanceOf(StageInstance);
		expect(updated.topic).toBe('new topic');
		expect(old?.topic).toBe(topic);
	});
});
