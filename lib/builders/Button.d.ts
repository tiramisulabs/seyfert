import { type ButtonStyle, type APIButtonComponent } from 'discord-api-types/v10';
import type { EmojiResolvable } from '../common';
/**
 * Represents a button component.
 * @template Type - The type of the button component.
 */
export declare class Button {
    data: Partial<APIButtonComponent>;
    /**
     * Creates a new Button instance.
     * @param data - The initial data for the button.
     */
    constructor(data?: Partial<APIButtonComponent>);
    /**
     * Sets the custom ID for the button.
     * @param id - The custom ID to set.
     * @returns The modified Button instance.
     */
    setCustomId(id: string): this;
    /**
     * Sets the URL for the button.
     * @param url - The URL to set.
     * @returns The modified Button instance.
     */
    setURL(url: string): this;
    /**
     * Sets the label for the button.
     * @param label - The label to set.
     * @returns The modified Button instance.
     */
    setLabel(label: string): this;
    /**
     * Sets the emoji for the button.
     * @param emoji - The emoji to set.
     * @returns The modified Button instance.
     */
    setEmoji(emoji: EmojiResolvable): this;
    /**
     * Sets the disabled state of the button.
     * @param disabled - Whether the button should be disabled or not.
     * @returns The modified Button instance.
     */
    setDisabled(disabled?: boolean): this;
    setStyle(style: ButtonStyle): this;
    setSKUId(skuId: string): this;
    /**
     * Converts the Button instance to its JSON representation.
     * @returns The JSON representation of the Button instance.
     */
    toJSON(): Partial<APIButtonComponent>;
}
