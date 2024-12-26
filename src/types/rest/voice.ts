import type { APIVoiceRegion, APIVoiceState } from '../payloads';

/**
 * https://discord.com/developers/docs/resources/voice#list-voice-regions
 */
export type RESTGetAPIVoiceRegionsResult = APIVoiceRegion[];

/**
 * https://discord.com/developers/docs/resources/voice#get-current-user-voice-state
 */
export type RESTGetAPICurrentUserVoiceState = RESTGetAPIUserVoiceState;

/**
 * https://discord.com/developers/docs/resources/voice#get-user-voice-state
 */
export type RESTGetAPIUserVoiceState = APIVoiceState;
