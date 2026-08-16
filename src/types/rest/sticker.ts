import type { APISticker, APIStickerPack } from '../payloads';

/**
 * https://docs.discord.com/developers/resources/sticker#get-sticker
 */
export type RESTGetAPIStickerResult = APISticker;

/**
 * https://docs.discord.com/developers/resources/sticker#list-sticker-packs
 */
export interface RESTGetStickerPacksResult {
	sticker_packs: APIStickerPack[];
}

/**
 * https://docs.discord.com/developers/resources/sticker#get-sticker-pack
 */
export type RESTGetAPIStickerPackResult = APIStickerPack;

/**
 * https://docs.discord.com/developers/resources/sticker#list-guild-stickers
 */
export type RESTGetAPIGuildStickersResult = APISticker[];

/**
 * https://docs.discord.com/developers/resources/sticker#get-guild-sticker
 */
export type RESTGetAPIGuildStickerResult = APISticker;

/**
 * https://docs.discord.com/developers/resources/sticker#create-guild-sticker
 */
export interface RESTPostAPIGuildStickerFormDataBody {
	/**
	 * Name of the sticker (2-30 characters)
	 */
	name: string;
	/**
	 * Description of the sticker (empty or 2-100 characters)
	 */
	description: string;
	/**
	 * The Discord name of a unicode emoji representing the sticker's expression (2-200 characters)
	 */
	tags: string;
	/**
	 * The sticker file to upload, must be a PNG, APNG, GIF, or Lottie JSON file, max 512 KB
	 *
	 * Uploaded stickers are constrained to 5 seconds in length for animated stickers, and 320 x 320 pixels.
	 */
	file: unknown;
}

/**
 * https://docs.discord.com/developers/resources/sticker#create-guild-sticker
 */
export type RESTPostAPIGuildStickerResult = APISticker;

/**
 * https://docs.discord.com/developers/resources/sticker#modify-guild-sticker
 */
export interface RESTPatchAPIGuildStickerJSONBody {
	/**
	 * Name of the sticker (2-30 characters)
	 */
	name?: string | undefined;
	/**
	 * Description of the sticker (2-100 characters)
	 */
	description?: string | null | undefined;
	/**
	 * The Discord name of a unicode emoji representing the sticker's expression (2-200 characters)
	 */
	tags?: string | undefined;
}

/**
 * https://docs.discord.com/developers/resources/sticker#modify-guild-sticker
 */
export type RESTPatchAPIGuildStickerResult = APISticker;

/**
 * https://docs.discord.com/developers/resources/sticker#delete-guild-sticker
 */
export type RESTDeleteAPIGuildStickerResult = undefined;
