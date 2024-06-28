import { type APIActionRowComponent, type APIActionRowComponentTypes, type APIMessageActionRowComponent } from 'discord-api-types/v10';
import type { RestOrArray } from '../common/types/util';
import { BaseComponentBuilder } from './Base';
import type { BuilderComponents, FixedComponents } from './types';
/**
 * Represents an Action Row component in a message.
 * @template T - The type of components in the Action Row.
 */
export declare class ActionRow<T extends BuilderComponents> extends BaseComponentBuilder<APIActionRowComponent<APIActionRowComponentTypes>> {
    /**
     * Creates a new instance of the ActionRow class.
     * @param data - Optional data to initialize the Action Row.
     * @example
     * const actionRow = new ActionRow<Button>({ components: [buttonRawJSON] });
     */
    constructor({ components, ...data }?: Partial<APIActionRowComponent<APIActionRowComponentTypes>>);
    components: FixedComponents<T>[];
    /**
     * Adds one or more components to the Action Row.
     * @param component - The component(s) to add.
     * @returns The updated Action Row instance.
     * @example
     * actionRow.addComponents(buttonComponent);
     * actionRow.addComponents(buttonComponent1, buttonComponent2);
     * actionRow.addComponents([buttonComponent1, buttonComponent2]);
     */
    addComponents(...component: RestOrArray<FixedComponents<T>>): this;
    /**
     * Sets the components of the Action Row.
     * @param component - The components to set.
     * @returns The updated Action Row instance.
     * @example
     * actionRow.setComponents([buttonComponent1, buttonComponent2]);
     */
    setComponents(component: FixedComponents<T>[]): this;
    /**
     * Converts the Action Row to its JSON representation.
     * @returns The JSON representation of the Action Row.
     */
    toJSON(): APIActionRowComponent<APIMessageActionRowComponent>;
}
