import type {
	RESTDeleteAPIChannelAllMessageReactionsResult,
	RESTDeleteAPIChannelMessageReactionResult,
	RESTDeleteAPIChannelMessageResult,
	RESTDeleteAPIChannelPermissionResult,
	RESTDeleteAPIChannelPinResult,
	RESTDeleteAPIChannelRecipientResult,
	RESTDeleteAPIChannelResult,
	RESTDeleteAPIChannelThreadMembersResult,
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
	RESTGetAPIGuildWebhooksResult,
	RESTGetAPIPollAnswerVotersQuery,
	RESTGetAPIPollAnswerVotersResult,
	RESTPatchAPIChannelJSONBody,
	RESTPatchAPIChannelMessageJSONBody,
	RESTPatchAPIChannelMessageResult,
	RESTPatchAPIChannelResult,
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
	RESTPostAPIChannelWebhookJSONBody,
	RESTPostAPIChannelWebhookResult,
	RESTPostAPIGuildForumThreadsJSONBody,
	RESTPostAPIPollExpireResult,
	RESTPutAPIChannelMessageReactionResult,
	RESTPutAPIChannelPermissionJSONBody,
	RESTPutAPIChannelPermissionResult,
	RESTPutAPIChannelPinResult,
	RESTPutAPIChannelRecipientJSONBody,
	RESTPutAPIChannelRecipientResult,
	RESTPutAPIChannelThreadMembersResult,
} from '../../types';
import type { RestArguments, RestArgumentsNoBody } from '../api';

