import type { APIGuild, APITemplate } from '../payloads';
import type { StrictPartial } from '../utils';

/**
 * https://docs.discord.com/developers/resources/guild-template#get-guild-template
 */
export type RESTGetAPITemplateResult = APITemplate;

/**
 * https://docs.discord.com/developers/resources/guild-template#create-guild-from-guild-template
 */
export interface RESTPostAPITemplateCreateGuildJSONBody {
	/**
	 * Name of the guild (2-100 characters)
	 */
	name: string;
	/**
	 * base64 1024x1024 png/jpeg image for the guild icon
	 *
	 * See https://docs.discord.com/developers/reference#image-data
	 */
	icon?: string | undefined;
}

/**
 * https://docs.discord.com/developers/resources/guild-template#create-guild-from-guild-template
 */
export type RESTPostAPITemplateCreateGuildResult = APIGuild;

/**
 * https://docs.discord.com/developers/resources/guild-template#get-guild-templates
 */
export type RESTGetAPIGuildTemplatesResult = APITemplate[];

/**
 * https://docs.discord.com/developers/resources/guild-template#create-guild-template
 */
export interface RESTPostAPIGuildTemplatesJSONBody {
	/**
	 * Name of the template (1-100 characters)
	 */
	name: string;
	/**
	 * Description for the template (0-120 characters)
	 */
	description?: string | null | undefined;
}

/**
 * https://docs.discord.com/developers/resources/guild-template#create-guild-template
 */
export type RESTPostAPIGuildTemplatesResult = APITemplate;

/**
 * https://docs.discord.com/developers/resources/guild-template#sync-guild-template
 */
export type RESTPutAPIGuildTemplateSyncResult = APITemplate;

/**
 * https://docs.discord.com/developers/resources/guild-template#modify-guild-template
 */
export type RESTPatchAPIGuildTemplateJSONBody = StrictPartial<RESTPostAPIGuildTemplatesJSONBody>;

/**
 * https://docs.discord.com/developers/resources/guild-template#modify-guild-template
 */
export type RESTPatchAPIGuildTemplateResult = APITemplate;

/**
 * https://docs.discord.com/developers/resources/guild-template#delete-guild-template
 */
export type RESTDeleteAPIGuildTemplateResult = APITemplate;
