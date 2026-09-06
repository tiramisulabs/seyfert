import { type APIThumbnailComponent, ComponentType } from '../types';
import { BaseComponentBuilder } from './Base';

/**
 * Represents a thumbnail component builder.
 * Used to display a small image preview, often alongside other content.
 * @example
 * ```ts
 * const thumbnail = new Thumbnail()
 *  .setMedia('https://example.com/thumbnail.jpg')
 *  .setDescription('A cool thumbnail');
 * ```
 */
export class Thumbnail extends BaseComponentBuilder<APIThumbnailComponent> {
	/**
	 * Constructs a new Thumbnail component.
	 * @param data Optional initial data for the thumbnail component.
	 */
	constructor(data: Partial<APIThumbnailComponent> = {}) {
		super({ type: ComponentType.Thumbnail, ...data });
	}

	/**
	 * Sets whether the thumbnail should be visually marked as a spoiler.
	 * @param spoiler Whether the thumbnail is a spoiler (defaults to true).
	 * @returns The updated Thumbnail instance.
	 */
	setSpoiler(spoiler = true) {
		this.data.spoiler = spoiler;
		return this;
	}

	/**
	 * Sets the description for the thumbnail.
	 * @param description The description text. Can be undefined to remove the description.
	 * @returns The updated Thumbnail instance.
	 */
	setDescription(description: string | undefined) {
		this.data.description = description;
		return this;
	}

	/**
	 * Sets the ID for the thumbnail component.
	 * @param id The ID to set.
	 * @returns The updated Thumbnail instance.
	 */
	setId(id: number) {
		this.data.id = id;
		return this;
	}

	/**
	 * Sets the media URL for the thumbnail.
	 * @param url The URL of the image to display as a thumbnail.
	 * @returns The updated Thumbnail instance.
	 */
	setMedia(url: string) {
		this.data.media = { url };
		return this;
	}
}
