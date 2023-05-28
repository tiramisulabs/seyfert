import {
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
  RESTPutAPICurrentUserApplicationRoleConnectionResult
} from '@biscuitland/common';
import { RestArguments } from '../REST';
import { RequestMethod } from '../Router';

export interface UserRoutes {
  users: {
    (id: string): {
      get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIUserResult>;
    };
    (id: '@me'): {
      get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPICurrentUserResult>;
      patch(
        args: RestArguments<RequestMethod.Patch, RESTPatchAPICurrentUserJSONBody>
      ): Promise<RESTPatchAPICurrentUserResult>;
      guilds: {
        get(
          args?: RestArguments<RequestMethod.Get, RESTGetAPICurrentUserGuildsQuery>
        ): Promise<RESTGetAPICurrentUserGuildsResult>;
        (id: string): {
          member: {
            get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetCurrentUserGuildMemberResult>;
          };
          delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIGuildResult>;
        };
      };
      channels: {
        post(
          args: RestArguments<RequestMethod.Post, RESTPostAPICurrentUserCreateDMChannelJSONBody>
        ): Promise<APIDMChannel>;
      };
      connections: {
        get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPICurrentUserConnectionsResult>;
      };
      applications(applicationId: string): {
        'role-connection': {
          get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPICurrentUserApplicationRoleConnectionResult>;
          put(
            args: RestArguments<RequestMethod.Put, RESTPutAPICurrentUserApplicationRoleConnectionJSONBody>
          ): Promise<RESTPutAPICurrentUserApplicationRoleConnectionResult>;
        };
      };
    };
  };
}
