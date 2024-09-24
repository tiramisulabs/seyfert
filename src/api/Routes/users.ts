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
} from '../../types';
import type { RestArguments, RestArgumentsNoBody } from '../api';

export interface UserRoutes {
	users: {
		(
			id: string,
		): {
			get(args?: RestArgumentsNoBody): Promise<RESTGetAPIUserResult>;
		};
		(
			id: '@me',
		): {
			get(args?: RestArgumentsNoBody): Promise<RESTGetAPICurrentUserResult>;
			patch(args: RestArguments<RESTPatchAPICurrentUserJSONBody>): Promise<RESTPatchAPICurrentUserResult>;
			guilds: {
				get(args?: RestArgumentsNoBody<RESTGetAPICurrentUserGuildsQuery>): Promise<RESTGetAPICurrentUserGuildsResult>;
				(
					id: string,
				): {
					member: {
						get(args?: RestArgumentsNoBody): Promise<RESTGetCurrentUserGuildMemberResult>;
					};
					delete(args?: RestArgumentsNoBody): Promise<RESTDeleteAPIGuildResult>;
				};
			};
			channels: {
				post(args: RestArguments<RESTPostAPICurrentUserCreateDMChannelJSONBody>): Promise<APIDMChannel>;
			};
			connections: {
				get(args?: RestArgumentsNoBody): Promise<RESTGetAPICurrentUserConnectionsResult>;
			};
			applications(applicationId: string): {
				'role-connection': {
					get(args?: RestArgumentsNoBody): Promise<RESTGetAPICurrentUserApplicationRoleConnectionResult>;
					put(
						args: RestArguments<RESTPutAPICurrentUserApplicationRoleConnectionJSONBody>,
					): Promise<RESTPutAPICurrentUserApplicationRoleConnectionResult>;
				};
			};
		};
	};
}
