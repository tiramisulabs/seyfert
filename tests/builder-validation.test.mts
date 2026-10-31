import { describe, expect, test } from 'vitest';
import {
	type APIContainerComponent,
	ComponentType,
	componentFactory,
	File,
	MediaGalleryItem,
	PollBuilder,
	RadioGroup,
	RadioGroupOption,
	StringSelectMenu,
	StringSelectOption,
	Thumbnail,
	UnfurledMediaItemContentScanFlags,
	UnfurledMediaItemFlags,
} from '../lib';
import { SeyfertError } from '../lib/common';

function expectSeyfertCode(run: () => unknown, code: string, component: string) {
	let thrown: unknown;

	try {
		run();
	} catch (error) {
		thrown = error;
	}

	expect(thrown).toBeInstanceOf(SeyfertError);
	expect(thrown).toMatchObject({
		code,
		metadata: expect.objectContaining({ component }),
	});
}

describe('builder toJSON validation', () => {
	test('media builders strip received metadata at serialization without changing the received component', () => {
		const media = {
			url: 'https://example.com/image.png',
			proxy_url: 'https://example.com/proxy.png',
			height: 100,
			width: 200,
			content_type: 'image/png',
			placeholder: 'thumbhash',
			placeholder_version: 1,
			flags: UnfurledMediaItemFlags.IsAnimated,
			content_scan_metadata: { flags: UnfurledMediaItemContentScanFlags.IsExplicitContent },
			attachment_id: '123',
		};
		const fileMedia = { ...media, url: 'attachment://image.png' };
		const data: APIContainerComponent = {
			type: ComponentType.Container,
			components: [
				{
					type: ComponentType.Section,
					components: [{ type: ComponentType.TextDisplay, content: 'Image' }],
					accessory: { type: ComponentType.Thumbnail, media, description: 'Preview', spoiler: true },
				},
				{
					type: ComponentType.MediaGallery,
					items: [{ media, description: 'Gallery image', spoiler: true }],
				},
				{ type: ComponentType.File, file: fileMedia, spoiler: true },
			],
		};
		const received = componentFactory(data);
		const original = structuredClone(data);
		const builder = received.toBuilder();

		expect(builder.toJSON()).toEqual({
			type: ComponentType.Container,
			components: [
				{
					type: ComponentType.Section,
					components: [{ type: ComponentType.TextDisplay, content: 'Image' }],
					accessory: {
						type: ComponentType.Thumbnail,
						media: { url: media.url },
						description: 'Preview',
						spoiler: true,
					},
				},
				{
					type: ComponentType.MediaGallery,
					items: [{ media: { url: media.url }, description: 'Gallery image', spoiler: true }],
				},
				{ type: ComponentType.File, file: { url: fileMedia.url }, spoiler: true },
			],
		});
		expect(received.toJSON()).toEqual(original);

		// Metadata can also arrive through structurally compatible variables after construction.
		const thumbnail = new Thumbnail().setMedia(media.url);
		const file = new File().setMedia(fileMedia.url);
		const galleryItem = new MediaGalleryItem().setMedia(media.url);
		thumbnail.data.media = media;
		file.data.file = fileMedia;
		galleryItem.data.media = media;

		expect(thumbnail.toJSON().media).toEqual({ url: media.url });
		expect(file.toJSON().file).toEqual({ url: fileMedia.url });
		expect(galleryItem.toJSON().media).toEqual({ url: media.url });
	});

	test('PollBuilder rejects missing or empty answers', () => {
		const missingAnswers = new PollBuilder().setQuestion({ text: 'Continue?' });
		const emptyAnswers = new PollBuilder().setQuestion({ text: 'Continue?' }).setAnswers([]);

		expectSeyfertCode(() => missingAnswers.toJSON(), 'MISSING_POLL_ANSWERS', 'PollBuilder');
		expectSeyfertCode(() => emptyAnswers.toJSON(), 'MISSING_POLL_ANSWERS', 'PollBuilder');
	});

	test('RadioGroup validates builder options through option toJSON', () => {
		const option = new RadioGroupOption({ value: 'general', label: 'General' });
		delete (option.data as { value?: string }).value;
		const menu = new RadioGroup()
			.setCustomId('topics')
			.setOptions(option, new RadioGroupOption({ label: 'Other', value: 'other' }));

		expectSeyfertCode(() => menu.toJSON(), 'MISSING_RADIO_GROUP_OPTION_VALUE', 'RadioGroupOption');
	});

	test('StringSelectMenu setOptions accepts spread builder and raw options', () => {
		const menu = new StringSelectMenu()
			.setCustomId('topics')
			.setOptions(new StringSelectOption({ label: 'News', value: 'news' }), {
				label: 'General',
				value: 'general',
			});

		expect(menu.toJSON().options).toEqual([
			{ label: 'News', value: 'news' },
			{ label: 'General', value: 'general' },
		]);
	});
});
