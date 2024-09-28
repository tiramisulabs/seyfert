import type { APISoundBoard } from '../payloads/soundboard';

/**
 * https://discord.com/developers/docs/resources/soundboard#send-soundboard-sound
 * @fires VoiceChannelEffectSend
 * @requires Permissions Speak and UseSoundboard
 * @satisfies VoiceState without deaf, self_deaf, mute, or suppress enabled.
 */
export interface RESTPostAPISendSoundboardSound {
	/** the id of the soundboard sound to play */
	sound_id: string;
	/** the id of the guild the soundboard sound is from, required to play sounds from different servers */
	source_guild_id?: string;
}

/**
 * https://discord.com/developers/docs/resources/soundboard#list-default-soundboard-sounds
 */
export type RESTGetAPIDefaultsSoundboardSoundsResult = Omit<APISoundBoard, 'user' | 'guild_id'>[];

/**
 * https://discord.com/developers/docs/resources/soundboard#list-guild-soundboard-sounds
 */
export type RESTGetAPIGuildSoundboardSoundsResult = { items: APISoundBoard[] };

/**
 * https://discord.com/developers/docs/resources/soundboard#create-guild-soundboard-sound
 *
 * Soundboard sounds have a max file size of 512kb and a max duration of 5.2 seconds.
 * This endpoint supports the X-Audit-Log-Reason header.
 * @requires Permission CreateGuildExpressions
 */
export interface RESTPostAPIGuildSoundboardSound {
	/** name of the soundboard sound (2-32 characters) */
	name: string;
	/**	the mp3 or ogg sound data, base64 encoded, similar to image data */
	sound: string;
	/**	the volume of the soundboard sound, from 0 to 1, defaults to 1 */
	volume?: number | null;
	/**	the id of the custom emoji for the soundboard sound */
	emoji_id?: string | null;
	/**	the unicode character of a standard emoji for the soundboard sound */
	emoji_name?: string | null;
}

export type RESTPostAPIGuildSoundboardSoundResult = APISoundBoard;

/**
 * https://discord.com/developers/docs/resources/soundboard#modify-guild-soundboard-sound
 * @fires GuildSoundboardSoundUpdate
 */
export interface RESTPatchAPIGuildSoundboardSound {
	/** name of the soundboard sound (2-32 characters) */
	name?: string;
	/**	the volume of the soundboard sound, from 0 to 1, defaults to 1 */
	volume?: number | null;
	/**	the id of the custom emoji for the soundboard sound */
	emoji_id?: string | null;
	/**	the unicode character of a standard emoji for the soundboard sound */
	emoji_name?: string | null;
}

export type RESTPatchAPIGuildSoundboardSoundResult = APISoundBoard;

/**
 * https://discord.com/developers/docs/resources/soundboard#delete-guild-soundboard-sound
 * This endpoint supports the X-Audit-Log-Reason header.
 * @fires GuildSoundboardSoundDelete
 */
export type RESTDeleteAPIGuildSoundboardSoundResult = never;
