import { type APITextDisplayComponent, ComponentType } from '../types';
import { BaseComponentBuilder } from './Base';

/**
 * Represents a text display component builder.
 * Used to display simple text content.
 * @example
 * ```ts
 * const text = new TextDisplay().content('Hello, world!');
 * ```
 */
export class TextDisplay extends BaseComponentBuilder<APITextDisplayComponent> {
	/**
	 * Constructs a new TextDisplay component.
	 * @param data Optional initial data for the text display component.
	 */
	constructor(data: Partial<APITextDisplayComponent> = {}) {
		super({ type: ComponentType.TextDisplay, ...data });
	}

	/**
	 * Sets the ID for the text display component.
	 * @param id The ID to set.
	 * @returns The updated TextDisplay instance.
	 */
	setId(id: number) {
		this.data.id = id;
		return this;
	}

	/**
	 * Sets the text content to display.
	 * @param content The text content.
	 * @returns The updated TextDisplay instance.
	 */
	setContent(content: string) {
		this.data.content = content;
		return this;
	}
}
