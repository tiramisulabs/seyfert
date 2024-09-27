/**
 * Types extracted from https://discord.com/developers/docs/resources/soundboard
 */

import type { APIUser } from './user';

/** https://discord.com/developers/docs/resources/soundboard#soundboard-sound-object-soundboard-sound-structure */
export interface APISoundBoard {
	/**	the name of this sound */
	name: string;
	/**	the id of this sound */
	sound_id: string;
	/**	the volume of this sound, from 0 to 1 */
	volume: number;
	/** the id of this sound's custom emoji */
	emoji_id: string | null;
	/**	the unicode character of this sound's standard emoji */
	emoji_name: string | null;
	/** the id of the guild this sound is in */
	guild_id?: string;
	/**	whether this sound can be used, may be false due to loss of Server Boosts */
	available: boolean;
	/** the user who created this sound */
	user?: APIUser;
}
