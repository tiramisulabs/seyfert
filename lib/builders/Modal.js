"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextInput = exports.Modal = void 0;
const v10_1 = require("discord-api-types/v10");
const Base_1 = require("./Base");
const index_1 = require("./index");
/**
 * Represents a modal for user interactions.
 * @template T - The type of components allowed in the modal.
 * @example
 * const modal = new Modal();
 * modal.setTitle("Sample Modal");
 * modal.addComponents(
 *   new ActionRow<TextInput>()
 *   .addComponents(new TextInput().setLabel("Enter text"))
 * ));
 * modal.run((interaction) => {
 *   // Handle modal submission
 * });
 * const json = modal.toJSON();
 */
class Modal {
    data;
    /** @internal */
    __exec;
    components = [];
    /**
     * Creates a new Modal instance.
     * @param data - Optional data for the modal.
     */
    constructor(data = {}) {
        this.data = data;
        this.components = this.components.concat(data.components?.map(index_1.fromComponent) ?? []);
    }
    /**
     * Adds components to the modal.
     * @param components - Components to be added to the modal.
     * @returns The current Modal instance.
     */
    addComponents(...components) {
        this.components = this.components.concat(components.flat());
        return this;
    }
    /**
     * Set the components to the modal.
     * @param component - The components to set into the modal.
     * @returns The current Modal instance.
     */
    setComponents(component) {
        this.components = [...component];
        return this;
    }
    /**
     * Sets the title of the modal.
     * @param title - The title of the modal.
     * @returns The current Modal instance.
     */
    setTitle(title) {
        this.data.title = title;
        return this;
    }
    /**
     * Sets the custom ID of the modal.
     * @param id - The custom ID for the modal.
     * @returns The current Modal instance.
     */
    setCustomId(id) {
        this.data.custom_id = id;
        return this;
    }
    /**
     * Sets the callback function to be executed when the modal is submitted.
     * @param func - The callback function.
     * @returns The current Modal instance.
     */
    run(func) {
        this.__exec = func;
        return this;
    }
    /**
     * Converts the modal to JSON format.
     * @returns The modal data in JSON format.
     */
    toJSON() {
        return {
            custom_id: this.data.custom_id,
            title: this.data.title,
            components: this.components.map(x => x.toJSON()),
        };
    }
}
exports.Modal = Modal;
/**
 * Represents a text input component builder.
 * @example
 * const textInput = new TextInput().setLabel("Enter text");
 * textInput.setStyle(TextInputStyle.Paragraph);
 * textInput.setPlaceholder("Type here");
 * const json = textInput.toJSON();
 */
class TextInput extends Base_1.BaseComponentBuilder {
    /**
     * Creates a new TextInput instance.
     * @param data - Optional data for the text input.
     */
    constructor(data = {}) {
        super({ ...data, type: v10_1.ComponentType.TextInput });
    }
    /**
     * Sets the style of the text input.
     * @param style - The style of the text input.
     * @returns The current TextInput instance.
     */
    setStyle(style) {
        this.data.style = style;
        return this;
    }
    /**
     * Sets the label of the text input.
     * @param label - The label of the text input.
     * @returns The current TextInput instance.
     */
    setLabel(label) {
        this.data.label = label;
        return this;
    }
    /**
     * Sets the placeholder of the text input.
     * @param placeholder - The placeholder text.
     * @returns The current TextInput instance.
     */
    setPlaceholder(placeholder) {
        this.data.placeholder = placeholder;
        return this;
    }
    /**
     * Sets the length constraints for the text input.
     * @param options - The length constraints.
     * @returns The current TextInput instance.
     */
    setLength({ max, min }) {
        this.data.max_length = max;
        this.data.min_length = min;
        return this;
    }
    /**
     * Sets the custom ID of the text input.
     * @param id - The custom ID for the text input.
     * @returns The current TextInput instance.
     */
    setCustomId(id) {
        this.data.custom_id = id;
        return this;
    }
    /**
     * Sets the initial value of the text input.
     * @param value - The initial value.
     * @returns The current TextInput instance.
     */
    setValue(value) {
        this.data.value = value;
        return this;
    }
    /**
     * Sets whether the text input is required.
     * @param required - Indicates whether the text input is required.
     * @returns The current TextInput instance.
     */
    setRequired(required = true) {
        this.data.required = required;
        return this;
    }
}
exports.TextInput = TextInput;
