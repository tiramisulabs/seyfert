import type { Identify, OmitInsert } from '../../common';
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
	RESTGetAPICurrentUserVoiceState,
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
	RESTGetAPIGuildRoleMemberCountsResult,
	RESTGetAPIGuildRoleResult,
	RESTGetAPIGuildRolesResult,
	RESTGetAPIGuildScheduledEventQuery,
	RESTGetAPIGuildScheduledEventResult,
	RESTGetAPIGuildScheduledEventsQuery,
	RESTGetAPIGuildScheduledEventsResult,
	RESTGetAPIGuildScheduledEventUsersQuery,
	RESTGetAPIGuildScheduledEventUsersResult,
	RESTGetAPIGuildSoundboardSoundsResult,
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
	RESTGetAPIUserVoiceState,
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
	RESTPatchAPIGuildSoundboardSound,
	RESTPatchAPIGuildSoundboardSoundResult,
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
	RESTPostAPIGuildSoundboardSound,
	RESTPostAPIGuildSoundboardSoundResult,
	RESTPostAPIGuildStickerFormDataBody,
	RESTPostAPIGuildStickerResult,
	RESTPostAPIGuildsMFAJSONBody,
	RESTPostAPIGuildsMFAResult,
	RESTPostAPIGuildTemplatesJSONBody,
	RESTPostAPIGuildTemplatesResult,
	RESTPostAPITemplateCreateGuildJSONBody,
	RESTPostAPITemplateCreateGuildResult,
	RESTPutAPIGuildBanJSONBody,
	RESTPutAPIGuildBanResult,
	RESTPutAPIGuildMemberJSONBody,
	RESTPutAPIGuildMemberResult,
	RESTPutAPIGuildMemberRoleResult,
	RESTPutAPIGuildTemplateSyncResult,
} from '../../types';
import type { RestArguments, RestArgumentsNoBody } from '../api';
import type { RawFile } from '../shared';

