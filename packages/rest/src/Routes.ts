import type { RestArguments } from './REST';
import {
	APIDMChannel,
	APIThreadChannel,
	Identify,
	RESTDeleteAPIAutoModerationRuleResult,
	RESTDeleteAPIChannelAllMessageReactionsResult,
	RESTDeleteAPIChannelMessageReactionResult,
	RESTDeleteAPIChannelMessageResult,
	RESTDeleteAPIChannelPermissionResult,
	RESTDeleteAPIChannelPinResult,
	RESTDeleteAPIChannelRecipientResult,
	RESTDeleteAPIChannelResult,
	RESTDeleteAPIChannelThreadMembersResult,
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
	RESTDeleteAPIInviteResult,
	RESTDeleteAPIStageInstanceResult,
	RESTGetAPIAuditLogQuery,
	RESTGetAPIAuditLogResult,
	RESTGetAPIAutoModerationRuleResult,
	RESTGetAPIAutoModerationRulesResult,
	RESTGetAPIChannelInvitesResult,
	RESTGetAPIChannelMessageReactionUsersQuery,
	RESTGetAPIChannelMessageReactionUsersResult,
	RESTGetAPIChannelMessageResult,
	RESTGetAPIChannelMessagesQuery,
	RESTGetAPIChannelMessagesResult,
	RESTGetAPIChannelPinsResult,
	RESTGetAPIChannelResult,
	RESTGetAPIChannelThreadMemberQuery,
	RESTGetAPIChannelThreadMemberResult,
	RESTGetAPIChannelThreadMembersQuery,
	RESTGetAPIChannelThreadMembersResult,
	RESTGetAPIChannelThreadsArchivedPrivateResult,
	RESTGetAPIChannelThreadsArchivedPublicResult,
	RESTGetAPIChannelThreadsArchivedQuery,
	RESTGetAPIChannelUsersThreadsArchivedResult,
	RESTGetAPIChannelWebhooksResult,
	RESTGetAPICurrentUserApplicationRoleConnectionResult,
	RESTGetAPICurrentUserConnectionsResult,
	RESTGetAPICurrentUserGuildsQuery,
	RESTGetAPICurrentUserGuildsResult,
	RESTGetAPICurrentUserResult,
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
	RESTGetAPIGuildScheduledEventsQuery,
	RESTGetAPIGuildScheduledEventsResult,
	RESTGetAPIGuildScheduledEventUsersQuery,
	RESTGetAPIGuildScheduledEventUsersResult,
	RESTGetAPIGuildStickerResult,
	RESTGetAPIGuildStickersResult,
	RESTGetAPIGuildTemplatesResult,
	RESTGetAPIGuildThreadsResult,
	RESTGetAPIGuildVanityUrlResult,
	RESTGetAPIGuildVoiceRegionsResult,
	RESTGetAPIGuildWelcomeScreenResult,
	RESTGetAPIGuildWidgetImageQuery,
	RESTGetAPIGuildWidgetImageResult,
	RESTGetAPIGuildWidgetJSONResult,
	RESTGetAPIGuildWidgetSettingsResult,
	RESTGetAPIInviteQuery,
	RESTGetAPIInviteResult,
	RESTGetAPIStageInstanceResult,
	RESTGetAPIStickerResult,
	RESTGetAPITemplateResult,
	RESTGetAPIUserResult,
	RESTGetAPIVoiceRegionsResult,
	RESTGetCurrentUserGuildMemberResult,
	RESTGetNitroStickerPacksResult,
	RESTPatchAPIAutoModerationRuleJSONBody,
	RESTPatchAPIAutoModerationRuleResult,
	RESTPatchAPIChannelJSONBody,
	RESTPatchAPIChannelMessageJSONBody,
	RESTPatchAPIChannelMessageResult,
	RESTPatchAPIChannelResult,
	RESTPatchAPICurrentGuildMemberJSONBody,
	RESTPatchAPICurrentUserJSONBody,
	RESTPatchAPICurrentUserResult,
	RESTPatchAPIGuildChannelPositionsJSONBody,
	RESTPatchAPIGuildChannelPositionsResult,
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
	RESTPatchAPIStageInstanceJSONBody,
	RESTPatchAPIStageInstanceResult,
	RESTPostAPIAutoModerationRuleJSONBody,
	RESTPostAPIAutoModerationRuleResult,
	RESTPostAPIChannelFollowersJSONBody,
	RESTPostAPIChannelFollowersResult,
	RESTPostAPIChannelInviteJSONBody,
	RESTPostAPIChannelInviteResult,
	RESTPostAPIChannelMessageCrosspostResult,
	RESTPostAPIChannelMessageJSONBody,
	RESTPostAPIChannelMessageResult,
	RESTPostAPIChannelMessagesBulkDeleteJSONBody,
	RESTPostAPIChannelMessagesBulkDeleteResult,
	RESTPostAPIChannelMessagesThreadsJSONBody,
	RESTPostAPIChannelMessagesThreadsResult,
	RESTPostAPIChannelThreadsJSONBody,
	RESTPostAPIChannelThreadsResult,
	RESTPostAPIChannelTypingResult,
	RESTPostAPICurrentUserCreateDMChannelJSONBody,
	RESTPostAPIGuildChannelJSONBody,
	RESTPostAPIGuildChannelResult,
	RESTPostAPIGuildEmojiJSONBody,
	RESTPostAPIGuildEmojiResult,
	RESTPostAPIGuildForumThreadsJSONBody,
	RESTPostAPIGuildPruneJSONBody,
	RESTPostAPIGuildPruneResult,
	RESTPostAPIGuildRoleJSONBody,
	RESTPostAPIGuildRoleResult,
	RESTPostAPIGuildScheduledEventJSONBody,
	RESTPostAPIGuildScheduledEventResult,
	RESTPostAPIGuildsJSONBody,
	RESTPostAPIGuildsMFAJSONBody,
	RESTPostAPIGuildsMFAResult,
	RESTPostAPIGuildsResult,
	RESTPostAPIGuildStickerFormDataBody,
	RESTPostAPIGuildStickerResult,
	RESTPostAPIGuildTemplatesJSONBody,
	RESTPostAPIGuildTemplatesResult,
	RESTPostAPIStageInstanceJSONBody,
	RESTPostAPIStageInstanceResult,
	RESTPostAPITemplateCreateGuildJSONBody,
	RESTPostAPITemplateCreateGuildResult,
	RESTPutAPIChannelMessageReactionResult,
	RESTPutAPIChannelPermissionJSONBody,
	RESTPutAPIChannelPermissionResult,
	RESTPutAPIChannelPinResult,
	RESTPutAPIChannelRecipientJSONBody,
	RESTPutAPIChannelRecipientResult,
	RESTPutAPIChannelThreadMembersResult,
	RESTPutAPICurrentUserApplicationRoleConnectionJSONBody,
	RESTPutAPICurrentUserApplicationRoleConnectionResult,
	RESTPutAPIGuildBanJSONBody,
	RESTPutAPIGuildBanResult,
	RESTPutAPIGuildMemberJSONBody,
	RESTPutAPIGuildMemberResult,
	RESTPutAPIGuildMemberRoleResult,
	RESTPutAPIGuildTemplateSyncResult
} from '@biscuitland/common';
import { RequestMethod } from './Router';

