import type {
	APIActivityInstance,
	APIApplication,
	APIApplicationEmoji,
	APIApplicationRoleConnectionMetadata,
} from '../payloads';
import type { Nullable, StrictPartial } from '../utils';
import type { RESTPatchAPIGuildEmojiJSONBody, RESTPostAPIGuildEmojiJSONBody } from './emoji';

/**
 * https://docs.discord.com/developers/resources/application-role-connection-metadata#get-application-role-connection-metadata-records
 */
export type RESTGetAPIApplicationRoleConnectionMetadataResult = APIApplicationRoleConnectionMetadata[];

/**
 * https://docs.discord.com/developers/resources/application-role-connection-metadata#update-application-role-connection-metadata-records
 */
export type RESTPutAPIApplicationRoleConnectionMetadataJSONBody = APIApplicationRoleConnectionMetadata[];

/**
 * https://docs.discord.com/developers/resources/application-role-connection-metadata#update-application-role-connection-metadata-records
 */
export type RESTPutAPIApplicationRoleConnectionMetadataResult = APIApplicationRoleConnectionMetadata[];

/**
 * https://docs.discord.com/developers/resources/application#get-current-application
 */
export type RESTGetCurrentApplicationResult = APIApplication;

/**
 * https://docs.discord.com/developers/resources/application#edit-current-application
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
 * https://docs.discord.com/developers/resources/application#edit-current-application
 */
export type RESTPatchCurrentApplicationResult = APIApplication;

/**
 * https://docs.discord.com/developers/resources/emoji#list-application-emojis
 */
export interface RESTGetAPIApplicationEmojisResult {
	items: APIApplicationEmoji[];
}

/**
 * https://docs.discord.com/developers/resources/emoji#get-application-emoji
 */
export type RESTGetAPIApplicationEmojiResult = APIApplicationEmoji;

/**
 * https://docs.discord.com/developers/resources/emoji#create-application-emoji-json-params
 */
export type RESTPostAPIApplicationEmojiJSONBody = Pick<RESTPostAPIGuildEmojiJSONBody, 'image' | 'name'>;

/**
 * https://docs.discord.com/developers/resources/emoji#create-application-emoji
 */
export type RESTPostAPIApplicationEmojiResult = APIApplicationEmoji;

/**
 * https://docs.discord.com/developers/resources/emoji#modify-application-emoji
 */
export type RESTPatchAPIApplicationEmojiJSONBody = Pick<RESTPatchAPIGuildEmojiJSONBody, 'name'>;

/**
 * https://docs.discord.com/developers/resources/emoji#modify-application-emoji
 */
export type RESTPatchAPIApplicationEmojiResult = APIApplicationEmoji;

/**
 * https://docs.discord.com/developers/resources/emoji#delete-application-emoji
 */
export type RESTDeleteAPIApplicationEmojiResult = undefined;

/**
 * https://docs.discord.com/developers/resources/application#get-application-activity-instance
 */
export type RestGetAPIApplicationActivityInstanceResult = APIActivityInstance | undefined;
