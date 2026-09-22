import { type StageInstanceStructure, Transformers } from '../../client/transformers';
import type { UsingClient } from '../../commands';
import type {
	GatewayStageInstanceCreateDispatchData,
	GatewayStageInstanceDeleteDispatchData,
	GatewayStageInstanceUpdateDispatchData,
} from '../../types';

export const STAGE_INSTANCE_CREATE = (
	self: UsingClient,
	data: GatewayStageInstanceCreateDispatchData,
): StageInstanceStructure => {
	return Transformers.StageInstance(self, data);
};

export const STAGE_INSTANCE_DELETE = (
	self: UsingClient,
	data: GatewayStageInstanceDeleteDispatchData,
): StageInstanceStructure => {
	return Transformers.StageInstance(self, data);
};

export const STAGE_INSTANCE_UPDATE = async (
	self: UsingClient,
	data: GatewayStageInstanceUpdateDispatchData,
): Promise<[stage: StageInstanceStructure, old?: StageInstanceStructure]> => {
	// Gateway dispatches carry the full instance, cache stays keyed by channel.
	return [Transformers.StageInstance(self, data), await self.cache.stageInstances?.get(data.channel_id)];
};
