import { ReturnCache } from '../..';
import { Transformers, VoiceChannelStructure, type VoiceStateStructure } from '../../client/transformers';
import type { UsingClient } from '../../commands';
import { CamelCase, ObjectToLower, toCamelCase } from '../../common';
import { AllChannels } from '../../structures';
import type {
	GatewayVoiceChannelEffectSendDispachData,
	GatewayVoiceChannelStartTimeUpdateDispatchData,
	GatewayVoiceChannelStatusUpdateDispatchData,
	GatewayVoiceServerUpdateDispatchData,
	GatewayVoiceStateUpdateDispatchData,
} from '../../types';

export const VOICE_SERVER_UPDATE = (_self: UsingClient, data: GatewayVoiceServerUpdateDispatchData) => {
	return toCamelCase(data);
};

export const VOICE_STATE_UPDATE = async (
	self: UsingClient,
	data: GatewayVoiceStateUpdateDispatchData,
): Promise<[state: VoiceStateStructure] | [state: VoiceStateStructure, old?: VoiceStateStructure]> => {
	if (!data.guild_id) return [Transformers.VoiceState(self, data)];
	return [Transformers.VoiceState(self, data), await self.cache.voiceStates?.get(data.user_id, data.guild_id)];
};

export const VOICE_CHANNEL_EFFECT_SEND = (_self: UsingClient, data: GatewayVoiceChannelEffectSendDispachData) => {
	return toCamelCase(data);
};

export const VOICE_CHANNEL_STATUS_UPDATE = async (
	self: UsingClient,
	data: GatewayVoiceChannelStatusUpdateDispatchData,
): Promise<[status: ObjectToLower<GatewayVoiceChannelStatusUpdateDispatchData>] | [status: ObjectToLower<GatewayVoiceChannelStatusUpdateDispatchData>, channel: ReturnCache<VoiceChannelStructure | undefined>]> => {
	return [toCamelCase(data), await self.cache.channels?.get(data.id) as never];
};

export const VOICE_CHANNEL_START_TIME_UPDATE = (
	_self: UsingClient,
	data: GatewayVoiceChannelStartTimeUpdateDispatchData,
) => {
	return toCamelCase(data);
};
