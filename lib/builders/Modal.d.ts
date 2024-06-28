import { type APIModalInteractionResponseCallbackData, type APITextInputComponent, type TextInputStyle } from 'discord-api-types/v10';
import type { RestOrArray } from '../common';
import type { ActionRow } from './ActionRow';
import { BaseComponentBuilder, type OptionValuesLength } from './Base';
import type { ModalBuilderComponents, ModalSubmitCallback } from './types';
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
export declare class Modal<T extends ModalBuilderComponents = TextInput> {
    data: Partial<APIModalInteractionResponseCallbackData>;
    components: ActionRow<T>[];
    /**
     * Creates a new Modal instance.
     * @param data - Optional data for the modal.
     */
    constructor(data?: Partial<APIModalInteractionResponseCallbackData>);
    /**
     * Adds components to the modal.
     * @param components - Components to be added to the modal.
     * @returns The current Modal instance.
     */
    addComponents(...components: RestOrArray<ActionRow<T>>): this;
    /**
     * Set the components to the modal.
     * @param component - The components to set into the modal.
     * @returns The current Modal instance.
     */
    setComponents(component: ActionRow<T>[]): this;
    /**
     * Sets the title of the modal.
     * @param title - The title of the modal.
     * @returns The current Modal instance.
     */
    setTitle(title: string): this;
    /**
     * Sets the custom ID of the modal.
     * @param id - The custom ID for the modal.
     * @returns The current Modal instance.
     */
    setCustomId(id: string): this;
    /**
     * Sets the callback function to be executed when the modal is submitted.
     * @param func - The callback function.
     * @returns The current Modal instance.
     */
    run(func: ModalSubmitCallback): this;
    /**
     * Converts the modal to JSON format.
     * @returns The modal data in JSON format.
     */
    toJSON(): APIModalInteractionResponseCallbackData;
}
/**
 * Represents a text input component builder.
 * @example
 * const textInput = new TextInput().setLabel("Enter text");
 * textInput.setStyle(TextInputStyle.Paragraph);
 * textInput.setPlaceholder("Type here");
 * const json = textInput.toJSON();
 */
export declare class TextInput extends BaseComponentBuilder<APITextInputComponent> {
    /**
     * Creates a new TextInput instance.
     * @param data - Optional data for the text input.
     */
    constructor(data?: Partial<APITextInputComponent>);
    /**
     * Sets the style of the text input.
     * @param style - The style of the text input.
     * @returns The current TextInput instance.
     */
    setStyle(style: TextInputStyle): this;
    /**
     * Sets the label of the text input.
     * @param label - The label of the text input.
     * @returns The current TextInput instance.
     */
    setLabel(label: string): this;
    /**
     * Sets the placeholder of the text input.
     * @param placeholder - The placeholder text.
     * @returns The current TextInput instance.
     */
    setPlaceholder(placeholder: string): this;
    /**
     * Sets the length constraints for the text input.
     * @param options - The length constraints.
     * @returns The current TextInput instance.
     */
    setLength({ max, min }: Partial<OptionValuesLength>): this;
    /**
     * Sets the custom ID of the text input.
     * @param id - The custom ID for the text input.
     * @returns The current TextInput instance.
     */
    setCustomId(id: string): this;
    /**
     * Sets the initial value of the text input.
     * @param value - The initial value.
     * @returns The current TextInput instance.
     */
    setValue(value: string): this;
    /**
     * Sets whether the text input is required.
     * @param required - Indicates whether the text input is required.
     * @returns The current TextInput instance.
     */
    setRequired(required?: boolean): this;
}