export interface GuildRoutes {
	guilds: {
		templates(code: string): {
			get(args?: RestArgumentsNoBody): Promise<RESTGetAPITemplateResult>;
			post(args: RestArguments<RESTPostAPITemplateCreateGuildJSONBody>): Promise<RESTPostAPITemplateCreateGuildResult>;
		};
		(
			id: string,
		): {
			get(args?: RestArgumentsNoBody<RESTGetAPIGuildQuery>): Promise<RESTGetAPIGuildResult>;
			patch(args: RestArguments<RESTPatchAPIGuildJSONBody>): Promise<RESTPatchAPIGuildResult>;
			delete(args?: RestArgumentsNoBody): Promise<RESTDeleteAPIGuildResult>;
			webhooks: {
				get(args?: RestArgumentsNoBody): Promise<RESTGetAPIGuildWebhooksResult>;
			};
			preview: {
				get(args?: RestArgumentsNoBody): Promise<RESTGetAPIGuildPreviewResult>;
			};
			'audit-logs': {
				get(args?: RestArgumentsNoBody<RESTGetAPIAuditLogQuery>): Promise<RESTGetAPIAuditLogResult>;
			};
			'auto-moderation': {
				rules: {
					get(args?: RestArgumentsNoBody): Promise<RESTGetAPIAutoModerationRulesResult>;
					post(
						args: RestArguments<RESTPostAPIAutoModerationRuleJSONBody>,
					): Promise<RESTPostAPIAutoModerationRuleResult>;
					(
						id: string,
					): {
						get(args?: RestArgumentsNoBody): Promise<RESTGetAPIAutoModerationRuleResult>;
						patch(
							args: RestArguments<RESTPatchAPIAutoModerationRuleJSONBody>,
						): Promise<RESTPatchAPIAutoModerationRuleResult>;
						delete(args?: RestArgumentsNoBody): Promise<RESTDeleteAPIAutoModerationRuleResult>;
					};
				};
			};
			channels: {
				get(args?: RestArgumentsNoBody): Promise<RESTGetAPIGuildChannelsResult>;
				post(args: RestArguments<RESTPostAPIGuildChannelJSONBody>): Promise<RESTPostAPIGuildChannelResult>;
				patch(
					args: RestArguments<RESTPatchAPIGuildChannelPositionsJSONBody>,
				): Promise<RESTPatchAPIGuildChannelPositionsResult>;
			};
			members: {
				get(args?: RestArgumentsNoBody<RESTGetAPIGuildMembersQuery>): Promise<RESTGetAPIGuildMembersResult>;
				search: {
					get(
						args: RestArgumentsNoBody<RESTGetAPIGuildMembersSearchQuery>,
					): Promise<RESTGetAPIGuildMembersSearchResult>;
				};
				'@me': {
					patch(args: RestArguments<RESTPatchAPICurrentGuildMemberJSONBody>): Promise<RESTGetAPIGuildMemberResult>;
				};
				(
					id: string,
				): {
					get(args?: RestArgumentsNoBody): Promise<RESTGetAPIGuildMemberResult>;
					put(args?: RestArguments<RESTPutAPIGuildMemberJSONBody>): Promise<RESTPutAPIGuildMemberResult>;
					patch(args: RestArguments<RESTPatchAPIGuildMemberJSONBody>): Promise<RESTPatchAPIGuildMemberResult>;
					delete(args?: RestArgumentsNoBody): Promise<RESTDeleteAPIGuildMemberResult>;
					roles(id: string): {
						put(args?: RestArgumentsNoBody): Promise<RESTPutAPIGuildMemberRoleResult>;
						delete(args?: RestArgumentsNoBody): Promise<RESTDeleteAPIGuildMemberRoleResult>;
					};
				};
			};
			threads: {
				active: {
					get(
						args?: RestArgumentsNoBody,
					): Promise<Identify<RESTGetAPIGuildThreadsResult & { threads: Partial<APIThreadChannel> }>>;
				};
			};
			roles: {
				get(args?: RestArgumentsNoBody): Promise<RESTGetAPIGuildRolesResult>;
				post(args: RestArguments<RESTPostAPIGuildRoleJSONBody>): Promise<RESTPostAPIGuildRoleResult>;
				patch(
					args: RestArguments<RESTPatchAPIGuildRolePositionsJSONBody>,
				): Promise<RESTPatchAPIGuildRolePositionsResult>;
				(
					id: string,
				): {
					get(args?: RestArgumentsNoBody): Promise<RESTGetAPIGuildRoleResult>;
					patch(args: RestArguments<RESTPatchAPIGuildRoleJSONBody>): Promise<RESTPatchAPIGuildRoleResult>;
					delete(args?: RestArgumentsNoBody): Promise<RESTDeleteAPIGuildRoleResult>;
				};
				'member-counts': {
					get(args?: RestArgumentsNoBody): Promise<RESTGetAPIGuildRoleMemberCountsResult>;
				};
			};
			bans: {
				get(args?: RestArgumentsNoBody<RESTGetAPIGuildBansQuery>): Promise<RESTGetAPIGuildBansResult>;
				(
					userId: string,
				): {
					get(args?: RestArgumentsNoBody): Promise<RESTGetAPIGuildBanResult>;
					put(args?: RestArguments<RESTPutAPIGuildBanJSONBody | undefined>): Promise<RESTPutAPIGuildBanResult>;
					delete(args?: RestArgumentsNoBody): Promise<RESTDeleteAPIGuildBanResult>;
				};
			};
			'bulk-bans': {
				post(args: RestArguments<RESTPostAPIGuildBulkBanJSONBody>): Promise<RESTPostAPIGuildBulkBanResult>;
			};
			mfa: {
				post(args: RestArguments<RESTPostAPIGuildsMFAJSONBody>): Promise<RESTPostAPIGuildsMFAResult>;
			};
			prune: {
				get(args: RestArgumentsNoBody<RESTGetAPIGuildPruneCountQuery>): Promise<RESTGetAPIGuildPruneCountResult>;
				post(args: RestArguments<RESTPostAPIGuildPruneJSONBody>): Promise<RESTPostAPIGuildPruneResult>;
			};
			regions: {
				get(args?: RestArgumentsNoBody): Promise<RESTGetAPIGuildVoiceRegionsResult>;
			};
			invites: {
				get(args?: RestArgumentsNoBody): Promise<RESTGetAPIGuildInvitesResult>;
			};
			widget: {
				get(args?: RestArgumentsNoBody<{ style?: string }>): Promise<RESTGetAPIGuildWidgetSettingsResult>;
				patch(
					args: RestArguments<RESTPatchAPIGuildWidgetSettingsJSONBody>,
				): Promise<RESTPatchAPIGuildWidgetSettingsResult>;
			};
			'widget.json': {
				get(args?: RestArgumentsNoBody): Promise<RESTGetAPIGuildWidgetJSONResult>;
			};
			'widget.png': {
				get(args?: RestArgumentsNoBody<RESTGetAPIGuildWidgetImageQuery>): Promise<RESTGetAPIGuildWidgetImageResult>;
			};
			integrations: {
				get(args?: RestArgumentsNoBody): Promise<RESTGetAPIGuildIntegrationsResult>;
				(
					id: string,
				): {
					delete(args?: RestArgumentsNoBody): Promise<RESTDeleteAPIGuildIntegrationResult>;
				};
			};
			'vanity-url': {
				get(args?: RestArgumentsNoBody): Promise<RESTGetAPIGuildVanityUrlResult>;
			};
			'welcome-screen': {
				get(args?: RestArgumentsNoBody): Promise<RESTGetAPIGuildWelcomeScreenResult>;
				patch(
					args: RestArguments<RESTPatchAPIGuildWelcomeScreenJSONBody>,
				): Promise<RESTPatchAPIGuildWelcomeScreenResult>;
			};
			// onboarding: {
			// 	get(args:RestArgumentsNoBody<boarding>);
			// }
			emojis: {
				get(args?: RestArgumentsNoBody): Promise<RESTGetAPIGuildEmojisResult>;
				post(args: RestArguments<RESTPostAPIGuildEmojiJSONBody>): Promise<RESTPostAPIGuildEmojiResult>;
				(
					id: string,
				): {
					get(args?: RestArgumentsNoBody): Promise<RESTGetAPIGuildEmojiResult>;
					patch(args: RestArguments<RESTPatchAPIGuildEmojiJSONBody>): Promise<RESTPatchAPIGuildEmojiResult>;
					delete(args?: RestArgumentsNoBody): Promise<RESTDeleteAPIGuildEmojiResult>;
				};
			};
			'voice-states': {
				'@me': {
					patch(
						args: RestArguments<RESTPatchAPIGuildVoiceStateCurrentMemberJSONBody>,
					): Promise<RESTPatchAPIGuildVoiceStateCurrentMemberResult>;
					get(args?: RestArgumentsNoBody): Promise<RESTGetAPICurrentUserVoiceState>;
				};
				(
					userId: string,
				): {
					patch(
						args: RestArguments<RESTPatchAPIGuildVoiceStateUserJSONBody>,
					): Promise<RESTPatchAPIGuildVoiceStateUserResult>;
					get(args?: RestArgumentsNoBody): Promise<RESTGetAPIUserVoiceState>;
				};
			};
			stickers: {
				get(args?: RestArgumentsNoBody): Promise<RESTGetAPIGuildStickersResult>;
				post(
					args: RestArguments<
						Omit<RESTPostAPIGuildStickerFormDataBody, 'file'>,
						OmitInsert<RawFile, 'key', { key: 'file' }>[]
					>,
				): Promise<RESTPostAPIGuildStickerResult>;
				(
					id: string,
				): {
					get(args?: RestArgumentsNoBody): Promise<RESTGetAPIGuildStickerResult>;
					patch(args: RestArguments<RESTPatchAPIGuildStickerJSONBody>): Promise<RESTPatchAPIGuildStickerResult>;
					delete(args?: RestArgumentsNoBody): Promise<RESTDeleteAPIGuildStickerResult>;
				};
			};
			'scheduled-events': {
				get(
					args?: RestArgumentsNoBody<RESTGetAPIGuildScheduledEventsQuery>,
				): Promise<RESTGetAPIGuildScheduledEventsResult>;
				post(
					args: RestArguments<RESTPostAPIGuildScheduledEventJSONBody>,
				): Promise<RESTPostAPIGuildScheduledEventResult>;
				(
					id: string,
				): {
					get(
						args?: RestArgumentsNoBody<RESTGetAPIGuildScheduledEventQuery>,
					): Promise<RESTGetAPIGuildScheduledEventResult>;
					patch(
						args: RestArguments<RESTPatchAPIGuildScheduledEventJSONBody>,
					): Promise<RESTPatchAPIGuildScheduledEventResult>;
					delete(args?: RestArgumentsNoBody): Promise<RESTDeleteAPIGuildScheduledEventResult>;
					users: {
						get(
							args?: RestArgumentsNoBody<RESTGetAPIGuildScheduledEventUsersQuery>,
						): Promise<RESTGetAPIGuildScheduledEventUsersResult>;
					};
				};
			};
			templates: {
				get(args?: RestArgumentsNoBody): Promise<RESTGetAPIGuildTemplatesResult>;
				post(args: RestArguments<RESTPostAPIGuildTemplatesJSONBody>): Promise<RESTPostAPIGuildTemplatesResult>;
				(
					code: string,
				): {
					put(args?: RestArgumentsNoBody): Promise<RESTPutAPIGuildTemplateSyncResult>;
					patch(args: RestArguments<RESTPatchAPIGuildTemplateJSONBody>): Promise<RESTPatchAPIGuildTemplateResult>;
					delete(args?: RestArgumentsNoBody): Promise<RESTDeleteAPIGuildTemplateResult>;
				};
			};
			'soundboard-sounds': {
				get(args?: RestArgumentsNoBody): Promise<RESTGetAPIGuildSoundboardSoundsResult>;
				post(args: RestArguments<RESTPostAPIGuildSoundboardSound>): Promise<RESTPostAPIGuildSoundboardSoundResult>;
				(
					id: string,
				): {
					get(args?: RestArgumentsNoBody): Promise<RESTPostAPIGuildSoundboardSoundResult>;
					patch(
						args?: RestArguments<RESTPatchAPIGuildSoundboardSound>,
					): Promise<RESTPatchAPIGuildSoundboardSoundResult>;
					delete(args?: RestArgumentsNoBody): Promise<undefined>;
				};
			};
		};
	};
}
