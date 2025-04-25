import type { RestOrArray } from '../common';
import { type APIMediaGalleryComponent, type APIMediaGalleryItems, ComponentType } from '../types';
import { BaseComponentBuilder } from './Base';

/**
 * Represents a media gallery component builder.
 * Used to display a collection of media items.
 * @example
 * ```ts
 * const gallery = new MediaGallery()
 *  .addItems(
 *      new MediaGalleryItem().setMedia('https://example.com/image1.png').setDescription('Image 1'),
 *      new MediaGalleryItem().setMedia('https://example.com/image2.jpg').setSpoiler()
 *  );
 * ```
 */
export class MediaGallery extends BaseComponentBuilder<APIMediaGalleryComponent> {
	items: MediaGalleryItem[];
	/**
	 * Constructs a new MediaGallery.
	 * @param data Optional initial data for the media gallery.
	 */
	constructor({ items, ...data }: Partial<APIMediaGalleryComponent> = {}) {
		super({ type: ComponentType.MediaGallery, ...data });
		this.items = (items?.map(i => new MediaGalleryItem(i)) ?? []) as MediaGalleryItem[];
	}
	/**
	 * Sets the ID for the media gallery component.
	 * @param id The ID to set.
	 * @returns The updated MediaGallery instance.
	 */
	setId(id: number) {
		this.data.id = id;
		return this;
	}

	/**
	 * Adds items to the media gallery.
	 * @param items The items to add. Can be a single item, an array of items, or multiple items as arguments.
	 * @returns The updated MediaGallery instance.
	 */
	addItems(...items: RestOrArray<MediaGalleryItem>) {
		this.items = this.items.concat(items.flat());
		return this;
	}

	/**
	 * Sets the items for the media gallery, replacing any existing items.
	 * @param items The items to set. Can be a single item, an array of items, or multiple items as arguments.
	 * @returns The updated MediaGallery instance.
	 */
	setItems(...items: RestOrArray<MediaGalleryItem>) {
		this.items = items.flat();
		return this;
	}

	toJSON() {
		return {
			...this.data,
			items: this.items.map(i => i.toJSON()),
		} as APIMediaGalleryComponent;
	}
}

/**
 * Represents an item within a MediaGallery.
 */
export class MediaGalleryItem {
	/**
	 * Constructs a new MediaGalleryItem.
	 * @param data Optional initial data for the media gallery item.
	 */
	constructor(public data: Partial<APIMediaGalleryItems> = {}) {}

	/**
	 * Sets the media URL for this gallery item.
	 * @param url The URL of the media.
	 * @returns The updated MediaGalleryItem instance.
	 */
	setMedia(url: string) {
		this.data.media = { url };
		return this;
	}

	/**
	 * Sets the description for this gallery item.
	 * @param desc The description text.
	 * @returns The updated MediaGalleryItem instance.
	 */
	setDescription(desc: string) {
		this.data.description = desc;
		return this;
	}

	/**
	 * Sets whether this gallery item should be visually marked as a spoiler.
	 * @param spoiler Whether the item is a spoiler (defaults to true).
	 * @returns The updated MediaGalleryItem instance.
	 */
	setSpoiler(spoiler = true) {
		this.data.spoiler = spoiler;
		return this;
	}

	/**
	 * Converts this MediaGalleryItem instance to its JSON representation.
	 * @returns The JSON representation of the item data.
	 */
	toJSON() {
		return { ...this.data };
	}
}
