import { createValidationMetadata, type EmojiResolvable, resolvePartialEmoji, SeyfertError } from '../common';
import { type APIButtonComponent, type APIMessageComponentEmoji, type ButtonStyle, ComponentType } from '../types';
import { BaseComponentBuilder } from './Base';

/**
 * Represents a button component.
 * @template Type - The type of the button component.
 */
export class Button extends BaseComponentBuilder<APIButtonComponent> {
	constructor(data: Partial<APIButtonComponent> = {}) {
		super({ type: ComponentType.Button, ...data });
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
		if (!resolve)
			throw new SeyfertError('Invalid Emoji', {
				code: 'INVALID_EMOJI',
				metadata: createValidationMetadata('EmojiResolvable', emoji, { component: 'Button' }),
			});
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
}
