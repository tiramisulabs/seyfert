import type { Snowflake } from '..';
import type {
	APIAllowedMentions,
	APIEmbed,
	APIMessage,
	APITopLevelComponent,
	APIWebhook,
	MessageFlags,
} from '../payloads';
import type { AddUndefinedToPossiblyUndefinedPropertiesOfInterface, Nullable } from '../utils';
import type { RESTAPIAttachment } from './channel';
import type { RESTAPIPollCreate } from './poll';
/**
 * https://discord.com/developers/docs/resources/webhook#create-webhook
 */
export interface RESTPostAPIChannelWebhookJSONBody {
	/**
	 * Name of the webhook (1-80 characters)
	 */
	name: string;
	/**
	 * Image for the default webhook avatar
	 *
	 * See https://discord.com/developers/docs/reference#image-data
	 */
	avatar?: string | null | undefined;
}

/**
 * https://discord.com/developers/docs/resources/webhook#create-webhook
 */
export type RESTPostAPIChannelWebhookResult = APIWebhook;

/**
 * https://discord.com/developers/docs/resources/webhook#get-channel-webhooks
 */
export type RESTGetAPIChannelWebhooksResult = APIWebhook[];

/**
 * https://discord.com/developers/docs/resources/webhook#get-guild-webhooks
 */
export type RESTGetAPIGuildWebhooksResult = APIWebhook[];

/**
 * https://discord.com/developers/docs/resources/webhook#get-webhook
 */
export type RESTGetAPIWebhookResult = APIWebhook;

/**
 * https://discord.com/developers/docs/resources/webhook#get-webhook-with-token
 */
export type RESTGetAPIWebhookWithTokenResult = Omit<APIWebhook, 'user'>;

/**
 * https://discord.com/developers/docs/resources/webhook#modify-webhook
 */
export interface RESTPatchAPIWebhookJSONBody {
	/**
	 * The default name of the webhook
	 */
	name?: string | undefined;
	/**
	 * Image for the default webhook avatar
	 *
	 * See https://discord.com/developers/docs/reference#image-data
	 */
	avatar?: string | null | undefined;
	/**
	 * The new channel id this webhook should be moved to
	 */
	channel_id?: Snowflake | undefined;
}

/**
 * https://discord.com/developers/docs/resources/webhook#modify-webhook
 */
export type RESTPatchAPIWebhookResult = APIWebhook;

/**
 * https://discord.com/developers/docs/resources/webhook#modify-webhook-with-token
 */
export type RESTPatchAPIWebhookWithTokenJSONBody = Omit<RESTPatchAPIWebhookJSONBody, 'channel_id'>;

/**
 * https://discord.com/developers/docs/resources/webhook#modify-webhook-with-token
 */
export type RESTPatchAPIWebhookWithTokenResult = RESTGetAPIWebhookWithTokenResult;

/**
 * https://discord.com/developers/docs/resources/webhook#delete-webhook
 */
export type RESTDeleteAPIWebhookResult = undefined;

/**
 * https://discord.com/developers/docs/resources/webhook#delete-webhook-with-token
 */
export type RESTDeleteAPIWebhookWithTokenResult = undefined;

/**
 * https://discord.com/developers/docs/resources/webhook#execute-webhook
 */
export interface RESTPostAPIWebhookWithTokenJSONBody {
	/**
	 * The message contents (up to 2000 characters)
	 */
	content?: string | undefined;
	/**
	 * Override the default username of the webhook
	 */
	username?: string | undefined;
	/**
	 * Override the default avatar of the webhook
	 */
	avatar_url?: string | undefined;
	/**
	 * `true` if this is a TTS message
	 */
	tts?: boolean | undefined;
	/**
	 * Embedded `rich` content
	 *
	 * See https://discord.com/developers/docs/resources/channel#embed-object
	 */
	embeds?: APIEmbed[] | undefined;
	/**
	 * Allowed mentions for the message
	 *
	 * See https://discord.com/developers/docs/resources/channel#allowed-mentions-object
	 */
	allowed_mentions?: APIAllowedMentions | undefined;
	/**
	 * The components to include with the message
	 *
	 * Requires an application-owned webhook
	 *
	 * See https://discord.com/developers/docs/interactions/message-components#component-object
	 */
	components?: APITopLevelComponent[] | undefined;
	/**
	 * Attachment objects with filename and description
	 */
	attachments?: RESTAPIAttachment[] | undefined;
	/**
	 * Message flags combined as a bitfield
	 */
	flags?: MessageFlags | undefined;
	/**
	 * Name of thread to create
	 *
	 * Available only if the webhook is in a forum channel and a thread is not specified in {@link RESTPostAPIWebhookWithTokenQuery.thread_id} query parameter
	 */
	thread_name?: string | undefined;
	/**
	 * Array of tag ids to apply to the thread
	 */
	applied_tags?: Snowflake[] | undefined;
	/**
	 * A poll!
	 */
	poll?: RESTAPIPollCreate | undefined;
}

/**
 * https://discord.com/developers/docs/resources/webhook#execute-webhook
 */
export type RESTPostAPIWebhookWithTokenFormDataBody =
	| (Record<`files[${bigint}]`, unknown> & {
			/**
			 * JSON stringified message body
			 */
			payload_json?: string | undefined;
	  })
	| (Record<`files[${bigint}]`, unknown> & RESTPostAPIWebhookWithTokenJSONBody);

