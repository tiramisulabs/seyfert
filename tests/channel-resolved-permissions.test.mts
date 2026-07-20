import { describe, expect, test } from 'vitest';
import {
	type APIInteractionDataResolvedChannel,
	ChannelType,
	PermissionFlagsBits,
	channelFrom,
} from '../lib';

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

		expect(channel.permissions?.bits).toBe(PermissionFlagsBits.ViewChannel);
		expect(channel.appPermissions?.bits).toBe(PermissionFlagsBits.SendMessages);
	});
});
