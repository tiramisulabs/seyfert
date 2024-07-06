import type {
	APIThreadChannel,
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
	RESTPostAPIGuildBulkBanJSONBody,
	RESTPostAPIGuildBulkBanResult,
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
	RESTPutAPIGuildTemplateSyncResult,
} from 'discord-api-types/v10';
import type { Identify, OmitInsert } from '../../common';
import type { ProxyRequestMethod } from '../Router';
import type { RestArguments } from '../api';
import type { RawFile } from '../shared';

export interface GuildRoutes {
	guilds: {
		post(args: RestArguments<ProxyRequestMethod.Post, RESTPostAPIGuildsJSONBody>): Promise<RESTPostAPIGuildsResult>;
		templates(code: string): {
			get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPITemplateResult>;
			post(
				args: RestArguments<ProxyRequestMethod.Post, RESTPostAPITemplateCreateGuildJSONBody>,
			): Promise<RESTPostAPITemplateCreateGuildResult>;
		};
		(
			id: string,
		): {
			get(args?: RestArguments<ProxyRequestMethod.Get, RESTGetAPIGuildQuery>): Promise<RESTGetAPIGuildResult>;
			patch(args: RestArguments<ProxyRequestMethod.Patch, RESTPatchAPIGuildJSONBody>): Promise<RESTPatchAPIGuildResult>;
			delete(args?: RestArguments<ProxyRequestMethod.Delete>): Promise<RESTDeleteAPIGuildResult>;
			webhooks: {
				get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIGuildWebhooksResult>;
			};
			preview: {
				get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIGuildPreviewResult>;
			};
			'audit-logs': {
				get(args?: RestArguments<ProxyRequestMethod.Get, RESTGetAPIAuditLogQuery>): Promise<RESTGetAPIAuditLogResult>;
			};
			'auto-moderation': {
				rules: {
					get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIAutoModerationRulesResult>;
					post(
						args: RestArguments<ProxyRequestMethod.Post, RESTPostAPIAutoModerationRuleJSONBody>,
					): Promise<RESTPostAPIAutoModerationRuleResult>;
					(
						id: string,
					): {
						get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIAutoModerationRuleResult>;
						patch(
							args: RestArguments<ProxyRequestMethod.Post, RESTPatchAPIAutoModerationRuleJSONBody>,
						): Promise<RESTPatchAPIAutoModerationRuleResult>;
						delete(args?: RestArguments<ProxyRequestMethod.Delete>): Promise<RESTDeleteAPIAutoModerationRuleResult>;
					};
				};
			};
			channels: {
				get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIGuildChannelsResult>;
				post(
					args: RestArguments<ProxyRequestMethod.Post, RESTPostAPIGuildChannelJSONBody>,
				): Promise<RESTPostAPIGuildChannelResult>;
				patch(
					args: RestArguments<ProxyRequestMethod.Patch, RESTPatchAPIGuildChannelPositionsJSONBody>,
				): Promise<RESTPatchAPIGuildChannelPositionsResult>;
			};
			members: {
				get(
					args?: RestArguments<ProxyRequestMethod.Get, RESTGetAPIGuildMembersQuery>,
				): Promise<RESTGetAPIGuildMembersResult>;
				search: {
					get(
						args: RestArguments<ProxyRequestMethod.Get, RESTGetAPIGuildMembersSearchQuery>,
					): Promise<RESTGetAPIGuildMembersSearchResult>;
				};
				'@me': {
					patch(
						args: RestArguments<ProxyRequestMethod.Patch, RESTPatchAPICurrentGuildMemberJSONBody>,
					): Promise<RESTGetAPIGuildMemberResult>;
				};
				(
					id: string,
				): {
					get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIGuildMemberResult>;
					put(
						args?: RestArguments<ProxyRequestMethod.Put, RESTPutAPIGuildMemberJSONBody>,
					): Promise<RESTPutAPIGuildMemberResult>;
					patch(
						args: RestArguments<ProxyRequestMethod.Patch, RESTPatchAPIGuildMemberJSONBody>,
					): Promise<RESTPatchAPIGuildMemberResult>;
					delete(args?: RestArguments<ProxyRequestMethod.Delete>): Promise<RESTDeleteAPIGuildMemberResult>;
					roles(id: string): {
						put(args?: RestArguments<ProxyRequestMethod.Put>): Promise<RESTPutAPIGuildMemberRoleResult>;
						delete(args?: RestArguments<ProxyRequestMethod.Delete>): Promise<RESTDeleteAPIGuildMemberRoleResult>;
					};
				};
			};
			threads: {
				active: {
					get(
						args?: RestArguments<ProxyRequestMethod.Get>,
					): Promise<Identify<RESTGetAPIGuildThreadsResult & { threads: Partial<APIThreadChannel> }>>;
				};
			};
			roles: {
				get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIGuildRolesResult>;
				post(
					args: RestArguments<ProxyRequestMethod.Post, RESTPostAPIGuildRoleJSONBody>,
				): Promise<RESTPostAPIGuildRoleResult>;
				patch(
					args: RestArguments<ProxyRequestMethod.Patch, RESTPatchAPIGuildRolePositionsJSONBody>,
				): Promise<RESTPatchAPIGuildRolePositionsResult>;
				(
					id: string,
				): {
					patch(
						args: RestArguments<ProxyRequestMethod.Patch, RESTPatchAPIGuildRoleJSONBody>,
					): Promise<RESTPatchAPIGuildRoleResult>;
					delete(args?: RestArguments<ProxyRequestMethod.Delete>): Promise<RESTDeleteAPIGuildRoleResult>;
				};
			};
			bans: {
				get(args?: RestArguments<ProxyRequestMethod.Get, RESTGetAPIGuildBansQuery>): Promise<RESTGetAPIGuildBansResult>;
				(
					userId: string,
				): {
					get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIGuildBanResult>;
					put(
						args?: RestArguments<ProxyRequestMethod.Put, RESTPutAPIGuildBanJSONBody>,
					): Promise<RESTPutAPIGuildBanResult>;
					delete(args?: RestArguments<ProxyRequestMethod.Delete>): Promise<RESTDeleteAPIGuildBanResult>;
				};
			};
			'bulk-bans': {
				post(
					args: RestArguments<ProxyRequestMethod.Post, RESTPostAPIGuildBulkBanJSONBody>,
				): Promise<RESTPostAPIGuildBulkBanResult>;
			};
			mfa: {
				post(
					args: RestArguments<ProxyRequestMethod.Post, RESTPostAPIGuildsMFAJSONBody>,
				): Promise<RESTPostAPIGuildsMFAResult>;
			};
			prune: {
				get(
					args: RestArguments<ProxyRequestMethod.Get, RESTGetAPIGuildPruneCountQuery>,
				): Promise<RESTGetAPIGuildPruneCountResult>;
				post(
					args: RestArguments<ProxyRequestMethod.Post, RESTPostAPIGuildPruneJSONBody>,
				): Promise<RESTPostAPIGuildPruneResult>;
			};
			regions: {
				get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIGuildVoiceRegionsResult>;
			};
			invites: {
				get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIGuildInvitesResult>;
			};
			widget: {
				get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIGuildWidgetSettingsResult>;
				patch(
					args: RestArguments<ProxyRequestMethod.Patch, RESTPatchAPIGuildWidgetSettingsJSONBody>,
				): Promise<RESTPatchAPIGuildWidgetSettingsResult>;
			};
			'widget.json': {
				get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIGuildWidgetJSONResult>;
			};
			'widget.png': {
				get(
					args?: RestArguments<ProxyRequestMethod.Get, RESTGetAPIGuildWidgetImageQuery>,
				): Promise<RESTGetAPIGuildWidgetImageResult>;
			};
			integrations: {
				get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIGuildIntegrationsResult>;
				(
					id: string,
				): {
					delete(args?: RestArguments<ProxyRequestMethod.Delete>): Promise<RESTDeleteAPIGuildIntegrationResult>;
				};
			};
			'vanity-url': {
				get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIGuildVanityUrlResult>;
			};
			'welcome-screen': {
				get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIGuildWelcomeScreenResult>;
				patch(
					args: RestArguments<ProxyRequestMethod.Patch, RESTPatchAPIGuildWelcomeScreenJSONBody>,
				): Promise<RESTPatchAPIGuildWelcomeScreenResult>;
			};
			// onboarding: {
			// 	get(args:RestArguments<ProxyRequestMethod.Get,boarding>);
			// }
			emojis: {
				get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIGuildEmojisResult>;
				post(
					args: RestArguments<ProxyRequestMethod.Post, RESTPostAPIGuildEmojiJSONBody>,
				): Promise<RESTPostAPIGuildEmojiResult>;
				(
					id: string,
				): {
					get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIGuildEmojiResult>;
					patch(
						args: RestArguments<ProxyRequestMethod.Patch, RESTPatchAPIGuildEmojiJSONBody>,
					): Promise<RESTPatchAPIGuildEmojiResult>;
					delete(args?: RestArguments<ProxyRequestMethod.Delete>): Promise<RESTDeleteAPIGuildEmojiResult>;
				};
			};
			'voice-states': {
				'@me': {
					patch(
						args: RestArguments<ProxyRequestMethod.Patch, RESTPatchAPIGuildVoiceStateCurrentMemberJSONBody>,
					): Promise<RESTPatchAPIGuildVoiceStateCurrentMemberResult>;
				};
				(
					id: string,
				): {
					patch(
						args: RestArguments<ProxyRequestMethod.Patch, RESTPatchAPIGuildVoiceStateUserJSONBody>,
					): Promise<RESTPatchAPIGuildVoiceStateUserResult>;
				};
			};
			stickers: {
				get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIGuildStickersResult>;
				post(
					args: RestArguments<
						ProxyRequestMethod.Post,
						Omit<RESTPostAPIGuildStickerFormDataBody, 'file'>,
						{},
						OmitInsert<RawFile, 'key', { key: 'file' }>[]
					>,
				): Promise<RESTPostAPIGuildStickerResult>;
				(
					id: string,
				): {
					get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIGuildStickerResult>;
					patch(
						args: RestArguments<ProxyRequestMethod.Patch, RESTPatchAPIGuildStickerJSONBody>,
					): Promise<RESTPatchAPIGuildStickerResult>;
					delete(args?: RestArguments<ProxyRequestMethod.Delete>): Promise<RESTDeleteAPIGuildStickerResult>;
				};
			};
			'scheduled-events': {
				get(
					args?: RestArguments<ProxyRequestMethod.Get, RESTGetAPIGuildScheduledEventsQuery>,
				): Promise<RESTGetAPIGuildScheduledEventsResult>;
				post(
					args: RestArguments<ProxyRequestMethod.Post, RESTPostAPIGuildScheduledEventJSONBody>,
				): Promise<RESTPostAPIGuildScheduledEventResult>;
				(
					id: string,
				): {
					get(
						args?: RestArguments<ProxyRequestMethod.Get, RESTGetAPIGuildScheduledEventQuery>,
					): Promise<RESTGetAPIGuildScheduledEventResult>;
					patch(
						args: RestArguments<ProxyRequestMethod.Patch, RESTPatchAPIGuildScheduledEventJSONBody>,
					): Promise<RESTPatchAPIGuildScheduledEventResult>;
					delete(args?: RestArguments<ProxyRequestMethod.Delete>): Promise<RESTDeleteAPIGuildScheduledEventResult>;
					users: {
						get(
							args?: RestArguments<ProxyRequestMethod.Get, RESTGetAPIGuildScheduledEventUsersQuery>,
						): Promise<RESTGetAPIGuildScheduledEventUsersResult>;
					};
				};
			};
			templates: {
				get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIGuildTemplatesResult>;
				post(
					args: RestArguments<ProxyRequestMethod.Post, RESTPostAPIGuildTemplatesJSONBody>,
				): Promise<RESTPostAPIGuildTemplatesResult>;
				(
					code: string,
				): {
					put(args?: RestArguments<ProxyRequestMethod.Put>): Promise<RESTPutAPIGuildTemplateSyncResult>;
					patch(
						args: RestArguments<ProxyRequestMethod.Patch, RESTPatchAPIGuildTemplateJSONBody>,
					): Promise<RESTPatchAPIGuildTemplateResult>;
					delete(args?: RestArguments<ProxyRequestMethod.Delete>): Promise<RESTDeleteAPIGuildTemplateResult>;
				};
			};
		};
	};
}
