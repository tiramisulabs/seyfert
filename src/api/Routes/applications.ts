import type {
	RESTGetAPIApplicationCommandResult,
	RESTGetAPIApplicationCommandsQuery,
	RESTGetAPIApplicationCommandsResult,
	RESTGetAPIApplicationGuildCommandResult,
	RESTGetAPIApplicationGuildCommandsQuery,
	RESTGetAPIApplicationGuildCommandsResult,
	RESTGetAPIApplicationRoleConnectionMetadataResult,
	RESTGetAPIGuildApplicationCommandsPermissionsResult,
	RESTPatchAPIApplicationCommandJSONBody,
	RESTPatchAPIApplicationCommandResult,
	RESTPatchAPIApplicationGuildCommandJSONBody,
	RESTPatchAPIApplicationGuildCommandResult,
	RESTPostAPIApplicationCommandsJSONBody,
	RESTPostAPIApplicationCommandsResult,
	RESTPostAPIApplicationGuildCommandsJSONBody,
	RESTPostAPIApplicationGuildCommandsResult,
	RESTPutAPIApplicationCommandPermissionsJSONBody,
	RESTPutAPIApplicationCommandsJSONBody,
	RESTPutAPIApplicationCommandsResult,
	RESTPutAPIApplicationGuildCommandsJSONBody,
	RESTPutAPIApplicationGuildCommandsResult,
	RESTPutAPIApplicationRoleConnectionMetadataJSONBody,
	RESTPutAPIApplicationRoleConnectionMetadataResult,
	RESTPutAPIGuildApplicationCommandsPermissionsResult,
	APIEmoji,
	RESTPostAPIGuildEmojiJSONBody,
	RESTPatchAPIGuildEmojiJSONBody,
} from 'discord-api-types/v10';
import type { ProxyRequestMethod } from '../Router';
import type { RestArguments } from '../api';

export interface ApplicationRoutes {
	applications: (id: string) => {
		guilds: (id: string) => {
			commands: {
				get(
					args?: RestArguments<ProxyRequestMethod.Get, RESTGetAPIApplicationGuildCommandsQuery>,
				): Promise<RESTGetAPIApplicationGuildCommandsResult>;
				post(
					args: RestArguments<ProxyRequestMethod.Post, RESTPostAPIApplicationGuildCommandsJSONBody>,
				): Promise<RESTPostAPIApplicationGuildCommandsResult>;
				put(
					args?: RestArguments<ProxyRequestMethod.Put, RESTPutAPIApplicationGuildCommandsJSONBody>,
				): Promise<RESTPutAPIApplicationGuildCommandsResult>;
				permissions: {
					get(
						args?: RestArguments<ProxyRequestMethod.Get>,
					): Promise<RESTGetAPIGuildApplicationCommandsPermissionsResult>;
					// put(args?: RestArguments<ProxyRequestMethod.Put, RESTPutAPIGuildApplicationCommandsPermissionsJSONBody>): Promise<RESTPutAPIGuildApplicationCommandsPermissionsResult>
				};
				(
					id: string,
				): {
					get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIApplicationGuildCommandResult>;
					patch(
						args: RestArguments<ProxyRequestMethod.Patch, RESTPatchAPIApplicationGuildCommandJSONBody>,
					): Promise<RESTPatchAPIApplicationGuildCommandResult>;
					delete(args?: RestArguments<ProxyRequestMethod.Delete>): Promise<never>;
					permissions: {
						get(
							args?: RestArguments<ProxyRequestMethod.Get>,
						): Promise<RESTGetAPIGuildApplicationCommandsPermissionsResult>;
						put(
							args?: RestArguments<ProxyRequestMethod.Put, RESTPutAPIApplicationCommandPermissionsJSONBody>,
						): Promise<RESTPutAPIGuildApplicationCommandsPermissionsResult>;
					};
				};
			};
		};
		commands: {
			get(
				args?: RestArguments<ProxyRequestMethod.Get, RESTGetAPIApplicationCommandsQuery>,
			): Promise<RESTGetAPIApplicationCommandsResult>;
			post(
				args: RestArguments<ProxyRequestMethod.Post, RESTPostAPIApplicationCommandsJSONBody>,
			): Promise<RESTPostAPIApplicationCommandsResult>;
			put(
				args?: RestArguments<ProxyRequestMethod.Put, RESTPutAPIApplicationCommandsJSONBody>,
			): Promise<RESTPutAPIApplicationCommandsResult>;
			(
				id: string,
			): {
				get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIApplicationCommandResult>;
				patch(
					args: RestArguments<ProxyRequestMethod.Patch, RESTPatchAPIApplicationCommandJSONBody>,
				): Promise<RESTPatchAPIApplicationCommandResult>;
				delete(args?: RestArguments<ProxyRequestMethod.Delete>): Promise<never>;
			};
		};
		'role-connections': {
			metadata: {
				get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIApplicationRoleConnectionMetadataResult>;
				put(
					args: RestArguments<ProxyRequestMethod.Put, RESTPutAPIApplicationRoleConnectionMetadataJSONBody>,
				): Promise<RESTPutAPIApplicationRoleConnectionMetadataResult>;
			};
		};
		emojis: {
			(
				id: string,
			): {
				get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIApplicationEmojiResult>;
				patch(
					args?: RestArguments<ProxyRequestMethod.Patch, RESTPatchAPIApplicationEmojiJSONBody>,
				): Promise<RESTPatchAPIApplicationEmojiJSONBody>;
				delete(args?: RestArguments<ProxyRequestMethod.Delete>): Promise<never>;
			};
			get(
				args?: RestArguments<ProxyRequestMethod.Get, RESTGetAPIApplicationEmojisQuery>,
			): Promise<RESTGetAPIApplicationEmojiResult>;
			post(
				args?: RestArguments<ProxyRequestMethod.Post, RESTPostAPIApplicationEmojiJSONBody>,
			): Promise<RESTPostAPIApplicationEmojiJSONBody>;
		};
	};
}

/**
 * https://discord.com/developers/docs/resources/emoji#list-application-emojis
 */
export interface RESTGetAPIApplicationEmojisResult {
	items: APIEmoji[];
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

export type RESTGetAPIApplicationEmojisQuery = Pick<RESTGetAPIApplicationEmojiResult, 'id'>;
