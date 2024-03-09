import type { BaseClient } from '../../client/base';
import type { GatewayWebhooksUpdateDispatchData } from '../../common';
import { toCamelCase } from '../../common';

export const WEBHOOKS_UPDATE = (_self: BaseClient, data: GatewayWebhooksUpdateDispatchData) => {
	return toCamelCase(data);
};
