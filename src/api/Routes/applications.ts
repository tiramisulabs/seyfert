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
	RESTGetAPIApplicationEmojiResult,
	RESTGetAPIApplicationEmojisResult,
	RESTPostAPIApplicationEmojiJSONBody,
	RESTPatchAPIApplicationEmojiJSONBody,
	RESTPostAPIApplicationEmojiResult,
	RESTPatchAPIApplicationEmojiResult,
	RESTDeleteAPIApplicationEmojiResult,
	RESTGetAPIEntitlementsResult,
	RESTGetAPIEntitlementsQuery,
	RESTPostAPIEntitlementBody,
	RESTPostAPIEntitlementResult,
	RESTGetAPISKUsResult,
} from '../../types';

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
				): Promise<RESTPatchAPIApplicationEmojiResult>;
				delete(args?: RestArguments<ProxyRequestMethod.Delete>): Promise<RESTDeleteAPIApplicationEmojiResult>;
			};
			get(
				args?: RestArguments<ProxyRequestMethod.Get, Pick<RESTGetAPIApplicationEmojiResult, 'id'>>,
			): Promise<RESTGetAPIApplicationEmojisResult>;
			post(
				args?: RestArguments<ProxyRequestMethod.Post, RESTPostAPIApplicationEmojiJSONBody>,
			): Promise<RESTPostAPIApplicationEmojiResult>;
		};
		entitlements: {
			get(
				args?: RestArguments<ProxyRequestMethod.Get, RESTGetAPIEntitlementsQuery>,
			): Promise<RESTGetAPIEntitlementsResult>;
			post(
				args: RestArguments<ProxyRequestMethod.Post, RESTPostAPIEntitlementBody>,
			): Promise<RESTPostAPIEntitlementResult>;

			(
				id: string,
			): {
				delete(args?: RestArguments<ProxyRequestMethod.Delete>): Promise<never>;
				consume: {
					post(args?: RestArguments<ProxyRequestMethod.Post>): Promise<never>;
				};
			};
		};
		skus: {
			get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPISKUsResult>;
		};
	};
}
