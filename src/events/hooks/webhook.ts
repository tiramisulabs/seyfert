import type { GatewayWebhooksUpdateDispatchData } from 'discord-api-types/v10';
import type { BaseClient } from '../../client/base';
import { toCamelCase } from '../../common';

export const WEBHOOKS_UPDATE = (_self: BaseClient, data: GatewayWebhooksUpdateDispatchData) => {
	return toCamelCase(data);
};