export interface ChannelRoutes {
	channels(id: string): {
		get(args?: RestArgumentsNoBody): Promise<RESTGetAPIChannelResult>;
		patch(args: RestArguments<RESTPatchAPIChannelJSONBody>): Promise<RESTPatchAPIChannelResult>;
		delete(args?: RestArgumentsNoBody): Promise<RESTDeleteAPIChannelResult>;
		users: (id: '@me') => {
			threads: {
				archived: {
					private: {
						get(
							args?: RestArgumentsNoBody<RESTGetAPIChannelThreadsArchivedQuery>,
						): Promise<RESTGetAPIChannelUsersThreadsArchivedResult>;
					};
				};
			};
		};
		'thread-members': {
			get(
				args?: RestArgumentsNoBody<RESTGetAPIChannelThreadMembersQuery>,
			): Promise<RESTGetAPIChannelThreadMembersResult>;
			(
				id: '@me',
			): {
				put(args?: RestArgumentsNoBody): Promise<RESTPutAPIChannelThreadMembersResult>;
				delete(args?: RestArgumentsNoBody): Promise<RESTDeleteAPIChannelThreadMembersResult>;
			};
			(
				id: string,
			): {
				get(
					args?: RestArgumentsNoBody<RESTGetAPIChannelThreadMemberQuery>,
				): Promise<RESTGetAPIChannelThreadMemberResult>;
				put(args?: RestArgumentsNoBody): Promise<RESTPutAPIChannelThreadMembersResult>;
				delete(args?: RestArgumentsNoBody): Promise<RESTDeleteAPIChannelThreadMembersResult>;
			};
		};
		threads: {
			post(
				args: RestArguments<RESTPostAPIChannelThreadsJSONBody | RESTPostAPIGuildForumThreadsJSONBody>,
			): Promise<RESTPostAPIChannelThreadsResult>;
			archived: {
				public: {
					get(
						args?: RestArgumentsNoBody<RESTGetAPIChannelThreadsArchivedQuery>,
					): Promise<RESTGetAPIChannelThreadsArchivedPublicResult>;
				};
				private: {
					get(
						args?: RestArgumentsNoBody<RESTGetAPIChannelThreadsArchivedQuery>,
					): Promise<RESTGetAPIChannelThreadsArchivedPrivateResult>;
				};
			};
		};
		recipients: (id: string) => {
			put(args?: RestArguments<RESTPutAPIChannelRecipientJSONBody>): Promise<RESTPutAPIChannelRecipientResult>;
			delete(args?: RestArgumentsNoBody): Promise<RESTDeleteAPIChannelRecipientResult>;
		};
		pins: {
			get(args?: RestArgumentsNoBody): Promise<RESTGetAPIChannelPinsResult>;
			(
				id: string,
			): {
				put(args?: RestArgumentsNoBody): Promise<RESTPutAPIChannelPinResult>;
				delete(args?: RestArgumentsNoBody): Promise<RESTDeleteAPIChannelPinResult>;
			};
		};
		followers: {
			post(args: RestArguments<RESTPostAPIChannelFollowersJSONBody>): Promise<RESTPostAPIChannelFollowersResult>;
		};
		permissions: (id: string) => {
			put(args?: RestArguments<RESTPutAPIChannelPermissionJSONBody>): Promise<RESTPutAPIChannelPermissionResult>;
			delete(args?: RestArgumentsNoBody): Promise<RESTDeleteAPIChannelPermissionResult>;
		};
		invites: {
			get(args?: RestArgumentsNoBody): Promise<RESTGetAPIChannelInvitesResult>;
			post(args: RestArguments<RESTPostAPIChannelInviteJSONBody>): Promise<RESTPostAPIChannelInviteResult>;
		};
		messages: {
			get(args?: RestArgumentsNoBody<RESTGetAPIChannelMessagesQuery>): Promise<RESTGetAPIChannelMessagesResult>;
			post(args: RestArguments<RESTPostAPIChannelMessageJSONBody>): Promise<RESTPostAPIChannelMessageResult>;
			'bulk-delete': {
				post(
					args: RestArguments<RESTPostAPIChannelMessagesBulkDeleteJSONBody>,
				): Promise<RESTPostAPIChannelMessagesBulkDeleteResult>;
			};
			(
				id: string,
			): {
				get(args?: RestArgumentsNoBody): Promise<RESTGetAPIChannelMessageResult>;
				patch(args: RestArguments<RESTPatchAPIChannelMessageJSONBody>): Promise<RESTPatchAPIChannelMessageResult>;
				delete(args?: RestArgumentsNoBody): Promise<RESTDeleteAPIChannelMessageResult>;
				threads: {
					post(
						args: RestArguments<RESTPostAPIChannelMessagesThreadsJSONBody>,
					): Promise<RESTPostAPIChannelMessagesThreadsResult>;
				};
				crosspost: {
					post(args: RestArgumentsNoBody): Promise<RESTPostAPIChannelMessageCrosspostResult>;
				};
				reactions: {
					delete(args?: RestArgumentsNoBody): Promise<RESTDeleteAPIChannelAllMessageReactionsResult>;
					(
						emoji: string,
					): {
						get(
							args?: RestArgumentsNoBody<RESTGetAPIChannelMessageReactionUsersQuery>,
						): Promise<RESTGetAPIChannelMessageReactionUsersResult>;
						delete(args?: RestArgumentsNoBody): Promise<RESTDeleteAPIChannelMessageReactionResult>;
						(
							id: '@me',
						): {
							put(args?: RestArgumentsNoBody): Promise<RESTPutAPIChannelMessageReactionResult>;
							delete(args?: RestArgumentsNoBody): Promise<RESTDeleteAPIChannelMessageReactionResult>;
						};
						(
							id: string,
						): {
							delete(args?: RestArgumentsNoBody): Promise<RESTDeleteAPIChannelMessageReactionResult>;
						};
					};
				};
			};
		};
		typing: {
			post(args?: RestArgumentsNoBody): Promise<RESTPostAPIChannelTypingResult>;
		};
		webhooks: {
			get(args?: RestArgumentsNoBody): Promise<RESTGetAPIGuildWebhooksResult>;
			post(args: RestArguments<RESTPostAPIChannelWebhookJSONBody>): Promise<RESTPostAPIChannelWebhookResult>;
		};
		'voice-status': {
			put(args: RestArguments<{ status: string | null }>): Promise<never>;
		};
		polls(messageId: string): {
			answers(id: ValidAnswerId): {
				get(args?: RestArgumentsNoBody<RESTGetAPIPollAnswerVotersQuery>): Promise<RESTGetAPIPollAnswerVotersResult>;
			};
			expire: {
				post(args?: RestArgumentsNoBody): Promise<RESTPostAPIPollExpireResult>;
			};
		};
	};
}

export type ValidAnswerId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
