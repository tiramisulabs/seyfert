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
  RESTGetAPIGuildPruneCountQuery,
  RESTGetAPIAuditLogQuery,
  RESTPostAPIAutoModerationRuleJSONBody,
  RESTPatchAPIAutoModerationRuleJSONBody,
  RESTPostAPITemplateCreateGuildJSONBody,
  RESTGetAPIGuildMembersQuery,
  RESTGetAPIGuildMembersSearchQuery,
  RESTPatchAPICurrentGuildMemberJSONBody,
  RESTPutAPIGuildMemberJSONBody,
  RESTPatchAPIGuildMemberJSONBody,
  RESTGetAPIGuildWidgetImageQuery,
  RESTPatchAPIGuildEmojiJSONBody,
  RESTPostAPIGuildEmojiJSONBody,
  RESTPatchAPIGuildVoiceStateUserJSONBody,
  RESTPatchAPIGuildVoiceStateCurrentMemberJSONBody,
  RESTPatchAPIGuildStickerJSONBody,
  RESTPostAPIGuildStickerFormDataBody,
  RESTGetAPIGuildScheduledEventsQuery,
  RESTPatchAPIGuildScheduledEventJSONBody,
  RESTPostAPIGuildScheduledEventJSONBody,
  RESTGetAPIGuildScheduledEventQuery,
  RESTGetAPIGuildScheduledEventUsersQuery,
  RESTPatchAPIGuildTemplateJSONBody,
  RESTPostAPIGuildTemplatesJSONBody
} from '@biscuitland/common';

export class GuildManager {
  readonly session!: Session;
  constructor(session: Session) {
    Object.defineProperty(this, 'session', {
      value: session,
      writable: false
    });
  }

  get(guildId: string) {
    return this.session.api.guilds(guildId).get();
  }

  create(options: RESTPostAPIGuildsJSONBody) {
    return this.session.api.guilds.post({ body: options });
  }

  delete(guildId: string) {
    return this.session.api.guilds(guildId).delete();
  }

  edit(guildId: string, options: RESTPatchAPIGuildJSONBody) {
    return this.session.api.guilds(guildId).patch({ body: options });
  }

  getChannels(guildId: string) {
    return this.session.api.guilds(guildId).channels.get();
  }

  createChannel<T extends APIGuildChannel<GuildChannelType>>(guildId: string, body: RESTPostAPIGuildChannelJSONBody) {
    return this.session.api.guilds(guildId).channels.post({ body }) as Promise<T>;
  }

  editChannelPositions(guildId: string, body: RESTPatchAPIGuildChannelPositionsJSONBody): Promise<void> {
    return this.session.api.guilds(guildId).channels.patch({ body });
  }

  getThreads(guildId: string) {
    return this.session.api.guilds(guildId).threads.active.get();
  }

  getBans(guildId: string, query: RESTGetAPIGuildBansQuery = {}) {
    return this.session.api.guilds(guildId).bans.get({
      query
    });
  }

  getBan(guildId: string, userId: string) {
    return this.session.api.guilds(guildId).bans(userId).get();
  }

  createBan(guildId: string, userId: string, body: RESTPutAPIGuildBanJSONBody) {
    return this.session.api.guilds(guildId).bans(userId).put({ body });
  }

  removeBan(guildId: string, userId: string) {
    return this.session.api.guilds(guildId).bans(userId).delete();
  }

  getRoles(guildId: string) {
    return this.session.api.guilds(guildId).roles.get();
  }

  createRole(guildId: string, options: RESTPostAPIGuildRoleJSONBody) {
    return this.session.api.guilds(guildId).roles.post({ body: options });
  }

  editRolePositions(guildId: string, options: RESTPatchAPIGuildRolePositionsJSONBody) {
    return this.session.api.guilds(guildId).roles.patch({ body: options });
  }

  editRole(guildId: string, roleId: string, options: RESTPatchAPIGuildRoleJSONBody) {
    return this.session.api.guilds(guildId).roles(roleId).patch({ body: options });
  }

  deleteRole(guildId: string, roleId: string) {
    return this.session.api.guilds(guildId).roles(roleId).delete();
  }

  editGuildMFALevel(guildId: string, level: GuildMFALevel) {
    return this.session.api.guilds(guildId).mfa.post({ body: { level } });
  }

  getPruneCount(guildId: string, query: RESTGetAPIGuildPruneCountQuery) {
    return this.session.api.guilds(guildId).prune.get({
      query
    });
  }

