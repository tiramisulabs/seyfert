import { throwError } from '..';
import {
	ComponentType,
	type APIButtonComponent,
	type APIButtonComponentWithCustomId,
	type APIButtonComponentWithURL,
	type APIMessageComponentEmoji,
	type ButtonStyle,
	type EmojiResolvable,
	type When,
} from '../common';
import { resolvePartialEmoji } from '../structures/extra/functions';

export type ButtonStylesForID = Exclude<ButtonStyle, ButtonStyle.Link>;

/**
 * Represents a button component.
 * @template Type - The type of the button component.
 */
export class Button<Type extends boolean = boolean> {
	/**
	 * Creates a new Button instance.
	 * @param data - The initial data for the button.
	 */
	constructor(public data: Partial<When<Type, APIButtonComponentWithCustomId, APIButtonComponentWithURL>> = {}) {
		this.data.type = ComponentType.Button;
	}

	/**
	 * Sets the custom ID for the button.
	 * @param id - The custom ID to set.
	 * @returns The modified Button instance.
	 */
	setCustomId(id: string) {
		// @ts-expect-error
		this.data.custom_id = id;
		return this;
	}

	/**
	 * Sets the URL for the button.
	 * @param url - The URL to set.
	 * @returns The modified Button instance.
	 */
	setURL(url: string) {
		// @ts-expect-error
		this.data.url = url;
		return this;
	}

	/**
	 * Sets the label for the button.
	 * @param label - The label to set.
	 * @returns The modified Button instance.
	 */
	setLabel(label: string) {
		this.data.label = label;
		return this;
	}

	/**
	 * Sets the emoji for the button.
	 * @param emoji - The emoji to set.
	 * @returns The modified Button instance.
	 */
	setEmoji(emoji: EmojiResolvable) {
		const resolve = resolvePartialEmoji(emoji);
		if (!resolve) return throwError('Invalid Emoji');
		this.data.emoji = resolve as APIMessageComponentEmoji;
		return this;
	}

	/**
	 * Sets the disabled state of the button.
	 * @param disabled - Whether the button should be disabled or not.
	 * @returns The modified Button instance.
	 */
	setDisabled(disabled = true) {
		this.data.disabled = disabled;
		return this;
	}

	setStyle(style: ButtonStyle) {
		this.data.style = style;
		return this;
	}

	/**
	 * Converts the Button instance to its JSON representation.
	 * @returns The JSON representation of the Button instance.
	 */
	toJSON() {
		return { ...this.data } as unknown as APIButtonComponent;
	}
}
