import {
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
  RESTPutAPIGuildApplicationCommandsPermissionsResult
} from '@biscuitland/common';
import { RestArguments } from '../REST';
import { RequestMethod } from '../Router';

export interface ApplicationRoutes {
  applications: {
    (id: string): {
      guilds: {
        (id: string): {
          commands: {
            get(
              args?: RestArguments<RequestMethod.Get, RESTGetAPIApplicationGuildCommandsQuery>
            ): Promise<RESTGetAPIApplicationGuildCommandsResult>;
            post(
              args: RestArguments<RequestMethod.Post, RESTPostAPIApplicationGuildCommandsJSONBody>
            ): Promise<RESTPostAPIApplicationGuildCommandsResult>;
            put(
              args: RestArguments<RequestMethod.Put, RESTPutAPIApplicationGuildCommandsJSONBody>
            ): Promise<RESTPutAPIApplicationGuildCommandsResult>;
            permissions: {
              get(
                args?: RestArguments<RequestMethod.Get>
              ): Promise<RESTGetAPIGuildApplicationCommandsPermissionsResult>;
              // put(args: RestArguments<RequestMethod.Put, RESTPutAPIGuildApplicationCommandsPermissionsJSONBody>): Promise<RESTPutAPIGuildApplicationCommandsPermissionsResult>
            };
            (id: string): {
              get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIApplicationGuildCommandResult>;
              patch(
                args: RestArguments<RequestMethod.Patch, RESTPatchAPIApplicationGuildCommandJSONBody>
              ): Promise<RESTPatchAPIApplicationGuildCommandResult>;
              delete(args?: RestArguments<RequestMethod.Delete>): Promise<never>;
              permissions: {
                get(
                  args?: RestArguments<RequestMethod.Get>
                ): Promise<RESTGetAPIGuildApplicationCommandsPermissionsResult>;
                put(
                  args: RestArguments<RequestMethod.Put, RESTPutAPIApplicationCommandPermissionsJSONBody>
                ): Promise<RESTPutAPIGuildApplicationCommandsPermissionsResult>;
              };
            };
          };
        };
      };
      commands: {
        get(
          args?: RestArguments<RequestMethod.Get, RESTGetAPIApplicationCommandsQuery>
        ): Promise<RESTGetAPIApplicationCommandsResult>;
        post(
          args: RestArguments<RequestMethod.Post, RESTPostAPIApplicationCommandsJSONBody>
        ): Promise<RESTPostAPIApplicationCommandsResult>;
        put(
          args: RestArguments<RequestMethod.Put, RESTPutAPIApplicationCommandsJSONBody>
        ): Promise<RESTPutAPIApplicationCommandsResult>;
        (id: string): {
          get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIApplicationCommandResult>;
          patch(
            args: RestArguments<RequestMethod.Patch, RESTPatchAPIApplicationCommandJSONBody>
          ): Promise<RESTPatchAPIApplicationCommandResult>;
          delete(args?: RestArguments<RequestMethod.Delete>): Promise<never>;
        };
      };
      'role-connections': {
        metadata: {
          get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIApplicationRoleConnectionMetadataResult>;
          put(
            args: RestArguments<RequestMethod.Put, RESTPutAPIApplicationRoleConnectionMetadataJSONBody>
          ): Promise<RESTPutAPIApplicationRoleConnectionMetadataResult>;
        };
      };
    };
  };
}
