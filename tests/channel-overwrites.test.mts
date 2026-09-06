import { createMockBot, mockWorld, Routes } from '@slipher/testing';
import { describe, expect, test } from 'vitest';
import { Client, GatewayIntentBits, LimitedMemoryAdapter, MemoryAdapter, OverwriteType } from '../lib';

describe('channel overwrites endpoint', () => {
	test.each([
		['MemoryAdapter', MemoryAdapter],
		['LimitedMemoryAdapter', LimitedMemoryAdapter],
	] as const)('channel edits preserve guild ownership with %s', async (_name, Adapter) => {
		const world = mockWorld();
		const guild = world.registerGuild();
		const role = world.registerRole(guild.id);
		const channel = world.registerChannel(guild.id, {
			overwrites: [{ id: role.id, type: 'role', allow: ['KickMembers'], deny: [] }],
		});
		const client = new Client();
		const adapter = new Adapter();
		client.setServices({ cache: { adapter } });
		await using bot = await createMockBot({ world, client });
		client.cache.intents = 0;
		const raw = await client.channels.raw(channel.id, true);
		bot.rest.intercept(Routes.editChannel, () => ({ ...raw, name: 'edited', permission_overwrites: [] }));

		await client.channels.edit(channel.id, { name: 'edited', permission_overwrites: [] });

		expect(await client.cache.channels?.raw(channel.id)).toMatchObject({ guild_id: guild.id, name: 'edited' });
		expect(await client.cache.overwrites?.raw(channel.id)).toEqual([]);
		expect(await client.cache.channels?.keys('@me')).toEqual([]);
		expect(await client.cache.overwrites?.keys('@me')).toEqual([]);

		client.cache.intents = GatewayIntentBits.Guilds;
		const overwrites = [{ id: role.id, type: OverwriteType.Role, allow: '2', deny: '0' }];
		bot.rest.intercept(Routes.editChannel, () => ({ ...raw, name: 'pending', permission_overwrites: overwrites }));
		await client.channels.edit(channel.id, { name: 'pending', permission_overwrites: overwrites });
		expect(await client.cache.channels?.raw(channel.id)).toMatchObject({ name: 'edited' });
		expect(await client.cache.overwrites?.raw(channel.id)).toEqual([]);

		await client.cache.guilds?.remove(guild.id);
		expect(adapter.scan('channel.*')).toEqual([]);
		expect(adapter.scan('overwrite.*')).toEqual([]);
	});

	test('edit and delete overwrite keeps the real cache and world in sync', async () => {
		const world = mockWorld();
		const guild = world.registerGuild({ everyonePermissions: ['ManageRoles'] });
		const channel = world.registerChannel(guild.id);
		const member = world.registerMember(guild.id);
		await using bot = await createMockBot({ world });

		await bot.client.channels.editOverwrite(
			channel.id,
			member.user.id,
			{ allow: ['KickMembers'], deny: ['BanMembers'], type: OverwriteType.Member },
			{ guildId: guild.id, reason: 'set overwrite' },
		);

		expect(await bot.client.cache.overwrites?.raw(channel.id)).toEqual([
			{ allow: '2', deny: '4', guild_id: guild.id, id: member.user.id, type: OverwriteType.Member },
		]);
		expect(bot.world.get.channel({ id: channel.id }).overwrites).toEqual([
			{ allow: '2', deny: '4', id: member.user.id, type: OverwriteType.Member },
		]);
		expect(bot.restCalls(Routes.editChannelPermissions)).toContainEqual(
			expect.objectContaining({
				params: { channelId: channel.id, overwriteId: member.user.id },
				body: { allow: '2', deny: '4', type: OverwriteType.Member },
				reason: 'set overwrite',
			}),
		);

		await bot.client.channels.deleteOverwrite(channel.id, member.user.id, {
			guildId: guild.id,
			reason: 'remove overwrite',
		});

		expect((await bot.client.cache.overwrites?.raw(channel.id)) ?? undefined).toBeUndefined();
		expect(bot.world.get.channel({ id: channel.id }).overwrites).toEqual([]);
		expect(bot.restCalls(Routes.deleteChannelPermission)).toContainEqual(
			expect.objectContaining({
				params: { channelId: channel.id, overwriteId: member.user.id },
				reason: 'remove overwrite',
			}),
		);
	});

	test('raw channel rehydrates overwrites without mutating cached channel data', async () => {
		const world = mockWorld();
		const guild = world.registerGuild();
		const role = world.registerRole(guild.id);
		const channel = world.registerChannel(guild.id, {
			overwrites: [{ id: role.id, type: 'role', allow: ['KickMembers'], deny: ['BanMembers'] }],
		});
		await using bot = await createMockBot({ world });

		const raw = await bot.client.channels.raw(channel.id);
		const cachedRaw = await bot.client.cache.channels?.raw(channel.id);

		expect(raw).toMatchObject({
			guild_id: guild.id,
			permission_overwrites: [{ guild_id: guild.id, id: role.id }],
		});
		expect(cachedRaw).not.toHaveProperty('permission_overwrites');
	});
});
