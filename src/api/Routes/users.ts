import type {
	APIDMChannel,
	RESTDeleteAPIGuildResult,
	RESTGetAPICurrentUserApplicationRoleConnectionResult,
	RESTGetAPICurrentUserConnectionsResult,
	RESTGetAPICurrentUserGuildsQuery,
	RESTGetAPICurrentUserGuildsResult,
	RESTGetAPICurrentUserResult,
	RESTGetAPIUserResult,
	RESTGetCurrentUserGuildMemberResult,
	RESTPatchAPICurrentUserJSONBody,
	RESTPatchAPICurrentUserResult,
	RESTPostAPICurrentUserCreateDMChannelJSONBody,
	RESTPutAPICurrentUserApplicationRoleConnectionJSONBody,
	RESTPutAPICurrentUserApplicationRoleConnectionResult,
} from 'discord-api-types/v10';
import type { ProxyRequestMethod } from '../Router';
import type { RestArguments } from '../api';

export interface UserRoutes {
	users: {
		(
			id: string,
		): {
			get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIUserResult>;
		};
		(
			id: '@me',
		): {
			get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPICurrentUserResult>;
			patch(
				args: RestArguments<ProxyRequestMethod.Patch, RESTPatchAPICurrentUserJSONBody>,
			): Promise<RESTPatchAPICurrentUserResult>;
			guilds: {
				get(
					args?: RestArguments<ProxyRequestMethod.Get, RESTGetAPICurrentUserGuildsQuery>,
				): Promise<RESTGetAPICurrentUserGuildsResult>;
				(
					id: string,
				): {
					member: {
						get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetCurrentUserGuildMemberResult>;
					};
					delete(args?: RestArguments<ProxyRequestMethod.Delete>): Promise<RESTDeleteAPIGuildResult>;
				};
			};
			channels: {
				post(
					args: RestArguments<ProxyRequestMethod.Post, RESTPostAPICurrentUserCreateDMChannelJSONBody>,
				): Promise<APIDMChannel>;
			};
			connections: {
				get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPICurrentUserConnectionsResult>;
			};
			applications(applicationId: string): {
				'role-connection': {
					get(
						args?: RestArguments<ProxyRequestMethod.Get>,
					): Promise<RESTGetAPICurrentUserApplicationRoleConnectionResult>;
					put(
						args: RestArguments<ProxyRequestMethod.Put, RESTPutAPICurrentUserApplicationRoleConnectionJSONBody>,
					): Promise<RESTPutAPICurrentUserApplicationRoleConnectionResult>;
				};
			};
		};
	};
}
