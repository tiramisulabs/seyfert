import {
	type APIInteractionResponseCallbackData,
	type APIUnfurledMediaItem,
	type Client,
	ComponentType,
	File,
	MediaGallery,
	MediaGalleryItem,
	type RESTAPITopLevelComponent,
	type RESTAPIUnfurledMediaItem,
	type RESTPatchAPIChannelMessageJSONBody,
	type RESTPatchAPIWebhookWithTokenMessageJSONBody,
	type RESTPostAPIChannelMessageJSONBody,
	type RESTPostAPIWebhookWithTokenJSONBody,
	Section,
	Thumbnail,
	type UnfurledMediaItemContentScanFlags,
	type UnfurledMediaItemFlags,
} from 'seyfert';

// Consumers can clear optional fields on the mutable JSON returned by builders.
const galleryItem = new MediaGalleryItem().setMedia('https://example.com/image.png').toJSON();
galleryItem.description = undefined;
galleryItem.spoiler = undefined;
galleryItem.media = undefined;

// @ts-expect-error descriptions still require strings when present
galleryItem.description = 1;
// @ts-expect-error spoiler flags still require booleans when present
galleryItem.spoiler = 'yes';
// @ts-expect-error media still requires a URL when present
galleryItem.media = {};

declare function expectType<T>(value: T): void;
declare const receivedMedia: APIUnfurledMediaItem;

// Received media remains reusable, while outbound annotations expose only app-configurable fields.
expectType<RESTAPIUnfurledMediaItem>(receivedMedia);
expectType<UnfurledMediaItemFlags | undefined>(receivedMedia.flags);
expectType<UnfurledMediaItemContentScanFlags | undefined>(receivedMedia.content_scan_metadata?.flags);
expectType<RESTAPIUnfurledMediaItem>({ url: 'https://example.com/image.png' });
// @ts-expect-error Discord supplies flags; they are not part of an outbound media literal
expectType<RESTAPIUnfurledMediaItem>({ url: 'https://example.com/image.png', flags: 1 });

new Thumbnail({ media: receivedMedia });
new File({ file: receivedMedia });
new MediaGalleryItem({ media: receivedMedia });
// @ts-expect-error thumbnail builder inputs expose only the media URL
new Thumbnail({ media: { url: 'https://example.com/image.png', proxy_url: 'https://example.com/proxy.png' } });
// @ts-expect-error file builder inputs exclude received attachment IDs
new File({ file: { url: 'attachment://image.png', attachment_id: '123' } });
// @ts-expect-error gallery item inputs exclude content scan results
new MediaGalleryItem({ media: { url: 'https://example.com/image.png', content_scan_metadata: { flags: 1 } } });
// @ts-expect-error gallery constructors use the same outbound media shape as individual items
new MediaGallery({ items: [{ media: { url: 'https://example.com/image.png', height: 100 } }] });
// @ts-expect-error section accessories must also use outbound thumbnail media
new Section({ accessory: { type: ComponentType.Thumbnail, media: { url: 'https://example.com/image.png', width: 100 } } });

const thumbnail = new Thumbnail({ media: receivedMedia }).toJSON();
// @ts-expect-error serialized thumbnail media exposes only the URL
thumbnail.media.flags;
const file = new File({ file: receivedMedia }).toJSON();
// @ts-expect-error serialized file media exposes only the URL
file.file.attachment_id;
// @ts-expect-error serialized gallery media exposes only the URL
galleryItem.media?.content_scan_metadata;

declare const create: RESTPostAPIChannelMessageJSONBody;
declare const edit: RESTPatchAPIChannelMessageJSONBody;
declare const webhook: RESTPostAPIWebhookWithTokenJSONBody;
declare const webhookEdit: RESTPatchAPIWebhookWithTokenMessageJSONBody;
declare const interaction: APIInteractionResponseCallbackData;
declare const highLevelMessage: Parameters<Client['messages']['write']>[1];

expectType<RESTAPITopLevelComponent[] | undefined>(create.components);
expectType<RESTAPITopLevelComponent[] | null | undefined>(edit.components);
expectType<RESTAPITopLevelComponent[] | undefined>(webhook.components);
expectType<RESTAPITopLevelComponent[] | undefined>(interaction.components);

// @ts-expect-error raw message payloads restrict nested file media too
create.components = [{ type: ComponentType.Container, components: [{ type: ComponentType.File, file: { url: 'attachment://image.png', flags: 1 } }] }];
// @ts-expect-error edits restrict gallery media just like message creation
edit.components = [{ type: ComponentType.MediaGallery, items: [{ media: { url: 'https://example.com/image.png', placeholder: 'hash' } }] }];
// @ts-expect-error webhook requests use outbound media fields
webhook.components = [{ type: ComponentType.File, file: { url: 'attachment://image.png', flags: 1 } }];
// @ts-expect-error webhook edits retain the outbound media restriction
webhookEdit.components = [{ type: ComponentType.File, file: { url: 'attachment://image.png', flags: 1 } }];
// @ts-expect-error interaction responses inherit the outbound media restriction
interaction.components = [{ type: ComponentType.File, file: { url: 'attachment://image.png', flags: 1 } }];
// @ts-expect-error higher-level write helpers expose outbound JSON for raw components
highLevelMessage.components = [{ type: ComponentType.File, file: { url: 'attachment://image.png', flags: 1 } }];
