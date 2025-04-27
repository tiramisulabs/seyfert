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
	embeds?: Embed[] | APIEmbed[] | undefined;
	components?: TopLevelBuilders[] | TopLevelBuilders['toJSON'][];
	files?: AttachmentBuilder[] | Attachment[] | RawFile[] | undefined;
}

export interface SendResolverProps extends ResolverProps {
	poll?: PollBuilder | RESTAPIPollCreate | undefined;
}

export type MessageCreateBodyRequest = OmitInsert<
	RESTPostAPIChannelMessageJSONBody,
	'components' | 'embeds' | 'poll',
	SendResolverProps
>;

export type MessageUpdateBodyRequest = OmitInsert<
	RESTPatchAPIChannelMessageJSONBody,
	'components' | 'embeds',
	ResolverProps
>;

export type MessageWebhookCreateBodyRequest = OmitInsert<
	RESTPostAPIWebhookWithTokenJSONBody,
	'components' | 'embeds' | 'poll',
	SendResolverProps
>;

export type MessageWebhookUpdateBodyRequest = OmitInsert<
	RESTPatchAPIWebhookWithTokenMessageJSONBody,
	'components' | 'embeds' | 'poll',
	ResolverProps
>;

export type InteractionMessageUpdateBodyRequest = OmitInsert<
	RESTPatchAPIWebhookWithTokenMessageJSONBody,
	'components' | 'embeds' | 'poll',
	SendResolverProps
> & {
	flags?: MessageFlags;
};

export type ComponentInteractionMessageUpdate = OmitInsert<
	APIInteractionResponseCallbackData,
	'components' | 'embeds',
	ResolverProps
>;

export type InteractionCreateBodyRequest = OmitInsert<
	APIInteractionResponseChannelMessageWithSource['data'],
	'components' | 'embeds' | 'poll',
	SendResolverProps
>;

export type ModalCreateBodyRequest = APIModalInteractionResponse['data'] | Modal;
