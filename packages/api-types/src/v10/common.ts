export type Localizations = Partial<Record<Locales, string>>;

export enum Locales {
	Danish = 'da',
	German = 'de',
	EnglishUk = 'en-GB',
	EnglishUs = 'en-US',
	Spanish = 'es-ES',
	French = 'fr',
	Croatian = 'hr',
	Italian = 'it',
	Lithuanian = 'lt',
	Hungarian = 'hu',
	Dutch = 'nl',
	Norwegian = 'no',
	Polish = 'pl',
	PortugueseBrazilian = 'pt-BR',
	RomanianRomania = 'ro',
	Finnish = 'fi',
	Swedish = 'sv-SE',
	Vietnamese = 'vi',
	Turkish = 'tr',
	Czech = 'cs',
	Greek = 'el',
	Bulgarian = 'bg',
	Russian = 'ru',
	Ukrainian = 'uk',
	Hindi = 'hi',
	Thai = 'th',
	ChineseChina = 'zh-CN',
	Japanese = 'ja',
	ChineseTaiwan = 'zh-TW',
	Korean = 'ko',
}

export interface DiscordBase {
    /** Unique ID of the object */
    id: Snowflake;
}

/**
 * Discord utilizes Twitter's snowflake format for uniquely identifiable descriptors (IDs).
 * These IDs are guaranteed to be unique across all of Discord,
 * except in some unique scenarios in which child objects share their parent's ID.
 */
 export type Snowflake = string;
