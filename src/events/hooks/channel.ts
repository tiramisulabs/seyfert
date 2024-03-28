import type {
	GatewayChannelCreateDispatchData,
	GatewayChannelDeleteDispatchData,
	GatewayChannelPinsUpdateDispatchData,
	GatewayChannelUpdateDispatchData,
} from 'discord-api-types/v10';

import type { BaseClient } from '../../client/base';
import { toCamelCase } from '../../common';
import type { AllChannels } from '../../structures';
import channelFrom from '../../structures/channels';

export const CHANNEL_CREATE = (self: BaseClient, data: GatewayChannelCreateDispatchData) => {
	return channelFrom(data, self);
};

export const CHANNEL_DELETE = (self: BaseClient, data: GatewayChannelDeleteDispatchData) => {
	return channelFrom(data, self);
};

export const CHANNEL_PINS_UPDATE = (_self: BaseClient, data: GatewayChannelPinsUpdateDispatchData) => {
	return toCamelCase(data);
};

export const CHANNEL_UPDATE = async (
	self: BaseClient,
	data: GatewayChannelUpdateDispatchData,
): Promise<[channel: AllChannels, old?: AllChannels]> => {
	return [channelFrom(data, self), await self.cache.channels?.get(data.id)];
};
