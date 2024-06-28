import type { GatewayWebhooksUpdateDispatchData } from 'discord-api-types/v10';
import type { UsingClient } from '../../commands';
export declare const WEBHOOKS_UPDATE: (_self: UsingClient, data: GatewayWebhooksUpdateDispatchData) => {
    guildId: string;
    channelId: string;
};
