import type { GatewayWebhooksUpdateDispatchData } from '../../types';
import { toCamelCase } from '../../common';
import type { UsingClient } from '../../commands';

export const WEBHOOKS_UPDATE = (_self: UsingClient, data: GatewayWebhooksUpdateDispatchData) => {
	return toCamelCase(data);
};
