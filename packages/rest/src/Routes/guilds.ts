import {
  APIThreadChannel,
  Identify,
  RESTDeleteAPIAutoModerationRuleResult,
  RESTDeleteAPIGuildBanResult,
  RESTDeleteAPIGuildEmojiResult,
  RESTDeleteAPIGuildIntegrationResult,
  RESTDeleteAPIGuildMemberResult,
  RESTDeleteAPIGuildMemberRoleResult,
  RESTDeleteAPIGuildResult,
  RESTDeleteAPIGuildRoleResult,
  RESTDeleteAPIGuildScheduledEventResult,
  RESTDeleteAPIGuildStickerResult,
  RESTDeleteAPIGuildTemplateResult,
  RESTGetAPIAuditLogQuery,
  RESTGetAPIAuditLogResult,
  RESTGetAPIAutoModerationRuleResult,
  RESTGetAPIAutoModerationRulesResult,
  RESTGetAPIGuildBanResult,
  RESTGetAPIGuildBansQuery,
  RESTGetAPIGuildBansResult,
  RESTGetAPIGuildChannelsResult,
  RESTGetAPIGuildEmojiResult,
  RESTGetAPIGuildEmojisResult,
  RESTGetAPIGuildIntegrationsResult,
  RESTGetAPIGuildInvitesResult,
  RESTGetAPIGuildMemberResult,
  RESTGetAPIGuildMembersQuery,
  RESTGetAPIGuildMembersResult,
  RESTGetAPIGuildMembersSearchQuery,
  RESTGetAPIGuildMembersSearchResult,
  RESTGetAPIGuildPreviewResult,
  RESTGetAPIGuildPruneCountQuery,
  RESTGetAPIGuildPruneCountResult,
  RESTGetAPIGuildQuery,
  RESTGetAPIGuildResult,
  RESTGetAPIGuildRolesResult,
  RESTGetAPIGuildScheduledEventQuery,
  RESTGetAPIGuildScheduledEventResult,
  RESTGetAPIGuildScheduledEventUsersQuery,
  RESTGetAPIGuildScheduledEventUsersResult,
  RESTGetAPIGuildScheduledEventsQuery,
  RESTGetAPIGuildScheduledEventsResult,
  RESTGetAPIGuildStickerResult,
  RESTGetAPIGuildStickersResult,
  RESTGetAPIGuildTemplatesResult,
  RESTGetAPIGuildThreadsResult,
  RESTGetAPIGuildVanityUrlResult,
  RESTGetAPIGuildVoiceRegionsResult,
  RESTGetAPIGuildWebhooksResult,
  RESTGetAPIGuildWelcomeScreenResult,
  RESTGetAPIGuildWidgetImageQuery,
  RESTGetAPIGuildWidgetImageResult,
  RESTGetAPIGuildWidgetJSONResult,
  RESTGetAPIGuildWidgetSettingsResult,
  RESTGetAPITemplateResult,
  RESTPatchAPIAutoModerationRuleJSONBody,
  RESTPatchAPIAutoModerationRuleResult,
  RESTPatchAPICurrentGuildMemberJSONBody,
  RESTPatchAPIGuildChannelPositionsJSONBody,
  RESTPatchAPIGuildChannelPositionsResult,
  RESTPatchAPIGuildEmojiJSONBody,
  RESTPatchAPIGuildEmojiResult,
  RESTPatchAPIGuildJSONBody,
  RESTPatchAPIGuildMemberJSONBody,
  RESTPatchAPIGuildMemberResult,
  RESTPatchAPIGuildResult,
  RESTPatchAPIGuildRoleJSONBody,
  RESTPatchAPIGuildRolePositionsJSONBody,
  RESTPatchAPIGuildRolePositionsResult,
  RESTPatchAPIGuildRoleResult,
  RESTPatchAPIGuildScheduledEventJSONBody,
  RESTPatchAPIGuildScheduledEventResult,
  RESTPatchAPIGuildStickerJSONBody,
  RESTPatchAPIGuildStickerResult,
  RESTPatchAPIGuildTemplateJSONBody,
  RESTPatchAPIGuildTemplateResult,
  RESTPatchAPIGuildVoiceStateCurrentMemberJSONBody,
  RESTPatchAPIGuildVoiceStateCurrentMemberResult,
  RESTPatchAPIGuildVoiceStateUserJSONBody,
  RESTPatchAPIGuildVoiceStateUserResult,
  RESTPatchAPIGuildWelcomeScreenJSONBody,
  RESTPatchAPIGuildWelcomeScreenResult,
  RESTPatchAPIGuildWidgetSettingsJSONBody,
  RESTPatchAPIGuildWidgetSettingsResult,
  RESTPostAPIAutoModerationRuleJSONBody,
  RESTPostAPIAutoModerationRuleResult,
  RESTPostAPIGuildChannelJSONBody,
  RESTPostAPIGuildChannelResult,
  RESTPostAPIGuildEmojiJSONBody,
  RESTPostAPIGuildEmojiResult,
  RESTPostAPIGuildPruneJSONBody,
  RESTPostAPIGuildPruneResult,
  RESTPostAPIGuildRoleJSONBody,
  RESTPostAPIGuildRoleResult,
  RESTPostAPIGuildScheduledEventJSONBody,
  RESTPostAPIGuildScheduledEventResult,
  RESTPostAPIGuildStickerFormDataBody,
  RESTPostAPIGuildStickerResult,
  RESTPostAPIGuildTemplatesJSONBody,
  RESTPostAPIGuildTemplatesResult,
  RESTPostAPIGuildsJSONBody,
  RESTPostAPIGuildsMFAJSONBody,
  RESTPostAPIGuildsMFAResult,
  RESTPostAPIGuildsResult,
  RESTPostAPITemplateCreateGuildJSONBody,
  RESTPostAPITemplateCreateGuildResult,
  RESTPutAPIGuildBanJSONBody,
  RESTPutAPIGuildBanResult,
  RESTPutAPIGuildMemberJSONBody,
  RESTPutAPIGuildMemberResult,
  RESTPutAPIGuildMemberRoleResult,
  RESTPutAPIGuildTemplateSyncResult
} from '@biscuitland/common';
import { RestArguments } from '../REST';
import { RequestMethod } from '../Router';

