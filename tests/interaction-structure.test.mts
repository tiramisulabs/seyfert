import { describe, expect, test } from 'vitest';
import {
	MentionableSelectMenuInteraction,
	ModalSubmitInteraction,
	UserSelectMenuInteraction,
} from '../src/structures';

const guildId = '100000000000000000';

// Top-level guild interaction member, as Discord sends it (the nested user is included).
const topLevelMember = {
	user: { id: 'u1', username: 'top' },
	roles: [],
	permissions: '0',
};

// Resolved guild members omit the user; the user is delivered separately in resolved.users.
const resolvedMember = {
	roles: [],
	permissions: '0',
};

const resolvedUser = { id: 'u1', username: 'u' };

function interactionData(data: unknown, member = topLevelMember) {
	return {
		id: '1',
		guild_id: guildId,
		token: 't',
		user: { id: 'u1' },
		member,
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
					members: { u1: resolvedMember },
					users: { u1: resolvedUser },
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
					members: { u1: resolvedMember },
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
			interactionData({
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
			}),
			undefined as never,
		);
		expect(modal.getFiles('uploadA')?.map(f => f.id)).toEqual(['a1']);
		expect(modal.getFiles('uploadB')?.map(f => f.id)).toEqual(['b1']);
	});
});