export interface Routes {
	guilds: {
		post(args: RestArguments<RequestMethod.Post, RESTPostAPIGuildsJSONBody>): Promise<RESTPostAPIGuildsResult>;
		templates(code: string): {
			get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPITemplateResult>;
			post(
				args: RestArguments<RequestMethod.Post, RESTPostAPITemplateCreateGuildJSONBody>
			): Promise<RESTPostAPITemplateCreateGuildResult>;
		};
		(id: string): {
			get(args?: RestArguments<RequestMethod.Get, never, RESTGetAPIGuildQuery>): Promise<RESTGetAPIGuildResult>;
			patch(args: RestArguments<RequestMethod.Patch, RESTPatchAPIGuildJSONBody>): Promise<RESTPatchAPIGuildResult>;
			delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIGuildResult>;
			preview: {
				get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildPreviewResult>;
			};
			'audit-logs': {
				get(args?: RestArguments<RequestMethod.Get, never, RESTGetAPIAuditLogQuery>): Promise<RESTGetAPIAuditLogResult>;
			};
			'auto-moderation': {
				rules: {
					get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIAutoModerationRulesResult>;
					post(
						args: RestArguments<RequestMethod.Post, RESTPostAPIAutoModerationRuleJSONBody>
					): Promise<RESTPostAPIAutoModerationRuleResult>;
					patch(
						args: RestArguments<RequestMethod.Post, RESTPatchAPIAutoModerationRuleJSONBody>
					): Promise<RESTPatchAPIAutoModerationRuleResult>;
					(id: string): {
						get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIAutoModerationRuleResult>;
						//este type literal es un never xdxdxdxdxd
						delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIAutoModerationRuleResult>;
					};
				};
			};
			channels: {
				get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildChannelsResult>;
				post(
					args: RestArguments<RequestMethod.Post, RESTPostAPIGuildChannelJSONBody>
				): Promise<RESTPostAPIGuildChannelResult>;
				patch(
					args: RestArguments<RequestMethod.Patch, RESTPatchAPIGuildChannelPositionsJSONBody>
				): Promise<RESTPatchAPIGuildChannelPositionsResult>;
			};
			members: {
				get(
					args: RestArguments<RequestMethod.Get, never, RESTGetAPIGuildMembersQuery>
				): Promise<RESTGetAPIGuildMembersResult>;
				search: {
					get(
						args: RestArguments<RequestMethod.Get, never, RESTGetAPIGuildMembersSearchQuery>
					): Promise<RESTGetAPIGuildMembersSearchResult>;
				};
				'@me': {
					patch(
						args: RestArguments<RequestMethod.Patch, RESTPatchAPICurrentGuildMemberJSONBody>
					): Promise<RESTGetAPIGuildMemberResult>;
				};
				(id: string): {
					get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildMemberResult>;
					put(
						args: RestArguments<RequestMethod.Put, RESTPutAPIGuildMemberJSONBody>
					): Promise<RESTPutAPIGuildMemberResult>;
					patch(
						args: RestArguments<RequestMethod.Patch, RESTPatchAPIGuildMemberJSONBody>
					): Promise<RESTPatchAPIGuildMemberResult>;
					delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIGuildMemberResult>;
					roles(id: string): {
						put(args: RestArguments<RequestMethod.Put>): Promise<RESTPutAPIGuildMemberRoleResult>;
						delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIGuildMemberRoleResult>;
					};
				};
			};
			threads: {
				active: {
					get(
						args?: RestArguments<RequestMethod.Get>
					): Promise<Identify<RESTGetAPIGuildThreadsResult & { threads: Partial<APIThreadChannel> }>>;
				};
			};
			roles: {
				get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildRolesResult>;
				post(
					args: RestArguments<RequestMethod.Post, RESTPostAPIGuildRoleJSONBody>
				): Promise<RESTPostAPIGuildRoleResult>;
				patch(
					args: RestArguments<RequestMethod.Patch, RESTPatchAPIGuildRolePositionsJSONBody>
				): Promise<RESTPatchAPIGuildRolePositionsResult>;
				(id: string): {
					patch(
						args: RestArguments<RequestMethod.Patch, RESTPatchAPIGuildRoleJSONBody>
					): Promise<RESTPatchAPIGuildRoleResult>;
					delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIGuildRoleResult>;
				};
			};
			bans: {
				get(
					args: RestArguments<RequestMethod.Get, never, RESTGetAPIGuildBansQuery>
				): Promise<RESTGetAPIGuildBansResult>;
				(userId: string): {
					get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildBanResult>;
					put(args: RestArguments<RequestMethod.Put, RESTPutAPIGuildBanJSONBody>): Promise<RESTPutAPIGuildBanResult>;
					delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIGuildBanResult>;
				};
			};
			mfa: {
				post(
					args: RestArguments<RequestMethod.Post, RESTPostAPIGuildsMFAJSONBody>
				): Promise<RESTPostAPIGuildsMFAResult>;
			};
			prune: {
				get(
					args: RestArguments<RequestMethod.Get, never, RESTGetAPIGuildPruneCountQuery>
				): Promise<RESTGetAPIGuildPruneCountResult>;
				post(
					args: RestArguments<RequestMethod.Post, RESTPostAPIGuildPruneJSONBody>
				): Promise<RESTPostAPIGuildPruneResult>;
			};
			regions: {
				get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildVoiceRegionsResult>;
			};
			invites: {
				get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildInvitesResult>;
			};
			widget: {
				get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildWidgetSettingsResult>;
				patch(
					args: RestArguments<RequestMethod.Patch, RESTPatchAPIGuildWidgetSettingsJSONBody>
				): Promise<RESTPatchAPIGuildWidgetSettingsResult>;
			};
			'widget.json': {
				get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildWidgetJSONResult>;
			};
			'widget.png': {
				get(
					args: RestArguments<RequestMethod.Get, never, RESTGetAPIGuildWidgetImageQuery>
				): Promise<RESTGetAPIGuildWidgetImageResult>;
			};
			integrations: {
				get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildIntegrationsResult>;
				(id: string): {
					delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIGuildIntegrationResult>;
				};
			};
			'vanity-url': {
				get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildVanityUrlResult>;
			};
			'welcome-screen': {
				get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildWelcomeScreenResult>;
				patch(
					args: RestArguments<RequestMethod.Patch, RESTPatchAPIGuildWelcomeScreenJSONBody>
				): Promise<RESTPatchAPIGuildWelcomeScreenResult>;
			};
			// onboarding: {
			// 	get(args:RestArguments<RequestMethod.Get,boarding>)
			// }
			emojis: {
				get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildEmojisResult>;
				post(
					args: RestArguments<RequestMethod.Post, RESTPostAPIGuildEmojiJSONBody>
				): Promise<RESTPostAPIGuildEmojiResult>;
				(id: string): {
					get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildEmojiResult>;
					patch(args: RestArguments<RequestMethod.Patch>): Promise<RESTPatchAPIGuildEmojiResult>;
					delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIGuildEmojiResult>;
				};
			};
			'voice-states': {
				'@me': {
					patch(
						args: RestArguments<RequestMethod.Patch, RESTPatchAPIGuildVoiceStateCurrentMemberJSONBody>
					): Promise<RESTPatchAPIGuildVoiceStateCurrentMemberResult>;
				};
				(id: string): {
					patch(
						args: RestArguments<RequestMethod.Patch, RESTPatchAPIGuildVoiceStateUserJSONBody>
					): Promise<RESTPatchAPIGuildVoiceStateUserResult>;
				};
			};
			stickers: {
				get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildStickersResult>;
				post(
					args: RestArguments<RequestMethod.Post, RESTPostAPIGuildStickerFormDataBody>
				): Promise<RESTPostAPIGuildStickerResult>;
				(id: string): {
					get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildStickerResult>;
					patch(
						args: RestArguments<RequestMethod.Patch, RESTPatchAPIGuildStickerJSONBody>
					): Promise<RESTPatchAPIGuildStickerResult>;
					delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIGuildStickerResult>;
				};
			};
			'scheduled-events': {
				get(
					args: RestArguments<RequestMethod.Get, never, RESTGetAPIGuildScheduledEventsQuery>
				): Promise<RESTGetAPIGuildScheduledEventsResult>;
				post(
					args: RestArguments<RequestMethod.Post, RESTPostAPIGuildScheduledEventJSONBody>
				): Promise<RESTPostAPIGuildScheduledEventResult>;
				(id: string): {
					get(
						args: RestArguments<RequestMethod.Get, never, RESTGetAPIGuildScheduledEventQuery>
					): Promise<RESTGetAPIGuildScheduledEventResult>;
					patch(
						args: RestArguments<RequestMethod.Patch, RESTPatchAPIGuildScheduledEventJSONBody>
					): Promise<RESTPatchAPIGuildScheduledEventResult>;
					delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIGuildScheduledEventResult>;
					users: {
						get(
							args: RestArguments<RequestMethod.Get, never, RESTGetAPIGuildScheduledEventUsersQuery>
						): Promise<RESTGetAPIGuildScheduledEventUsersResult>;
					};
				};
			};
			templates: {
				get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildTemplatesResult>;
				post(
					args: RestArguments<RequestMethod.Post, RESTPostAPIGuildTemplatesJSONBody>
				): Promise<RESTPostAPIGuildTemplatesResult>;
				(code: string): {
					put(args: RestArguments<RequestMethod.Put>): Promise<RESTPutAPIGuildTemplateSyncResult>;
					patch(
						args: RestArguments<RequestMethod.Patch, RESTPatchAPIGuildTemplateJSONBody>
					): Promise<RESTPatchAPIGuildTemplateResult>;
					delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIGuildTemplateResult>;
				};
			};
		};
	};
}

