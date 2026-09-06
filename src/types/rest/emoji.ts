import type { Snowflake } from '..';
import type { APIEmoji } from '../payloads';

/**
 * https://docs.discord.com/developers/resources/emoji#list-guild-emojis
 */
export type RESTGetAPIGuildEmojisResult = APIEmoji[];

/**
 * https://docs.discord.com/developers/resources/emoji#get-guild-emoji
 */
export type RESTGetAPIGuildEmojiResult = APIEmoji;

/**
 * https://docs.discord.com/developers/resources/emoji#create-guild-emoji-json-params
 */
export interface RESTPostAPIGuildEmojiJSONBody {
	/**
	 * Name of the emoji
	 */
	name: string;
	/**
	 * The 128x128 emoji image
	 *
	 * https://docs.discord.com/developers/reference#image-data
	 */
	image: string;
	/**
	 * Roles for which this emoji will be whitelisted
	 */
	roles?: Snowflake[] | undefined;
}

/**
 * https://docs.discord.com/developers/resources/emoji#create-guild-emoji
 */
export type RESTPostAPIGuildEmojiResult = APIEmoji;

/**
 * https://docs.discord.com/developers/resources/emoji#modify-guild-emoji
 */
export interface RESTPatchAPIGuildEmojiJSONBody {
	/**
	 * Name of the emoji
	 */
	name?: string | undefined;
	/**
	 * Roles for which this emoji will be whitelisted
	 */
	roles?: Snowflake[] | null | undefined;
}

/**
 * https://docs.discord.com/developers/resources/emoji#modify-guild-emoji
 */
export type RESTPatchAPIGuildEmojiResult = APIEmoji;

/**
 * https://docs.discord.com/developers/resources/emoji#delete-guild-emoji
 */
export type RESTDeleteAPIGuildEmojiResult = undefined;
