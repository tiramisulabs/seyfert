import type { GatewayChannelCreateDispatchData, GatewayChannelDeleteDispatchData, GatewayChannelPinsUpdateDispatchData, GatewayChannelUpdateDispatchData } from 'discord-api-types/v10';
import type { AllChannels } from '../../structures';
import type { UsingClient } from '../../commands';
export declare const CHANNEL_CREATE: (self: UsingClient, data: GatewayChannelCreateDispatchData) => AllChannels;
export declare const CHANNEL_DELETE: (self: UsingClient, data: GatewayChannelDeleteDispatchData) => AllChannels;
export declare const CHANNEL_PINS_UPDATE: (_self: UsingClient, data: GatewayChannelPinsUpdateDispatchData) => {
    guildId?: string | undefined;
    channelId: string;
    lastPinTimestamp?: string | null | undefined;
};
export declare const CHANNEL_UPDATE: (self: UsingClient, data: GatewayChannelUpdateDispatchData) => Promise<[channel: AllChannels, old?: AllChannels]>;
