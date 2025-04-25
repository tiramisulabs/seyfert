import { type APIFileComponent, ComponentType } from '../types';
import { BaseComponentBuilder } from './Base';

/**
 * Represents a file component builder.
 * Used to display files within containers.
 * @example
 * ```ts
 * const file = new File()
 *  .setMedia('https://example.com/image.png')
 *  .setSpoiler();
 * ```
 */
export class File extends BaseComponentBuilder<APIFileComponent> {
	/**
	 * Constructs a new File component.
	 * @param data Optional initial data for the file component.
	 */
	constructor(data: Partial<APIFileComponent> = {}) {
		super({ type: ComponentType.File, ...data });
	}

	/**
	 * Sets the ID for the file component.
	 * @param id The ID to set.
	 * @returns The updated File instance.
	 */
	setId(id: number) {
		this.data.id = id;
		return this;
	}

	/**
	 * Sets the media URL for the file.
	 * @param url The URL of the file to display.
	 * @returns The updated File instance.
	 */
	setMedia(url: string) {
		this.data.file = { url };
		return this;
	}

	/**
	 * Sets whether the file should be visually marked as a spoiler.
	 * @param spoiler Whether the file is a spoiler (defaults to true).
	 * @returns The updated File instance.
	 */
	setSpoiler(spoiler = true) {
		this.data.spoiler = spoiler;
		return this;
	}
}
