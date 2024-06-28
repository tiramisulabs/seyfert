import type { GatewayVoiceServerUpdateDispatchData, GatewayVoiceStateUpdateDispatchData } from '../../types';
import type { UsingClient } from '../../commands';
import { type VoiceStateStructure } from '../../client/transformers';
export declare const VOICE_SERVER_UPDATE: (_self: UsingClient, data: GatewayVoiceServerUpdateDispatchData) => {
    token: string;
    guildId: string;
    endpoint: string | null;
};
export declare const VOICE_STATE_UPDATE: (self: UsingClient, data: GatewayVoiceStateUpdateDispatchData) => Promise<[state: VoiceStateStructure] | [state: VoiceStateStructure, old?: VoiceStateStructure]>;
