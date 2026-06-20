import { describe, expect, test, vi } from 'vitest';
import { Cache, CacheFrom, MemoryAdapter } from '../src';
import { ChannelShorter } from '../src/common/shorters/channels';
import { OverwriteType } from '../src/types';

describe('channel overwrites endpoint', () => {
	const channelId = '123';
	const overwriteId = '456';
	const guildId = '789';

	const createClient = () => {
		const put = vi.fn().mockResolvedValue(undefined);
		const del = vi.fn().mockResolvedValue(undefined);

		const client: any = {};
		client.cache = new Cache(0, new MemoryAdapter(), {}, client);
		client.proxy = {
			channels(id: string) {
				expect(id).toBe(channelId);
				return {
					permissions(targetId: string) {
						expect(targetId).toBe(overwriteId);
						return {
							put,
							delete: del,
						};
					},
				};
			},
		};

		return { client, put, del };
	};

	test('edit and delete overwrite keeps cache in sync', async () => {
		const { client, put, del } = createClient();
		const channelShorter = new ChannelShorter(client);

		await channelShorter.editOverwrite(
			channelId,
			overwriteId,
			{ allow: ['KickMembers'], deny: ['BanMembers'], type: OverwriteType.Member },
			{ guildId, reason: 'set overwrite' },
		);

		const cached = await client.cache.overwrites?.raw(channelId);
		expect(cached).toEqual([
			{ allow: '2', deny: '4', guild_id: guildId, id: overwriteId, type: OverwriteType.Member },
		]);
		expect(put).toHaveBeenCalledWith({
			body: { allow: '2', deny: '4', type: OverwriteType.Member },
			reason: 'set overwrite',
		});

		await channelShorter.deleteOverwrite(channelId, overwriteId, { guildId, reason: 'remove overwrite' });

		const afterDelete = await client.cache.overwrites?.raw(channelId);
		expect(afterDelete ?? undefined).toBeUndefined();
		expect(del).toHaveBeenCalledWith({ reason: 'remove overwrite' });
	});
	test('raw channel rehydrates overwrites without mutating cached channel data', async () => {
		const client: any = {};
		client.cache = new Cache(0, new MemoryAdapter(), {}, client);
		client.proxy = {
			channels: vi.fn(),
		};
		const channelShorter = new ChannelShorter(client);
		const channel = { guild_id: guildId, id: channelId, name: 'general', type: 0 };
		const overwrites = [{ allow: '2', deny: '4', id: overwriteId, type: OverwriteType.Member }];

		await client.cache.channels?.set(CacheFrom.Rest, channelId, guildId, channel);
		await client.cache.overwrites?.set(CacheFrom.Rest, channelId, guildId, overwrites);

		const raw = await channelShorter.raw(channelId);
		const cachedRaw = await client.cache.channels?.raw(channelId);

		expect(raw).toMatchObject({ permission_overwrites: [{ guild_id: guildId, id: overwriteId }] });
		expect(cachedRaw).not.toHaveProperty('permission_overwrites');
	});

});
