import { describe, expect, test } from 'vitest';
import { GuildTemplate } from '../src/structures';

describe('GuildTemplate', () => {
	test('fetch requests the template code, not the source guild id', async () => {
		const codes: string[] = [];
		const template = new GuildTemplate(
			{
				templates: {
					fetch: (code: string) => {
						codes.push(code);
						return Promise.resolve({} as never);
					},
				},
			} as never,
			{
				code: 'Rr72fMx2pPnz',
				name: 't',
				description: null,
				usage_count: 1,
				creator_id: '1',
				created_at: '2020',
				updated_at: '2020',
				source_guild_id: '100000000000000000',
				serialized_source_guild: {},
				is_dirty: null,
			} as never,
		);
		await template.fetch();
		expect(codes).toEqual(['Rr72fMx2pPnz']);
	});
});
