import { Routes, createMockBot, mockWorld } from '@slipher/testing';
import { describe, expect, test } from 'vitest';
import { OverwriteType } from '../lib';

describe('channel overwrites endpoint', () => {
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
		const edit = bot.rest.requireAction(Routes.editChannelPermissions, {
			channelId: channel.id,
			overwriteId: member.user.id,
		});
		expect(edit.body).toEqual({ allow: '2', deny: '4', type: OverwriteType.Member });
		expect(edit.reason).toBe('set overwrite');

		await bot.client.channels.deleteOverwrite(channel.id, member.user.id, {
			guildId: guild.id,
			reason: 'remove overwrite',
		});

		expect((await bot.client.cache.overwrites?.raw(channel.id)) ?? undefined).toBeUndefined();
		expect(bot.world.get.channel({ id: channel.id }).overwrites).toEqual([]);
		const removed = bot.rest.requireAction(Routes.deleteChannelPermission, {
			channelId: channel.id,
			overwriteId: member.user.id,
		});
		expect(removed.reason).toBe('remove overwrite');
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
