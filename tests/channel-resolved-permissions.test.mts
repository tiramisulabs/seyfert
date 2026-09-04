import { describe, expect, test } from 'vitest';
import { type APIInteractionDataResolvedChannel, ChannelType, channelFrom, PermissionFlagsBits } from '../lib';

describe('resolved channel permissions', () => {
	test('transforms user and app permissions into bitfields', () => {
		const data = {
			id: '100000000000000001',
			name: 'general',
			type: ChannelType.GuildText,
			permissions: PermissionFlagsBits.ViewChannel.toString(),
			app_permissions: PermissionFlagsBits.SendMessages.toString(),
		} satisfies APIInteractionDataResolvedChannel;
		const channel = channelFrom(data, {} as never);

		expect(channel.isGuild()).toBe(true);
		expect(channel.permissions.bits).toBe(PermissionFlagsBits.ViewChannel);
		expect(channel.appPermissions?.bits).toBe(PermissionFlagsBits.SendMessages);

		const camelizedChannel = channelFrom(
			{
				...data,
				app_permissions: undefined,
				appPermissions: PermissionFlagsBits.SendMessages.toString(),
			},
			{} as never,
		);
		expect(camelizedChannel.appPermissions?.bits).toBe(PermissionFlagsBits.SendMessages);
	});

	test('does not transform resolved permission fields on DM structures', () => {
		for (const type of [ChannelType.DM, ChannelType.GroupDM]) {
			const data = {
				id: '100000000000000002',
				name: null,
				type,
				permissions: PermissionFlagsBits.ViewChannel.toString(),
				app_permissions: PermissionFlagsBits.SendMessages.toString(),
			};
			const channel = channelFrom(data, {} as never);

			expect(channel.isDM()).toBe(true);
			expect(channel).toHaveProperty('permissions', PermissionFlagsBits.ViewChannel.toString());
			expect(channel).toHaveProperty('appPermissions', PermissionFlagsBits.SendMessages.toString());
		}
	});

	test('transforms resolved group DMs into message-capable DM structures', () => {
		const data = {
			id: '100000000000000003',
			name: 'group',
			type: ChannelType.GroupDM,
		} satisfies APIInteractionDataResolvedChannel;
		const channel = channelFrom(data, {} as never);

		expect(channel.isDM()).toBe(true);
		expect(channel).toHaveProperty('messages');
	});
});