/**
 * https://discord.com/developers/docs/resources/webhook#execute-webhook-query-string-params
 */
export interface RESTPostAPIWebhookWithTokenQuery {
	/**
	 * Waits for server confirmation of message send before response, and returns the created message body
	 * (defaults to `false`; when `false` a message that is not saved does not return an error)
	 *
	 * @default false
	 */
	wait?: boolean;
	/**
	 * Send a message to the specified thread within a webhook's channel. The thread will automatically be unarchived.
	 *
	 * Available only if the {@link RESTPostAPIWebhookWithTokenJSONBody.thread_name} JSON body property is not specified
	 */
	thread_id?: Snowflake;

	/**
	 * Whether to respect the components field of the request. When enabled, allows application-owned webhooks to use all components and
	 * non-owned webhooks to use non-interactive components.
	 *
	 * @default false
	 */
	with_components?: boolean;
}

/**
 * https://discord.com/developers/docs/resources/webhook#execute-webhook
 */
export type RESTPostAPIWebhookWithTokenResult = undefined;

/**
 * Received when a call to https://discord.com/developers/docs/resources/webhook#execute-webhook receives
 * the `wait` query parameter set to `true`
 *
 * See https://discord.com/developers/docs/resources/webhook#execute-webhook-query-string-params
 */
export type RESTPostAPIWebhookWithTokenWaitResult = APIMessage;

/**
 * https://discord.com/developers/docs/resources/webhook#execute-slackcompatible-webhook-query-string-params
 */
export type RESTPostAPIWebhookWithTokenSlackQuery = Omit<RESTPostAPIWebhookWithTokenQuery, 'with_components'>;

/**
 * https://discord.com/developers/docs/resources/webhook#execute-slackcompatible-webhook
 */
export type RESTPostAPIWebhookWithTokenSlackResult = undefined;

/**
 * Received when a call to https://discord.com/developers/docs/resources/webhook#execute-webhook receives
 * the `wait` query parameter set to `true`
 *
 * See https://discord.com/developers/docs/resources/webhook#execute-slackcompatible-webhook-query-string-params
 */
export type RESTPostAPIWebhookWithTokenSlackWaitResult = APIMessage;

/**
 * https://discord.com/developers/docs/resources/webhook#execute-githubcompatible-webhook-query-string-params
 */
export type RESTPostAPIWebhookWithTokenGitHubQuery = Omit<RESTPostAPIWebhookWithTokenQuery, 'with_components'>;

/**
 * https://discord.com/developers/docs/resources/webhook#execute-githubcompatible-webhook
 */
export type RESTPostAPIWebhookWithTokenGitHubResult = undefined;

/**
 * Received when a call to https://discord.com/developers/docs/resources/webhook#execute-webhook receives
 * the `wait` query parameter set to `true`
 *
 * See https://discord.com/developers/docs/resources/webhook#execute-githubcompatible-webhook-query-string-params
 */
export type RESTPostAPIWebhookWithTokenGitHubWaitResult = APIMessage;

/**
 * https://discord.com/developers/docs/resources/webhook#get-webhook-message
 */
export type RESTGetAPIWebhookWithTokenMessageResult = APIMessage;

/**
 * https://discord.com/developers/docs/resources/webhook#get-webhook-message-query-string-params
 */
export interface RESTGetAPIWebhookWithTokenMessageQuery {
	thread_id?: string;
}

/**
 * https://discord.com/developers/docs/resources/webhook#edit-webhook-message
 */
export type RESTPatchAPIWebhookWithTokenMessageJSONBody = AddUndefinedToPossiblyUndefinedPropertiesOfInterface<
	Nullable<Pick<RESTPostAPIWebhookWithTokenJSONBody, 'allowed_mentions' | 'components' | 'content' | 'embeds' | 'poll'>>
> & {
	/**
	 * Attached files to keep
	 *
	 * Starting with API v10, the `attachments` array must contain all attachments that should be present after edit, including **retained and new** attachments provided in the request body.
	 *
	 * See https://discord.com/developers/docs/resources/message#attachment-object
	 */
	attachments?: RESTAPIAttachment[] | undefined;
};

export type RESTPatchAPIWebhookWithTokenMessageQuery = Omit<RESTPostAPIWebhookWithTokenQuery, 'wait'>;
/**
 * https://discord.com/developers/docs/resources/webhook#edit-webhook-message
 */
export type RESTPatchAPIWebhookWithTokenMessageFormDataBody =
	| (Record<`files[${bigint}]`, unknown> & {
			/**
			 * JSON stringified message body
			 */
			payload_json?: string | undefined;
	  })
	| (Record<`files[${bigint}]`, unknown> & RESTPatchAPIWebhookWithTokenMessageJSONBody);

/**
 * https://discord.com/developers/docs/resources/webhook#edit-webhook-message
 */
export type RESTPatchAPIWebhookWithTokenMessageResult = APIMessage;

/**
 * https://discord.com/developers/docs/resources/webhook#delete-webhook-message
 */
export type RESTDeleteAPIWebhookWithTokenMessageResult = undefined;
