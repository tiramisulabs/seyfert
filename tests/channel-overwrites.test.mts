import { describe, expect, test, vi } from 'vitest';
import { Cache, MemoryAdapter } from '../lib';
import { ChannelShorter } from '../lib/common/shorters/channels';
import { OverwriteType } from '../lib/types';

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
			{ allow: '1', deny: '2', type: OverwriteType.Member },
			{ guildId, reason: 'set overwrite' },
		);

		const cached = await client.cache.overwrites?.raw(channelId);
		expect(cached).toEqual([
			{ allow: '1', deny: '2', guild_id: guildId, id: overwriteId, type: OverwriteType.Member },
		]);
		expect(put).toHaveBeenCalledWith({
			body: { allow: '1', deny: '2', type: OverwriteType.Member },
			reason: 'set overwrite',
		});

		await channelShorter.deleteOverwrite(channelId, overwriteId, { guildId, reason: 'remove overwrite' });

		const afterDelete = await client.cache.overwrites?.raw(channelId);
		expect(afterDelete ?? undefined).toBeUndefined();
		expect(del).toHaveBeenCalledWith({ reason: 'remove overwrite' });
	});
});