export interface Routes {
	channels(id: string): {
		get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIChannelResult>;
		patch(args: RestArguments<RequestMethod.Patch, RESTPatchAPIChannelJSONBody>): Promise<RESTPatchAPIChannelResult>;
		delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIChannelResult>;
		users: {
			'@me': {
				threads: {
					archived: {
						private: {
							get(
								args?: RestArguments<RequestMethod.Get, never, RESTGetAPIChannelThreadsArchivedQuery>
							): Promise<RESTGetAPIChannelUsersThreadsArchivedResult>;
						};
					};
				};
			};
		};
		'thread-members': {
			get(
				args?: RestArguments<RequestMethod.Get, never, RESTGetAPIChannelThreadMembersQuery>
			): Promise<RESTGetAPIChannelThreadMembersResult>;
			'@me': {
				put(args: RestArguments<RequestMethod.Put>): Promise<RESTPutAPIChannelThreadMembersResult>;
				delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIChannelThreadMembersResult>;
			};
			(id: string): {
				get(
					args?: RestArguments<RequestMethod.Get, never, RESTGetAPIChannelThreadMemberQuery>
				): Promise<RESTGetAPIChannelThreadMemberResult>;
				put(args: RestArguments<RequestMethod.Put>): Promise<RESTPutAPIChannelThreadMembersResult>;
				delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIChannelThreadMembersResult>;
			};
		};
		threads: {
			post(
				args: RestArguments<
					RequestMethod.Post,
					RESTPostAPIChannelThreadsJSONBody | RESTPostAPIGuildForumThreadsJSONBody
				>
			): Promise<RESTPostAPIChannelThreadsResult>;
			archived: {
				public: {
					get(
						args?: RestArguments<RequestMethod.Get, never, RESTGetAPIChannelThreadsArchivedQuery>
					): Promise<RESTGetAPIChannelThreadsArchivedPublicResult>;
				};
				private: {
					get(
						args?: RestArguments<RequestMethod.Get, never, RESTGetAPIChannelThreadsArchivedQuery>
					): Promise<RESTGetAPIChannelThreadsArchivedPrivateResult>;
				};
			};
		};
		recipients: {
			(id: string): {
				put(
					args: RestArguments<RequestMethod.Put, RESTPutAPIChannelRecipientJSONBody>
				): Promise<RESTPutAPIChannelRecipientResult>;
				delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIChannelRecipientResult>;
			};
		};
		pins: {
			get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIChannelPinsResult>;
			(id: string): {
				put(args: RestArguments<RequestMethod.Put>): Promise<RESTPutAPIChannelPinResult>;
				delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIChannelPinResult>;
			};
		};
		followers: {
			post(
				args: RestArguments<RequestMethod.Post, RESTPostAPIChannelFollowersJSONBody>
			): Promise<RESTPostAPIChannelFollowersResult>;
		};
		permissions: {
			(id: string): {
				put(
					args: RestArguments<RequestMethod.Put, RESTPutAPIChannelPermissionJSONBody>
				): Promise<RESTPutAPIChannelPermissionResult>;
				delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIChannelPermissionResult>;
			};
		};
		invites: {
			get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIChannelInvitesResult>;
			post(
				args: RestArguments<RequestMethod.Post, RESTPostAPIChannelInviteJSONBody>
			): Promise<RESTPostAPIChannelInviteResult>;
		};
		messages: {
			get(
				args?: RestArguments<RequestMethod.Get, never, RESTGetAPIChannelMessagesQuery>
			): Promise<RESTGetAPIChannelMessagesResult>;
			post(
				args: RestArguments<RequestMethod.Post, RESTPostAPIChannelMessageJSONBody>
			): Promise<RESTPostAPIChannelMessageResult>;
			'bulk-delete': {
				post(
					args: RestArguments<RequestMethod.Post, RESTPostAPIChannelMessagesBulkDeleteJSONBody>
				): Promise<RESTPostAPIChannelMessagesBulkDeleteResult>;
			};
			(id: string): {
				get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIChannelMessageResult>;
				patch(
					args: RestArguments<RequestMethod.Patch, RESTPatchAPIChannelMessageJSONBody>
				): Promise<RESTPatchAPIChannelMessageResult>;
				delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIChannelMessageResult>;
				threads: {
					post(
						args: RestArguments<RequestMethod.Post, RESTPostAPIChannelMessagesThreadsJSONBody>
					): Promise<RESTPostAPIChannelMessagesThreadsResult>;
				};
				crosspost: {
					post(args: RestArguments<RequestMethod.Post>): Promise<RESTPostAPIChannelMessageCrosspostResult>;
				};
				reactions: {
					delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIChannelAllMessageReactionsResult>;
					(emoji: string): {
						get(
							args?: RestArguments<RequestMethod.Get, never, RESTGetAPIChannelMessageReactionUsersQuery>
						): Promise<RESTGetAPIChannelMessageReactionUsersResult>;
						delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIChannelMessageReactionResult>;
						'@me': {
							put(args: RestArguments<RequestMethod.Put>): Promise<RESTPutAPIChannelMessageReactionResult>;
							delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIChannelMessageReactionResult>;
						};
						(id: string): {
							delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIChannelMessageReactionResult>;
						};
					};
				};
			};
		};
		typing: {
			post(args?: RestArguments<RequestMethod.Post>): Promise<RESTPostAPIChannelTypingResult>;
		};
		webhooks: {
			get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIChannelWebhooksResult>;
		};
	};
}