  beginGuildPrune(guildId: string, options: RESTPostAPIGuildPruneJSONBody) {
    return this.session.api.guilds(guildId).prune.post({ body: options });
  }

  getVoiceRegions(guildId: string) {
    return this.session.api.guilds(guildId).regions.get();
  }

  getInvites(guildId: string) {
    return this.session.api.guilds(guildId).invites.get();
  }

  getIntegrations(guildId: string) {
    return this.session.api.guilds(guildId).integrations.get();
  }

  deleteIntegration(guildId: string, integrationId: string) {
    return this.session.api.guilds(guildId).integrations(integrationId).delete();
  }

  getWidget(guildId: string) {
    return this.session.api.guilds(guildId).widget.get();
  }

  editWidget(guildId: string, options: RESTPatchAPIGuildWidgetSettingsJSONBody) {
    return this.session.api.guilds(guildId).widget.patch({ body: options });
  }

  getVanityUrl(guildId: string) {
    return this.session.api.guilds(guildId)['vanity-url'].get();
  }

  getWelcomeScreen(guildId: string) {
    return this.session.api.guilds(guildId)['welcome-screen'].get();
  }

  editWelcomeScreen(guildId: string, options: RESTPatchAPIGuildWelcomeScreenJSONBody) {
    return this.session.api.guilds(guildId)['welcome-screen'].patch({ body: options });
  }

  getAuditLog(guildId: string, query?: RESTGetAPIAuditLogQuery) {
    return this.session.api.guilds(guildId)['audit-logs'].get({ query });
  }

  getAutoModerationRules(guildId: string) {
    return this.session.api.guilds(guildId)['auto-moderation'].rules.get();
  }

  getAutoModerationRule(guildId: string, ruleId: string) {
    return this.session.api.guilds(guildId)['auto-moderation'].rules(ruleId).get();
  }

  createAutoModerationRule(guildId: string, body: RESTPostAPIAutoModerationRuleJSONBody, reason?: string) {
    return this.session.api.guilds(guildId)['auto-moderation'].rules.post({ body, reason });
  }

  editAutoModerationRule(guildId: string, body: RESTPatchAPIAutoModerationRuleJSONBody, reason?: string) {
    return this.session.api.guilds(guildId)['auto-moderation'].rules.patch({ body, reason });
  }

  deleteAutoModerationRule(guildId: string, ruleId: string, reason?: string) {
    return this.session.api.guilds(guildId)['auto-moderation'].rules(ruleId).delete({ reason });
  }

  getTemplate(code: string) {
    return this.session.api.guilds.templates(code).get();
  }

  createTemplate(code: string, body: RESTPostAPITemplateCreateGuildJSONBody) {
    return this.session.api.guilds.templates(code).post({ body });
  }

  getWebhooks(guildId: string) {
    return this.session.api.guilds(guildId).webhooks.get();
  }

  getPreview(guildId: string) {
    return this.session.api.guilds(guildId).preview.get();
  }

  getMembers(guildId: string, query?: RESTGetAPIGuildMembersQuery) {
    return this.session.api.guilds(guildId).members.get({ query });
  }

  searchMembers(guildId: string, query?: RESTGetAPIGuildMembersSearchQuery) {
    return this.session.api.guilds(guildId).members.search.get({ query });
  }

  editCurrentMember(guildId: string, body: RESTPatchAPICurrentGuildMemberJSONBody) {
    return this.session.api.guilds(guildId).members['@me'].patch({ body });
  }

  getMember(guildId: string, memberId: string) {
    return this.session.api.guilds(guildId).members(memberId).get();
  }

  addMember(guildId: string, memberId: string, body: RESTPutAPIGuildMemberJSONBody) {
    return this.session.api.guilds(guildId).members(memberId).put({ body });
  }

  editMember(guildId: string, memberId: string, body: RESTPatchAPIGuildMemberJSONBody) {
    return this.session.api.guilds(guildId).members(memberId).patch({ body });
  }

  removeMember(guildId: string, memberId: string) {
    return this.session.api.guilds(guildId).members(memberId).delete();
  }

  addRoleMember(guildId: string, memberId: string, roleId: string) {
    return this.session.api.guilds(guildId).members(memberId).roles(roleId).put({});
  }

