import type { GatewayVoiceServerUpdateDispatchData, GatewayVoiceStateUpdateDispatchData } from '../../types';
import type { BaseClient } from '../../client/base';
import { toCamelCase } from '../../common';
import { VoiceState } from '../../structures';

export const VOICE_SERVER_UPDATE = (_self: BaseClient, data: GatewayVoiceServerUpdateDispatchData) => {
	return toCamelCase(data);
};

export const VOICE_STATE_UPDATE = async (
	self: BaseClient,
	data: GatewayVoiceStateUpdateDispatchData,
): Promise<[VoiceState] | [state: VoiceState, old?: VoiceState]> => {
	if (!data.guild_id) return [new VoiceState(self, data)];
	return [new VoiceState(self, data), await self.cache.voiceStates?.get(data.user_id, data.guild_id)];
};
