import type { UsingClient } from '../../commands';
import { toCamelCase } from '../../common';
import type { GatewayWebhooksUpdateDispatchData } from '../../types';

export const WEBHOOKS_UPDATE = (_self: UsingClient, data: GatewayWebhooksUpdateDispatchData) => {
	return toCamelCase(data);
};
