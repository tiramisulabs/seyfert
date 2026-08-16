import type { APIVoiceRegion, APIVoiceState } from '../payloads';
/**
 * https://docs.discord.com/developers/resources/voice#list-voice-regions
 */
export type RESTGetAPIVoiceRegionsResult = APIVoiceRegion[];

/**
 * https://docs.discord.com/developers/resources/voice#get-current-user-voice-state
 */
export type RESTGetAPICurrentUserVoiceState = RESTGetAPIUserVoiceState;

/**
 * https://docs.discord.com/developers/resources/voice#get-current-user-voice-state
 */
export type RESTGetAPIGuildVoiceStateCurrentMemberResult = APIVoiceState;

/**
 * https://docs.discord.com/developers/resources/voice#get-user-voice-state
 */
export type RESTGetAPIUserVoiceState = APIVoiceState;

/**
 * https://docs.discord.com/developers/resources/voice#get-user-voice-state
 */
export type RESTGetAPIGuildVoiceStateUserResult = APIVoiceState;
