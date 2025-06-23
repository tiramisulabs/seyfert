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
	RESTPostAPIWebhookWithTokenJSONBody,
} from '../../types';

import type { OmitInsert } from './util';

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
