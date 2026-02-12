import type { RawFile } from '../../api';
import type { Attachment, AttachmentBuilder, Embed, Modal, PollBuilder, TopLevelBuilders } from '../../builders';
import type {
	APIEmbed,
	APIInteractionResponseCallbackData,
	APIInteractionResponseChannelMessageWithSource,
	APIModalInteractionResponse,
	MessageFlags,
	RESTAPIPollCreate,
	RESTPatchAPIChannelMessageJSONBody,
	RESTPatchAPIWebhookWithTokenMessageJSONBody,
	RESTPostAPIChannelMessageJSONBody,
	RESTPostAPIChannelThreadsJSONBody,
	RESTPostAPIGuildForumThreadsJSONBody,
	RESTPostAPIWebhookWithTokenJSONBody,
} from '../../types';

import type { OmitInsert, RequireAtLeastOne } from './util';

export interface ResolverProps {
	content?: string | undefined | null;
	embeds?: Embed[] | APIEmbed[] | undefined;
	components?: TopLevelBuilders[] | ReturnType<TopLevelBuilders['toJSON']>[];
	files?: AttachmentBuilder[] | Attachment[] | RawFile[] | undefined;
}

export interface SendResolverProps extends ResolverProps {
	poll?: PollBuilder | RESTAPIPollCreate | undefined;
}

export type MessageCreateBodyRequest = OmitInsert<
	RESTPostAPIChannelMessageJSONBody,
	'components' | 'embeds' | 'poll' | 'content',
	SendResolverProps
>;

export type MessageUpdateBodyRequest = OmitInsert<
	RESTPatchAPIChannelMessageJSONBody,
	'components' | 'embeds' | 'content',
	ResolverProps
>;

export type MessageWebhookCreateBodyRequest = OmitInsert<
	RESTPostAPIWebhookWithTokenJSONBody,
	'components' | 'embeds' | 'poll' | 'content',
	SendResolverProps
>;

export type MessageWebhookUpdateBodyRequest = OmitInsert<
	RESTPatchAPIWebhookWithTokenMessageJSONBody,
	'components' | 'embeds' | 'poll' | 'content',
	ResolverProps
>;

export type InteractionMessageUpdateBodyRequest = OmitInsert<
	RESTPatchAPIWebhookWithTokenMessageJSONBody,
	'components' | 'embeds' | 'poll' | 'content',
	SendResolverProps
> & {
	flags?: MessageFlags;
};

export type ComponentInteractionMessageUpdate = OmitInsert<
	APIInteractionResponseCallbackData,
	'components' | 'embeds' | 'content',
	ResolverProps
>;

export type InteractionCreateBodyRequest = OmitInsert<
	APIInteractionResponseChannelMessageWithSource['data'],
	'components' | 'embeds' | 'poll' | 'content',
	SendResolverProps
>;

export type ModalCreateBodyRequest = APIModalInteractionResponse['data'] | Modal;

export interface ModalCreateOptions {
	waitFor?: number;
}

// Absolute black magic, do not question it, just use it and be happy that it works.
// I have no idea why other types explode but here works
// I think it's because of the recursive nature of the types, but I'm not sure
// For now, I will use this as a pilot for a future changes.
/**
 * Force at least one of the following properties must be provided: any content of `message` or `files`.
 */
export type ThreadOnlyCreateBodyRequest = RequireAtLeastOne<
	OmitInsert<
		RESTPostAPIGuildForumThreadsJSONBody,
		'message',
		{
			message?: RequireAtLeastOne<
				Pick<MessageCreateBodyRequest, keyof RESTPostAPIGuildForumThreadsJSONBody['message']>,
				'sticker_ids' | 'content' | 'embeds' | 'components'
			>;
			files?: ResolverProps['files'];
			name: string;
		}
	>,
	'message' | 'files'
>;

export type ThreadCreateBodyRequest = ThreadOnlyCreateBodyRequest | RESTPostAPIChannelThreadsJSONBody;
