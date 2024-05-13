import type { GatewayVoiceServerUpdateDispatchData, GatewayVoiceStateUpdateDispatchData } from '../../types';
import { toCamelCase } from '../../common';
import { VoiceState } from '../../structures';
import type { UsingClient } from '../../commands';

export const VOICE_SERVER_UPDATE = (_self: UsingClient, data: GatewayVoiceServerUpdateDispatchData) => {
	return toCamelCase(data);
};

export const VOICE_STATE_UPDATE = async (
	self: UsingClient,
	data: GatewayVoiceStateUpdateDispatchData,
): Promise<[VoiceState] | [state: VoiceState, old?: VoiceState]> => {
	if (!data.guild_id) return [new VoiceState(self, data)];
	return [new VoiceState(self, data), await self.cache.voiceStates?.get(data.user_id, data.guild_id)];
};
