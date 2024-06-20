import {
	type APIMessageComponentEmoji,
	type ButtonStyle,
	ComponentType,
	type APIButtonComponent,
} from 'discord-api-types/v10';
import type { EmojiResolvable } from '../common';
import { resolvePartialEmoji } from '../structures/extra/functions';

/**
 * Represents a button component.
 * @template Type - The type of the button component.
 */
export class Button {
	/**
	 * Creates a new Button instance.
	 * @param data - The initial data for the button.
	 */
	constructor(public data: Partial<APIButtonComponent> = {}) {
		this.data.type = ComponentType.Button;
	}

	/**
	 * Sets the custom ID for the button.
	 * @param id - The custom ID to set.
	 * @returns The modified Button instance.
	 */
	setCustomId(id: string) {
		(this.data as Extract<APIButtonComponent, { custom_id?: string }>).custom_id = id;
		return this;
	}

	/**
	 * Sets the URL for the button.
	 * @param url - The URL to set.
	 * @returns The modified Button instance.
	 */
	setURL(url: string) {
		(this.data as Extract<APIButtonComponent, { url?: string }>).url = url;
		return this;
	}

	/**
	 * Sets the label for the button.
	 * @param label - The label to set.
	 * @returns The modified Button instance.
	 */
	setLabel(label: string) {
		(this.data as Extract<APIButtonComponent, { label?: string }>).label = label;
		return this;
	}

	/**
	 * Sets the emoji for the button.
	 * @param emoji - The emoji to set.
	 * @returns The modified Button instance.
	 */
	setEmoji(emoji: EmojiResolvable) {
		const resolve = resolvePartialEmoji(emoji);
		if (!resolve) throw new Error('Invalid Emoji');
		(this.data as Extract<APIButtonComponent, { emoji?: APIMessageComponentEmoji }>).emoji =
			resolve as APIMessageComponentEmoji;
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

	setSKUId(skuId: string) {
		(this.data as Extract<APIButtonComponent, { sku_id?: string }>).sku_id = skuId;
		return this;
	}

	/**
	 * Converts the Button instance to its JSON representation.
	 * @returns The JSON representation of the Button instance.
	 */
	toJSON() {
		return { ...this.data } as Partial<APIButtonComponent>;
	}
}