  removeRoleMember(guildId: string, memberId: string, roleId: string) {
    return this.session.api.guilds(guildId).members(memberId).roles(roleId).delete({});
  }

  getWidgetJson(guildId: string) {
    return this.session.api.guilds(guildId)['widget.json'].get();
  }

  getWidgetPng(guildId: string, query?: RESTGetAPIGuildWidgetImageQuery) {
    return this.session.api.guilds(guildId)['widget.png'].get({ query });
  }

  getEmojis(guildId: string) {
    return this.session.api.guilds(guildId).emojis.get();
  }

  createEmoji(guildId: string, body: RESTPostAPIGuildEmojiJSONBody) {
    return this.session.api.guilds(guildId).emojis.post({ body });
  }

  getEmoji(guildId: string, emojiId: string) {
    return this.session.api.guilds(guildId).emojis(emojiId).get();
  }

  editEmoji(guildId: string, emojiId: string, body: RESTPatchAPIGuildEmojiJSONBody) {
    return this.session.api.guilds(guildId).emojis(emojiId).patch({ body });
  }

  deleteEmoji(guildId: string, emojiId: string) {
    return this.session.api.guilds(guildId).emojis(emojiId).delete();
  }

  editCurrentVoiceState(guildId: string, body: RESTPatchAPIGuildVoiceStateCurrentMemberJSONBody) {
    return this.session.api.guilds(guildId)['voice-states']['@me'].patch({ body });
  }

  editMemberVoiceState(guildId: string, memberId: string, body: RESTPatchAPIGuildVoiceStateUserJSONBody) {
    return this.session.api.guilds(guildId)['voice-states'](memberId).patch({ body });
  }

  getStickers(guildId: string) {
    return this.session.api.guilds(guildId).stickers.get();
  }

  createSticker(guildId: string, body: RESTPostAPIGuildStickerFormDataBody) {
    return this.session.api.guilds(guildId).stickers.post({ body });
  }

  getSticker(guildId: string, stickerId: string) {
    return this.session.api.guilds(guildId).stickers(stickerId).get();
  }

  editSticker(guildId: string, stickerId: string, body: RESTPatchAPIGuildStickerJSONBody) {
    return this.session.api.guilds(guildId).stickers(stickerId).patch({ body });
  }

  deleteSticker(guildId: string, stickerId: string) {
    return this.session.api.guilds(guildId).stickers(stickerId).delete();
  }

  getScheduledEvents(guildId: string, query?: RESTGetAPIGuildScheduledEventsQuery) {
    return this.session.api.guilds(guildId)['scheduled-events'].get({ query });
  }

  createScheduledEvent(guildId: string, body: RESTPostAPIGuildScheduledEventJSONBody) {
    return this.session.api.guilds(guildId)['scheduled-events'].post({ body });
  }

  getScheduledEvent(guildId: string, scheduledEvent: string, query?: RESTGetAPIGuildScheduledEventQuery) {
    return this.session.api.guilds(guildId)['scheduled-events'](scheduledEvent).get({ query });
  }

  editScheduledEvent(guildId: string, scheduledEvent: string, body: RESTPatchAPIGuildScheduledEventJSONBody) {
    return this.session.api.guilds(guildId)['scheduled-events'](scheduledEvent).patch({ body });
  }

  deleteScheduledEvent(guildId: string, scheduledEvent: string) {
    return this.session.api.guilds(guildId)['scheduled-events'](scheduledEvent).delete();
  }

  getUsersScheduledEvent(guildId: string, scheduledEvent: string, query: RESTGetAPIGuildScheduledEventUsersQuery) {
    return this.session.api.guilds(guildId)['scheduled-events'](scheduledEvent).users.get({ query });
  }

  getGuildTemplates(guildId: string) {
    return this.session.api.guilds(guildId).templates.get();
  }

  createGuildTemplate(guildId: string, body: RESTPostAPIGuildTemplatesJSONBody) {
    return this.session.api.guilds(guildId).templates.post({ body });
  }

  syncGuildTemplate(guildId: string, code: string) {
    return this.session.api.guilds(guildId).templates(code).put({});
  }

  modifyGuildTemaplte(guildId: string, code: string, body: RESTPatchAPIGuildTemplateJSONBody) {
    return this.session.api.guilds(guildId).templates(code).patch({ body });
  }

  deleteCodeTemplate(guildId: string, code: string) {
    return this.session.api.guilds(guildId).templates(code).delete();
  }
}
