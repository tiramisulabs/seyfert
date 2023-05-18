import type { Session } from '../session';
import type {
  GuildMFALevel,
  APIGuildChannel,
  GuildChannelType,
  RESTPostAPIGuildPruneJSONBody,
  RESTPostAPIGuildsJSONBody,
  RESTPatchAPIGuildJSONBody,
  RESTPostAPIGuildChannelJSONBody,
  RESTPatchAPIGuildChannelPositionsJSONBody,
  RESTGetAPIGuildBansQuery,
  RESTPutAPIGuildBanJSONBody,
  RESTPostAPIGuildRoleJSONBody,
  RESTPatchAPIGuildRolePositionsJSONBody,
  RESTPatchAPIGuildRoleJSONBody,
  RESTPatchAPIGuildWidgetSettingsJSONBody,
  RESTPatchAPIGuildWelcomeScreenJSONBody,
  RESTGetAPIGuildPruneCountQuery
} from '@biscuitland/common';

export class GuildManager {
  readonly session!: Session;
  constructor(session: Session) {
    Object.defineProperty(this, 'session', {
      value: session,
      writable: false
    });
  }

  async get(guildId: string) {
    return this.session.api.guilds(guildId).get();
  }

  async create(options: RESTPostAPIGuildsJSONBody) {
    return this.session.api.guilds.post({ body: options });
  }

  async delete(guildId: string) {
    return this.session.api.guilds(guildId).delete();
  }

  async edit(guildId: string, options: RESTPatchAPIGuildJSONBody) {
    return this.session.api.guilds(guildId).patch({ body: options });
  }
  //>Format files on save or when issuing the Format Document command
  //supongo q si xdxd se
  async getChannels(guildId: string) {
    return this.session.api.guilds(guildId).channels.get();
  }

  async createChannel<T extends APIGuildChannel<GuildChannelType>>(
    guildId: string,
    options: RESTPostAPIGuildChannelJSONBody
  ) {
    return (await this.session.api.guilds(guildId).channels.post({ body: options })) as T;
  }

  async editChannelPositions(guildId: string, options: RESTPatchAPIGuildChannelPositionsJSONBody): Promise<void> {
    return this.session.api.guilds(guildId).channels.patch({ body: options });
  }

  async getThreads(guildId: string) {
    return this.session.api.guilds(guildId).threads.active.get();
  }

  async getBans(guildId: string, query: RESTGetAPIGuildBansQuery = {}) {
    return this.session.api.guilds(guildId).bans.get({
      query
    });
  }

  async getBan(guildId: string, userId: string) {
    return this.session.api.guilds(guildId).bans(userId).get();
  }

  async createBan(guildId: string, userId: string, options: RESTPutAPIGuildBanJSONBody) {
    return this.session.api.guilds(guildId).bans(userId).put({ body: options });
  }

  async removeBan(guildId: string, userId: string) {
    return this.session.api.guilds(guildId).bans(userId).delete();
  }

  async getRoles(guildId: string) {
    return this.session.api.guilds(guildId).roles.get();
  }

  async createRole(guildId: string, options: RESTPostAPIGuildRoleJSONBody) {
    return this.session.api.guilds(guildId).roles.post({ body: options });
  }

  async editRolePositions(guildId: string, options: RESTPatchAPIGuildRolePositionsJSONBody) {
    return this.session.api.guilds(guildId).roles.patch({ body: options });
  }

  async editRole(guildId: string, roleId: string, options: RESTPatchAPIGuildRoleJSONBody) {
    return this.session.api.guilds(guildId).roles(roleId).patch({ body: options });
  }

  async deleteRole(guildId: string, roleId: string) {
    return this.session.api.guilds(guildId).roles(roleId).delete();
  }

  async editGuildMFALevel(guildId: string, level: GuildMFALevel) {
    return this.session.api.guilds(guildId).mfa.post({ body: { level } });
  }

  async getPruneCount(guildId: string, query: RESTGetAPIGuildPruneCountQuery) {
    return this.session.api.guilds(guildId).prune.get({
      query
    });
  }

  async beginGuildPrune(guildId: string, options: RESTPostAPIGuildPruneJSONBody) {
    return this.session.api.guilds(guildId).prune.post({ body: options });
  }

  async getVoiceRegions(guildId: string) {
    return this.session.api.guilds(guildId).regions.get();
  }

  async getInvites(guildId: string) {
    return this.session.api.guilds(guildId).invites.get();
  }

  async getIntegrations(guildId: string) {
    return this.session.api.guilds(guildId).integrations.get();
  }

  async deleteIntegration(guildId: string, integrationId: string) {
    return this.session.api.guilds(guildId).integrations(integrationId).delete();
  }

  async getWidget(guildId: string) {
    return this.session.api.guilds(guildId).widget.get();
  }

  async editWidget(guildId: string, options: RESTPatchAPIGuildWidgetSettingsJSONBody) {
    return this.session.api.guilds(guildId).widget.patch({ body: options });
  }

  async getVanityUrl(guildId: string) {
    return this.session.api.guilds(guildId)['vanity-url'].get();
  }

  async getWelcomeScreen(guildId: string) {
    return this.session.api.guilds(guildId)['welcome-screen'].get();
  }

  async editWelcomeScreen(guildId: string, options: RESTPatchAPIGuildWelcomeScreenJSONBody) {
    return this.session.api.guilds(guildId)['welcome-screen'].patch({ body: options });
  }
}
