import { describe, expect, test } from 'vitest';
import {
	GuildTemplate,
	MentionableSelectMenuInteraction,
	ModalSubmitInteraction,
	UserSelectMenuInteraction,
} from '../src/structures';

const memberData = { user: { id: 'u1' }, roles: [], permissions: '0' };

function interactionData(data: unknown, topMember = memberData) {
	return {
		id: '1',
		token: 't',
		user: { id: 'u1' },
		member: topMember,
		entitlements: [],
		app_permissions: '0',
		channel: { id: 'c1' },
		channel_id: 'c1',
		message: undefined,
		data,
	} as never;
}

describe('interaction structure resolution', () => {
	test('mentionable select maps values only to their own resolved maps', () => {
		const menu = new MentionableSelectMenuInteraction(
			{ cache: {} } as never,
			interactionData({
				component_type: 7,
				custom_id: 'm',
				values: ['r1', 'u1'],
				resolved: {
					roles: { r1: { id: 'r1', name: 'role', permissions: '0' } },
					members: { u1: memberData },
					users: { u1: { id: 'u1', username: 'u' } },
				},
			}),
		);
		expect(menu.roles.map(r => r.id)).toEqual(['r1']);
		expect(menu.members.map(m => m.user.id)).toEqual(['u1']);
		expect(menu.users.map(u => u.id)).toEqual(['u1']);
	});

	test('user select omits selected users that are not guild members', () => {
		const menu = new UserSelectMenuInteraction(
			{ cache: {} } as never,
			interactionData({
				component_type: 5,
				custom_id: 'u',
				values: ['u1', 'u2'],
				resolved: {
					members: { u1: memberData },
					users: {
						u1: { id: 'u1', username: 'a' },
						u2: { id: 'u2', username: 'b' },
					},
				},
			}),
		);
		expect(menu.users.map(u => u.id)).toEqual(['u1', 'u2']);
		expect(menu.members.map(m => m.user.id)).toEqual(['u1']);
	});

	test('getFiles returns only the attachments of the requested component', () => {
		const modal = new ModalSubmitInteraction(
			{ cache: {} } as never,
			interactionData(
				{
					custom_id: 'modal',
					components: [
						{ type: 18, component: { type: 19, custom_id: 'uploadA', values: ['a1'] } },
						{ type: 18, component: { type: 19, custom_id: 'uploadB', values: ['b1'] } },
					],
					resolved: {
						attachments: {
							a1: { id: 'a1', url: 'http://a', filename: 'a.png', size: 1 },
							b1: { id: 'b1', url: 'http://b', filename: 'b.png', size: 1 },
						},
					},
				},
				undefined,
			),
			undefined as never,
		);
		expect(modal.getFiles('uploadA')?.map(f => f.id)).toEqual(['a1']);
		expect(modal.getFiles('uploadB')?.map(f => f.id)).toEqual(['b1']);
	});

	test('GuildTemplate.fetch requests the template code, not the source guild id', async () => {
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