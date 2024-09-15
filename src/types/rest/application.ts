import type { APIApplication, APIApplicationRoleConnectionMetadata, APIEmoji } from '../payloads';
import type { Nullable, StrictPartial } from '../utils';
import type { RESTPatchAPIGuildEmojiJSONBody, RESTPostAPIGuildEmojiJSONBody } from './emoji';

/**
 * https://discord.com/developers/docs/resources/application-role-connection-metadata#get-application-role-connection-metadata-records
 */
export type RESTGetAPIApplicationRoleConnectionMetadataResult = APIApplicationRoleConnectionMetadata[];

/**
 * https://discord.com/developers/docs/resources/application-role-connection-metadata#update-application-role-connection-metadata-records
 */
export type RESTPutAPIApplicationRoleConnectionMetadataJSONBody = APIApplicationRoleConnectionMetadata[];

/**
 * https://discord.com/developers/docs/resources/application-role-connection-metadata#update-application-role-connection-metadata-records
 */
export type RESTPutAPIApplicationRoleConnectionMetadataResult = APIApplicationRoleConnectionMetadata[];

/**
 * https://discord.com/developers/docs/resources/application#get-current-application
 */
export type RESTGetCurrentApplicationResult = APIApplication;

/**
 * https://discord.com/developers/docs/resources/application#edit-current-application
 */
export type RESTPatchCurrentApplicationJSONBody = StrictPartial<
	Nullable<Pick<APIApplication, 'cover_image' | 'icon'>> &
		Pick<
			APIApplication,
			| 'custom_install_url'
			| 'description'
			| 'flags'
			| 'install_params'
			| 'integration_types_config'
			| 'interactions_endpoint_url'
			| 'role_connections_verification_url'
			| 'tags'
		>
>;

/**
 * https://discord.com/developers/docs/resources/application#edit-current-application
 */
export type RESTPatchCurrentApplicationResult = APIApplication;

/**
 * https://discord.com/developers/docs/resources/emoji#list-application-emojis
 */
export interface RESTGetAPIApplicationEmojisResult {
	emojis: APIEmoji[];
}

/**
 * https://discord.com/developers/docs/resources/emoji#get-application-emoji
 */
export type RESTGetAPIApplicationEmojiResult = APIEmoji;

/**
 * https://discord.com/developers/docs/resources/emoji#create-application-emoji-json-params
 */
export type RESTPostAPIApplicationEmojiJSONBody = Pick<RESTPostAPIGuildEmojiJSONBody, 'image' | 'name'>;

/**
 * https://discord.com/developers/docs/resources/emoji#create-application-emoji
 */
export type RESTPostAPIApplicationEmojiResult = APIEmoji;

/**
 * https://discord.com/developers/docs/resources/emoji#modify-application-emoji
 */
export type RESTPatchAPIApplicationEmojiJSONBody = Pick<RESTPatchAPIGuildEmojiJSONBody, 'name'>;

/**
 * https://discord.com/developers/docs/resources/emoji#modify-application-emoji
 */
export type RESTPatchAPIApplicationEmojiResult = APIEmoji;

/**
 * https://discord.com/developers/docs/resources/emoji#delete-application-emoji
 */
export type RESTDeleteAPIApplicationEmojiResult = never;
