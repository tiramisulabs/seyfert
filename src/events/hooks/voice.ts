import type { GatewayVoiceServerUpdateDispatchData, GatewayVoiceStateUpdateDispatchData } from '../../types';
import { toCamelCase } from '../../common';
import type { UsingClient } from '../../commands';
import { Transformers, type VoiceStateStructure } from '../../client/transformers';

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
