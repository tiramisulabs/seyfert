import type {
	GatewayStageInstanceCreateDispatchData,
	GatewayStageInstanceDeleteDispatchData,
} from 'discord-api-types/v10';

import type { BaseClient } from '../../client/base';
import { toCamelCase } from '../../common';

export const STAGE_INSTANCE_CREATE = (_self: BaseClient, data: GatewayStageInstanceCreateDispatchData) => {
	return toCamelCase(data);
};

export const STAGE_INSTANCE_DELETE = (_self: BaseClient, data: GatewayStageInstanceDeleteDispatchData) => {
	return toCamelCase(data);
};

export const STAGE_INSTANCE_UPDATE = (_self: BaseClient, data: GatewayStageInstanceDeleteDispatchData) => {
	return toCamelCase(data);
};
