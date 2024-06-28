"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Button = void 0;
const v10_1 = require("discord-api-types/v10");
const functions_1 = require("../structures/extra/functions");
/**
 * Represents a button component.
 * @template Type - The type of the button component.
 */
class Button {
    data;
    /**
     * Creates a new Button instance.
     * @param data - The initial data for the button.
     */
    constructor(data = {}) {
        this.data = data;
        this.data.type = v10_1.ComponentType.Button;
    }
    /**
     * Sets the custom ID for the button.
     * @param id - The custom ID to set.
     * @returns The modified Button instance.
     */
    setCustomId(id) {
        this.data.custom_id = id;
        return this;
    }
    /**
     * Sets the URL for the button.
     * @param url - The URL to set.
     * @returns The modified Button instance.
     */
    setURL(url) {
        this.data.url = url;
        return this;
    }
    /**
     * Sets the label for the button.
     * @param label - The label to set.
     * @returns The modified Button instance.
     */
    setLabel(label) {
        this.data.label = label;
        return this;
    }
    /**
     * Sets the emoji for the button.
     * @param emoji - The emoji to set.
     * @returns The modified Button instance.
     */
    setEmoji(emoji) {
        const resolve = (0, functions_1.resolvePartialEmoji)(emoji);
        if (!resolve)
            throw new Error('Invalid Emoji');
        this.data.emoji =
            resolve;
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
    setStyle(style) {
        this.data.style = style;
        return this;
    }
    setSKUId(skuId) {
        this.data.sku_id = skuId;
        return this;
    }
    /**
     * Converts the Button instance to its JSON representation.
     * @returns The JSON representation of the Button instance.
     */
    toJSON() {
        return { ...this.data };
    }
}
exports.Button = Button;
