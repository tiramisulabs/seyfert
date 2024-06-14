import type { GatewayWebhooksUpdateDispatchData } from 'discord-api-types/v10';
import { toCamelCase } from '../../common';
import type { UsingClient } from '../../commands';

export const WEBHOOKS_UPDATE = (_self: UsingClient, data: GatewayWebhooksUpdateDispatchData) => {
	return toCamelCase(data);
};
