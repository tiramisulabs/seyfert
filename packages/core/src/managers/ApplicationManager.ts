import {
  APIApplicationCommand,
  Identify,
  MakeRequired,
  RESTGetAPIApplicationCommandsQuery,
  RESTGetAPIApplicationGuildCommandsQuery,
  RESTPatchAPIApplicationCommandJSONBody,
  RESTPatchAPIApplicationGuildCommandJSONBody,
  RESTPostAPIApplicationCommandsJSONBody,
  RESTPostAPIApplicationGuildCommandsJSONBody,
  RESTPutAPIApplicationCommandPermissionsJSONBody,
  RESTPutAPIApplicationCommandsJSONBody,
  RESTPutAPIApplicationGuildCommandsJSONBody,
  RESTPutAPIApplicationRoleConnectionMetadataJSONBody
} from '@biscuitland/common';
import { Session } from '..';

export class ApplicationManager {
  readonly session!: Session;
  constructor(session: Session) {
    Object.defineProperty(this, 'session', {
      value: session,
      writable: false
    });
  }

  getBotGateway() {
    return this.session.api.gateway.bot.get();
  }

  getGateway() {
    return this.session.api.gateway.get();
  }

  getNitroStickerPacks() {
    return this.session.api['sticker-packs'].get();
  }

  getRoleConnectionMetadata(applicationId: string) {
    return this.session.api.applications(applicationId)['role-connections'].metadata.get();
  }

  editRoleConnectionMetadata(applicationId: string, body: RESTPutAPIApplicationRoleConnectionMetadataJSONBody) {
    return this.session.api.applications(applicationId)['role-connections'].metadata.put({ body });
  }

  getCommands(
    applicationId: string,
    query: RESTGetAPIApplicationCommandsQuery
  ): Promise<RESTGetAPIApplicationCommandsWithLocalizationsResult>;
  getCommands(applicationId: string, query?: RESTGetAPIApplicationCommandsQuery) {
    return this.session.api.applications(applicationId).commands.get({ query });
  }

  createCommand(applicationId: string, body: RESTPostAPIApplicationCommandsJSONBody) {
    return this.session.api.applications(applicationId).commands.post({ body });
  }

  getCommand(applicationId: string, commandId: string) {
    return this.session.api.applications(applicationId).commands(commandId).get();
  }

  editCommand(applicationId: string, commandId: string, body: RESTPatchAPIApplicationCommandJSONBody) {
    return this.session.api.applications(applicationId).commands(commandId).patch({ body });
  }

  deleteCommand(applicationId: string, commandId: string) {
    return this.session.api.applications(applicationId).commands(commandId).delete();
  }

  bulkCommands(applicationId: string, body: RESTPutAPIApplicationCommandsJSONBody) {
    return this.session.api.applications(applicationId).commands.put({ body });
  }

  getCommandPermissions(applicationId: string, guildId: string, commandId: string) {
    return this.session.api.applications(applicationId).guilds(guildId).commands(commandId).permissions.get();
  }

  editCommandPermissions(
    applicationId: string,
    guildId: string,
    commandId: string,
    body: RESTPutAPIApplicationCommandPermissionsJSONBody
  ) {
    return this.session.api.applications(applicationId).guilds(guildId).commands(commandId).permissions.put({ body });
  }

  getGuildCommands(
    applicationId: string,
    guildId: string,
    query: RESTGetAPIApplicationGuildCommandsQuery
  ): Promise<RESTGetAPIApplicationGuildCommandsWithLocalizationsResult>;
  getGuildCommands(applicationId: string, guildId: string, query?: RESTGetAPIApplicationGuildCommandsQuery) {
    return this.session.api.applications(applicationId).guilds(guildId).commands.get({ query });
  }

  createGuildCommand(applicationId: string, guildId: string, body: RESTPostAPIApplicationGuildCommandsJSONBody) {
    return this.session.api.applications(applicationId).guilds(guildId).commands.post({ body });
  }

  getGuildCommand(applicationId: string, guildId: string, commandId: string) {
    return this.session.api.applications(applicationId).guilds(guildId).commands(commandId).get();
  }

  editGuildCommand(
    applicationId: string,
    guildId: string,
    commandId: string,
    body: RESTPatchAPIApplicationGuildCommandJSONBody
  ) {
    return this.session.api.applications(applicationId).guilds(guildId).commands(commandId).patch({ body });
  }

  deleteGuildCommand(applicationId: string, guildId: string, commandId: string) {
    return this.session.api.applications(applicationId).guilds(guildId).commands(commandId).delete();
  }

  bulkGuildCommands(applicationId: string, guildId: string, body: RESTPutAPIApplicationGuildCommandsJSONBody) {
    return this.session.api.applications(applicationId).guilds(guildId).commands.put({ body });
  }

  getGuildCommandPermissions(applicationId: string, guildId: string) {
    return this.session.api.applications(applicationId).guilds(guildId).commands.permissions.get();
  }
}

export type RESTGetAPIApplicationCommandsWithLocalizationsResult = Identify<
  MakeRequired<APIApplicationCommand, 'name_localizations' | 'description_localizations'>
>[];

export type RESTGetAPIApplicationGuildCommandsWithLocalizationsResult =
  RESTGetAPIApplicationCommandsWithLocalizationsResult;
