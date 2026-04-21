import type { Snowflake } from '..';
import type { APISoundboardSound } from '../payloads/soundboard';

/**
 * https://discord.com/developers/docs/resources/soundboard#send-soundboard-sound
 * @fires VoiceChannelEffectSend
 * @requires Permissions Speak and UseSoundboard
 * @satisfies VoiceState without deaf, self_deaf, mute, or suppress enabled.
 */
export type RESTPostAPISendSoundboardSoundResult = undefined;

/**
 * https://discord.com/developers/docs/resources/soundboard#send-soundboard-sound-json-params
 */
export interface RESTPostAPISoundboardSendSoundJSONBody {
	/** the id of the soundboard sound to play */
	sound_id: Snowflake;
	/** the id of the guild the soundboard sound is from, required to play sounds from different servers */
	source_guild_id?: Snowflake;
}

/**
 * https://discord.com/developers/docs/resources/soundboard#list-default-soundboard-sounds
 */
export type RESTGetAPISoundboardDefaultSoundsResult = APISoundboardSound[];

/**
 * https://discord.com/developers/docs/resources/soundboard#list-guild-soundboard-sounds
 */
export type RESTGetAPIGuildSoundboardSoundsResult = { items: APISoundboardSound[] };

/**
 * https://discord.com/developers/docs/resources/soundboard#get-guild-soundboard-sound
 */
export type RESTGetAPIGuildSoundboardSoundResult = APISoundboardSound;

/**
 * https://discord.com/developers/docs/resources/soundboard#create-guild-soundboard-sound
 *
 * Soundboard sounds have a max file size of 512kb and a max duration of 5.2 seconds.
 * This endpoint supports the X-Audit-Log-Reason header.
 * @requires Permission CreateGuildExpressions
 */
export interface RESTPostAPIGuildSoundboardSoundJSONBody {
	/** name of the soundboard sound (2-32 characters) */
	name: string;
	/**	the mp3 or ogg sound data, base64 encoded, similar to image data */
	sound: string;
	/**	the volume of the soundboard sound, from 0 to 1, defaults to 1 */
	volume?: number | null;
	/**	the id of the custom emoji for the soundboard sound */
	emoji_id?: Snowflake | null;
	/**	the unicode character of a standard emoji for the soundboard sound */
	emoji_name?: string | null;
}

export type RESTPostAPIGuildSoundboardSoundResult = APISoundboardSound;

/**
 * https://discord.com/developers/docs/resources/soundboard#modify-guild-soundboard-sound
 * @fires GuildSoundboardSoundUpdate
 */
export interface RESTPatchAPIGuildSoundboardSoundJSONBody {
	/** name of the soundboard sound (2-32 characters) */
	name?: string;
	/**	the volume of the soundboard sound, from 0 to 1, defaults to 1 */
	volume?: number | null;
	/**	the id of the custom emoji for the soundboard sound */
	emoji_id?: Snowflake | null;
	/**	the unicode character of a standard emoji for the soundboard sound */
	emoji_name?: string | null;
}

export type RESTPatchAPIGuildSoundboardSoundResult = APISoundboardSound;

/**
 * https://discord.com/developers/docs/resources/soundboard#delete-guild-soundboard-sound
 * This endpoint supports the X-Audit-Log-Reason header.
 * @fires GuildSoundboardSoundDelete
 */
export type RESTDeleteAPIGuildSoundboardSoundResult = undefined;
