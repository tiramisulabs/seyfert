import type {
	GatewayChannelCreateDispatchData,
	GatewayChannelDeleteDispatchData,
	GatewayChannelPinsUpdateDispatchData,
	GatewayChannelUpdateDispatchData,
} from 'discord-api-types/v10';

import { toCamelCase } from '../../common';
import type { AllChannels } from '../../structures';
import channelFrom from '../../structures/channels';
import type { UsingClient } from '../../commands';

export const CHANNEL_CREATE = (self: UsingClient, data: GatewayChannelCreateDispatchData) => {
	return channelFrom(data, self);
};

export const CHANNEL_DELETE = (self: UsingClient, data: GatewayChannelDeleteDispatchData) => {
	return channelFrom(data, self);
};

export const CHANNEL_PINS_UPDATE = (_self: UsingClient, data: GatewayChannelPinsUpdateDispatchData) => {
	return toCamelCase(data);
};

export const CHANNEL_UPDATE = async (
	self: UsingClient,
	data: GatewayChannelUpdateDispatchData,
): Promise<[channel: AllChannels, old?: AllChannels]> => {
	return [channelFrom(data, self), await self.cache.channels?.get(data.id)];
};