export interface Routes {
	invites(id: string): {
		get(args?: RestArguments<RequestMethod.Get, never, RESTGetAPIInviteQuery>): Promise<RESTGetAPIInviteResult>;
		delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIInviteResult>;
	};
}

export interface Routes {
	'stage-instances': {
		post(
			args: RestArguments<RequestMethod.Post, RESTPostAPIStageInstanceJSONBody>
		): Promise<RESTPostAPIStageInstanceResult>;
		(id: string): {
			get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIStageInstanceResult>;
			patch(
				args: RestArguments<RequestMethod.Patch, RESTPatchAPIStageInstanceJSONBody>
			): Promise<RESTPatchAPIStageInstanceResult>;
			delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIStageInstanceResult>;
		};
	};
}

export interface Routes {
	stickers(id: string): {
		get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIStickerResult>;
	};
	'sticker-packs': {
		get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetNitroStickerPacksResult>;
	};
}

export interface Routes {
	users: {
		(id: string): {
			get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIUserResult>;
		};
		'@me': {
			get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPICurrentUserResult>;
			patch(
				args: RestArguments<RequestMethod.Patch, RESTPatchAPICurrentUserJSONBody>
			): Promise<RESTPatchAPICurrentUserResult>;
			guilds: {
				get(
					args?: RestArguments<RequestMethod.Get, never, RESTGetAPICurrentUserGuildsQuery>
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

export interface Routes {
	voice: {
		region: {
			get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIVoiceRegionsResult>;
		};
	};
}
