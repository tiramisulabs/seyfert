import type {
	GatewayStageInstanceCreateDispatchData,
	GatewayStageInstanceDeleteDispatchData,
	GatewayStageInstanceUpdateDispatchData,
} from 'discord-api-types/v10';
import type { UsingClient } from '../../commands';
import { type ObjectToLower, toCamelCase } from '../../common';
import type { StageInstances } from '../../cache/resources/stage-instances';

export const STAGE_INSTANCE_CREATE = (_self: UsingClient, data: GatewayStageInstanceCreateDispatchData) => {
	return toCamelCase(data);
};

export const STAGE_INSTANCE_DELETE = (_self: UsingClient, data: GatewayStageInstanceDeleteDispatchData) => {
	return toCamelCase(data);
};

export const STAGE_INSTANCE_UPDATE = async (
	self: UsingClient,
	data: GatewayStageInstanceUpdateDispatchData,
): Promise<[stage: ObjectToLower<GatewayStageInstanceUpdateDispatchData>, old?: ReturnType<StageInstances['get']>]> => {
	return [toCamelCase(data), await self.cache.stageInstances?.get(data.id)];
};
