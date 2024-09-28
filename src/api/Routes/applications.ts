import type {
	RESTDeleteAPIApplicationEmojiResult,
	RESTGetAPIApplicationCommandResult,
	RESTGetAPIApplicationCommandsQuery,
	RESTGetAPIApplicationCommandsResult,
	RESTGetAPIApplicationEmojiResult,
	RESTGetAPIApplicationEmojisResult,
	RESTGetAPIApplicationGuildCommandResult,
	RESTGetAPIApplicationGuildCommandsQuery,
	RESTGetAPIApplicationGuildCommandsResult,
	RESTGetAPIApplicationRoleConnectionMetadataResult,
	RESTGetAPIEntitlementsQuery,
	RESTGetAPIEntitlementsResult,
	RESTGetAPIGuildApplicationCommandsPermissionsResult,
	RESTGetAPISKUsResult,
	RESTPatchAPIApplicationCommandJSONBody,
	RESTPatchAPIApplicationCommandResult,
	RESTPatchAPIApplicationEmojiJSONBody,
	RESTPatchAPIApplicationEmojiResult,
	RESTPatchAPIApplicationGuildCommandJSONBody,
	RESTPatchAPIApplicationGuildCommandResult,
	RESTPostAPIApplicationCommandsJSONBody,
	RESTPostAPIApplicationCommandsResult,
	RESTPostAPIApplicationEmojiJSONBody,
	RESTPostAPIApplicationEmojiResult,
	RESTPostAPIApplicationGuildCommandsJSONBody,
	RESTPostAPIApplicationGuildCommandsResult,
	RESTPostAPIEntitlementBody,
	RESTPostAPIEntitlementResult,
	RESTPutAPIApplicationCommandPermissionsJSONBody,
	RESTPutAPIApplicationCommandsJSONBody,
	RESTPutAPIApplicationCommandsResult,
	RESTPutAPIApplicationGuildCommandsJSONBody,
	RESTPutAPIApplicationGuildCommandsResult,
	RESTPutAPIApplicationRoleConnectionMetadataJSONBody,
	RESTPutAPIApplicationRoleConnectionMetadataResult,
	RESTPutAPIGuildApplicationCommandsPermissionsResult,
} from '../../types';
import type { RestArguments, RestArgumentsNoBody } from '../api';

export interface ApplicationRoutes {
	applications: (id: string) => {
		guilds: (id: string) => {
			commands: {
				get(
					args?: RestArgumentsNoBody<RESTGetAPIApplicationGuildCommandsQuery>,
				): Promise<RESTGetAPIApplicationGuildCommandsResult>;
				post(
					args: RestArguments<RESTPostAPIApplicationGuildCommandsJSONBody>,
				): Promise<RESTPostAPIApplicationGuildCommandsResult>;
				put(
					args?: RestArguments<RESTPutAPIApplicationGuildCommandsJSONBody>,
				): Promise<RESTPutAPIApplicationGuildCommandsResult>;
				permissions: {
					get(args?: RestArgumentsNoBody): Promise<RESTGetAPIGuildApplicationCommandsPermissionsResult>;
				};
				(
					id: string,
				): {
					get(args?: RestArgumentsNoBody): Promise<RESTGetAPIApplicationGuildCommandResult>;
					patch(
						args: RestArguments<RESTPatchAPIApplicationGuildCommandJSONBody>,
					): Promise<RESTPatchAPIApplicationGuildCommandResult>;
					delete(args?: RestArgumentsNoBody): Promise<never>;
					permissions: {
						get(args?: RestArgumentsNoBody): Promise<RESTGetAPIGuildApplicationCommandsPermissionsResult>;
						put(
							args?: RestArguments<RESTPutAPIApplicationCommandPermissionsJSONBody>,
						): Promise<RESTPutAPIGuildApplicationCommandsPermissionsResult>;
					};
				};
			};
		};
		commands: {
			get(args?: RestArgumentsNoBody<RESTGetAPIApplicationCommandsQuery>): Promise<RESTGetAPIApplicationCommandsResult>;
			post(args: RestArguments<RESTPostAPIApplicationCommandsJSONBody>): Promise<RESTPostAPIApplicationCommandsResult>;
			put(args?: RestArguments<RESTPutAPIApplicationCommandsJSONBody>): Promise<RESTPutAPIApplicationCommandsResult>;
			(
				id: string,
			): {
				get(args?: RestArgumentsNoBody): Promise<RESTGetAPIApplicationCommandResult>;
				patch(
					args: RestArguments<RESTPatchAPIApplicationCommandJSONBody>,
				): Promise<RESTPatchAPIApplicationCommandResult>;
				delete(args?: RestArgumentsNoBody): Promise<never>;
			};
		};
		'role-connections': {
			metadata: {
				get(args?: RestArgumentsNoBody): Promise<RESTGetAPIApplicationRoleConnectionMetadataResult>;
				put(
					args: RestArguments<RESTPutAPIApplicationRoleConnectionMetadataJSONBody>,
				): Promise<RESTPutAPIApplicationRoleConnectionMetadataResult>;
			};
		};
		emojis: {
			(
				id: string,
			): {
				get(args?: RestArgumentsNoBody): Promise<RESTGetAPIApplicationEmojiResult>;
				patch(args?: RestArguments<RESTPatchAPIApplicationEmojiJSONBody>): Promise<RESTPatchAPIApplicationEmojiResult>;
				delete(args?: RestArgumentsNoBody): Promise<RESTDeleteAPIApplicationEmojiResult>;
			};
			get(
				args?: RestArgumentsNoBody<Pick<RESTGetAPIApplicationEmojiResult, 'id'>>,
			): Promise<RESTGetAPIApplicationEmojisResult>;
			post(args?: RestArguments<RESTPostAPIApplicationEmojiJSONBody>): Promise<RESTPostAPIApplicationEmojiResult>;
		};
		entitlements: {
			get(args?: RestArgumentsNoBody<RESTGetAPIEntitlementsQuery>): Promise<RESTGetAPIEntitlementsResult>;
			post(args: RestArguments<RESTPostAPIEntitlementBody>): Promise<RESTPostAPIEntitlementResult>;
			(
				id: string,
			): {
				delete(args?: RestArgumentsNoBody): Promise<never>;
				consume: {
					post(args?: RestArgumentsNoBody): Promise<never>;
				};
			};
		};
		skus: {
			get(args?: RestArgumentsNoBody): Promise<RESTGetAPISKUsResult>;
		};
	};
}
