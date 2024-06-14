import type {
	APIActionRowComponent,
	APIEmbed,
	APIInteractionResponseCallbackData,
	APIInteractionResponseChannelMessageWithSource,
	APIMessageActionRowComponent,
	APIModalInteractionResponse,
	RESTAPIPollCreate,
	RESTPatchAPIChannelMessageJSONBody,
	RESTPatchAPIWebhookWithTokenMessageJSONBody,
	RESTPostAPIChannelMessageJSONBody,
	RESTPostAPIWebhookWithTokenJSONBody,
} from 'discord-api-types/v10';
import type { RawFile } from '../../api';
import type {
	ActionRow,
	Attachment,
	AttachmentBuilder,
	BuilderComponents,
	Embed,
	Modal,
	PollBuilder,
} from '../../builders';

import type { OmitInsert } from './util';

export interface ResolverProps {
	embeds?: Embed[] | APIEmbed[] | undefined;
	components?: APIActionRowComponent<APIMessageActionRowComponent>[] | ActionRow<BuilderComponents>[] | undefined;
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
	'components' | 'embeds',
	ResolverProps
>;

export type InteractionMessageUpdateBodyRequest = OmitInsert<
	RESTPatchAPIWebhookWithTokenMessageJSONBody,
	'components' | 'embeds',
	ResolverProps
>;

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
