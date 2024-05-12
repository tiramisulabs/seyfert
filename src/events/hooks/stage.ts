import type {
	GatewayStageInstanceCreateDispatchData,
	GatewayStageInstanceDeleteDispatchData,
	GatewayStageInstanceUpdateDispatchData,
} from 'discord-api-types/v10';

import type { BaseClient } from '../../client/base';
import { type ObjectToLower, toCamelCase } from '../../common';
import type { StageInstances } from '../../cache/resources/stage-instances';

export const STAGE_INSTANCE_CREATE = (_self: BaseClient, data: GatewayStageInstanceCreateDispatchData) => {
	return toCamelCase(data);
};

export const STAGE_INSTANCE_DELETE = (_self: BaseClient, data: GatewayStageInstanceDeleteDispatchData) => {
	return toCamelCase(data);
};

export const STAGE_INSTANCE_UPDATE = async (
	self: BaseClient,
	data: GatewayStageInstanceUpdateDispatchData,
): Promise<[stage: ObjectToLower<GatewayStageInstanceUpdateDispatchData>, old?: ReturnType<StageInstances['get']>]> => {
	return [toCamelCase(data), await self.cache.stageInstances?.get(data.id)];
};