export interface GuildRoutes {
  guilds: {
    //.
    post(args: RestArguments<RequestMethod.Post, RESTPostAPIGuildsJSONBody>): Promise<RESTPostAPIGuildsResult>;
    templates(code: string): {
      //.
      get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPITemplateResult>;
      //.
      post(
        args: RestArguments<RequestMethod.Post, RESTPostAPITemplateCreateGuildJSONBody>
      ): Promise<RESTPostAPITemplateCreateGuildResult>;
    };
    (id: string): {
      //.
      get(args?: RestArguments<RequestMethod.Get, RESTGetAPIGuildQuery>): Promise<RESTGetAPIGuildResult>;
      //.
      patch(args: RestArguments<RequestMethod.Patch, RESTPatchAPIGuildJSONBody>): Promise<RESTPatchAPIGuildResult>;
      //.
      delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIGuildResult>;
      webhooks: {
        //.
        get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildWebhooksResult>;
      };
      preview: {
        //.
        get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildPreviewResult>;
      };
      'audit-logs': {
        //.
        get(args?: RestArguments<RequestMethod.Get, RESTGetAPIAuditLogQuery>): Promise<RESTGetAPIAuditLogResult>;
      };
      'auto-moderation': {
        rules: {
          //.
          get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIAutoModerationRulesResult>;
          //.
          post(
            args: RestArguments<RequestMethod.Post, RESTPostAPIAutoModerationRuleJSONBody>
          ): Promise<RESTPostAPIAutoModerationRuleResult>;
          //.
          patch(
            args: RestArguments<RequestMethod.Post, RESTPatchAPIAutoModerationRuleJSONBody>
          ): Promise<RESTPatchAPIAutoModerationRuleResult>;
          (id: string): {
            //.
            get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIAutoModerationRuleResult>;
            //.
            delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIAutoModerationRuleResult>;
          };
        };
      };
      channels: {
        //.
        get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildChannelsResult>;
        //.
        post(
          args: RestArguments<RequestMethod.Post, RESTPostAPIGuildChannelJSONBody>
        ): Promise<RESTPostAPIGuildChannelResult>;
        //.
        patch(
          args: RestArguments<RequestMethod.Patch, RESTPatchAPIGuildChannelPositionsJSONBody>
        ): Promise<RESTPatchAPIGuildChannelPositionsResult>;
      };
      members: {
        //.
        get(
          args?: RestArguments<RequestMethod.Get, RESTGetAPIGuildMembersQuery>
        ): Promise<RESTGetAPIGuildMembersResult>;
        search: {
          //.
          get(
            args: RestArguments<RequestMethod.Get, RESTGetAPIGuildMembersSearchQuery>
          ): Promise<RESTGetAPIGuildMembersSearchResult>;
        };
        '@me': {
          //.
          patch(
            args: RestArguments<RequestMethod.Patch, RESTPatchAPICurrentGuildMemberJSONBody>
          ): Promise<RESTGetAPIGuildMemberResult>;
        };
        (id: string): {
          //.
          get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildMemberResult>;
          //.
          put(
            args: RestArguments<RequestMethod.Put, RESTPutAPIGuildMemberJSONBody>
          ): Promise<RESTPutAPIGuildMemberResult>;
          //.
          //.
          patch(
            args: RestArguments<RequestMethod.Patch, RESTPatchAPIGuildMemberJSONBody>
          ): Promise<RESTPatchAPIGuildMemberResult>;
          //.
          delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIGuildMemberResult>;
          roles(id: string): {
            //.
            put(args: RestArguments<RequestMethod.Put>): Promise<RESTPutAPIGuildMemberRoleResult>;
            //.
            delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIGuildMemberRoleResult>;
          };
        };
      };
      threads: {
        active: {
          //.
          get(
            args?: RestArguments<RequestMethod.Get>
          ): Promise<Identify<RESTGetAPIGuildThreadsResult & { threads: Partial<APIThreadChannel> }>>;
        };
      };
      roles: {
        //.
        get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildRolesResult>;
        //.
        post(
          args: RestArguments<RequestMethod.Post, RESTPostAPIGuildRoleJSONBody>
        ): Promise<RESTPostAPIGuildRoleResult>;
        //.
        patch(
          args: RestArguments<RequestMethod.Patch, RESTPatchAPIGuildRolePositionsJSONBody>
        ): Promise<RESTPatchAPIGuildRolePositionsResult>;
        (id: string): {
          //.
          patch(
            args: RestArguments<RequestMethod.Patch, RESTPatchAPIGuildRoleJSONBody>
          ): Promise<RESTPatchAPIGuildRoleResult>;
          //.
          delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIGuildRoleResult>;
        };
      };
      bans: {
        //.
        get(args: RestArguments<RequestMethod.Get, RESTGetAPIGuildBansQuery>): Promise<RESTGetAPIGuildBansResult>;
        (userId: string): {
          //.
          get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildBanResult>;
          //.
          put(args: RestArguments<RequestMethod.Put, RESTPutAPIGuildBanJSONBody>): Promise<RESTPutAPIGuildBanResult>;
          //.
          delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIGuildBanResult>;
        };
      };
      mfa: {
        //.
        post(
          args: RestArguments<RequestMethod.Post, RESTPostAPIGuildsMFAJSONBody>
        ): Promise<RESTPostAPIGuildsMFAResult>;
      };
      prune: {
        //.
        get(
          args: RestArguments<RequestMethod.Get, RESTGetAPIGuildPruneCountQuery>
        ): Promise<RESTGetAPIGuildPruneCountResult>;
        //.
        post(
          args: RestArguments<RequestMethod.Post, RESTPostAPIGuildPruneJSONBody>
        ): Promise<RESTPostAPIGuildPruneResult>;
      };
      regions: {
        //.
        get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildVoiceRegionsResult>;
      };
      invites: {
        //.
        get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildInvitesResult>;
      };
      widget: {
        //.
        get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildWidgetSettingsResult>;
        //.
        patch(
          args: RestArguments<RequestMethod.Patch, RESTPatchAPIGuildWidgetSettingsJSONBody>
        ): Promise<RESTPatchAPIGuildWidgetSettingsResult>;
      };
      'widget.json': {
        //.
        get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildWidgetJSONResult>;
      };
      'widget.png': {
        //.
        get(
          args?: RestArguments<RequestMethod.Get, RESTGetAPIGuildWidgetImageQuery>
        ): Promise<RESTGetAPIGuildWidgetImageResult>;
      };
      integrations: {
        //.
        get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildIntegrationsResult>;
        (id: string): {
          //.
          delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIGuildIntegrationResult>;
        };
      };
      'vanity-url': {
        //.
        get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildVanityUrlResult>;
      };
      'welcome-screen': {
        //.
        get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildWelcomeScreenResult>;
        //.
        patch(
          args: RestArguments<RequestMethod.Patch, RESTPatchAPIGuildWelcomeScreenJSONBody>
        ): Promise<RESTPatchAPIGuildWelcomeScreenResult>;
      };
      // onboarding: {
      // 	get(args:RestArguments<RequestMethod.Get,boarding>);
      // }
      emojis: {
        //.
        get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildEmojisResult>;
        //.
        post(
          args: RestArguments<RequestMethod.Post, RESTPostAPIGuildEmojiJSONBody>
        ): Promise<RESTPostAPIGuildEmojiResult>;
        (id: string): {
          //.
          get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildEmojiResult>;
          //.
          patch(
            args: RestArguments<RequestMethod.Patch, RESTPatchAPIGuildEmojiJSONBody>
          ): Promise<RESTPatchAPIGuildEmojiResult>;
          //.
          delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIGuildEmojiResult>;
        };
      };
      'voice-states': {
        '@me': {
          //.
          patch(
            args: RestArguments<RequestMethod.Patch, RESTPatchAPIGuildVoiceStateCurrentMemberJSONBody>
          ): Promise<RESTPatchAPIGuildVoiceStateCurrentMemberResult>;
        };
        (id: string): {
          //.
          patch(
            args: RestArguments<RequestMethod.Patch, RESTPatchAPIGuildVoiceStateUserJSONBody>
          ): Promise<RESTPatchAPIGuildVoiceStateUserResult>;
        };
      };
      stickers: {
        //.
        get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildStickersResult>;
        //.
        post(
          args: RestArguments<RequestMethod.Post, RESTPostAPIGuildStickerFormDataBody>
        ): Promise<RESTPostAPIGuildStickerResult>;
        (id: string): {
          //.
          get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildStickerResult>;
          //.
          patch(
            args: RestArguments<RequestMethod.Patch, RESTPatchAPIGuildStickerJSONBody>
          ): Promise<RESTPatchAPIGuildStickerResult>;
          //.
          delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIGuildStickerResult>;
        };
      };
      'scheduled-events': {
        //.
        get(
          args?: RestArguments<RequestMethod.Get, RESTGetAPIGuildScheduledEventsQuery>
        ): Promise<RESTGetAPIGuildScheduledEventsResult>;
        //.
        post(
          args: RestArguments<RequestMethod.Post, RESTPostAPIGuildScheduledEventJSONBody>
        ): Promise<RESTPostAPIGuildScheduledEventResult>;
        (id: string): {
          //.
          get(
            args?: RestArguments<RequestMethod.Get, RESTGetAPIGuildScheduledEventQuery>
          ): Promise<RESTGetAPIGuildScheduledEventResult>;
          //.
          patch(
            args: RestArguments<RequestMethod.Patch, RESTPatchAPIGuildScheduledEventJSONBody>
          ): Promise<RESTPatchAPIGuildScheduledEventResult>;
          //.
          delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIGuildScheduledEventResult>;
          users: {
            //.
            get(
              args?: RestArguments<RequestMethod.Get, RESTGetAPIGuildScheduledEventUsersQuery>
            ): Promise<RESTGetAPIGuildScheduledEventUsersResult>;
          };
        };
      };
      templates: {
        //.
        get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildTemplatesResult>;
        //.
        post(
          args: RestArguments<RequestMethod.Post, RESTPostAPIGuildTemplatesJSONBody>
        ): Promise<RESTPostAPIGuildTemplatesResult>;
        (code: string): {
          //.
          put(args: RestArguments<RequestMethod.Put>): Promise<RESTPutAPIGuildTemplateSyncResult>;
          //.
          patch(
            args: RestArguments<RequestMethod.Patch, RESTPatchAPIGuildTemplateJSONBody>
          ): Promise<RESTPatchAPIGuildTemplateResult>;
          //.
          delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIGuildTemplateResult>;
        };
      };
    };
  };
}
