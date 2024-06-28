"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionRow = void 0;
const v10_1 = require("discord-api-types/v10");
const Base_1 = require("./Base");
const index_1 = require("./index");
/**
 * Represents an Action Row component in a message.
 * @template T - The type of components in the Action Row.
 */
class ActionRow extends Base_1.BaseComponentBuilder {
    /**
     * Creates a new instance of the ActionRow class.
     * @param data - Optional data to initialize the Action Row.
     * @example
     * const actionRow = new ActionRow<Button>({ components: [buttonRawJSON] });
     */
    constructor({ components, ...data } = {}) {
        super({ ...data, type: v10_1.ComponentType.ActionRow });
        this.components = (components?.map(index_1.fromComponent) ?? []);
    }
    components;
    /**
     * Adds one or more components to the Action Row.
     * @param component - The component(s) to add.
     * @returns The updated Action Row instance.
     * @example
     * actionRow.addComponents(buttonComponent);
     * actionRow.addComponents(buttonComponent1, buttonComponent2);
     * actionRow.addComponents([buttonComponent1, buttonComponent2]);
     */
    addComponents(...component) {
        this.components = this.components.concat(component.flat());
        return this;
    }
    /**
     * Sets the components of the Action Row.
     * @param component - The components to set.
     * @returns The updated Action Row instance.
     * @example
     * actionRow.setComponents([buttonComponent1, buttonComponent2]);
     */
    setComponents(component) {
        this.components = [...component];
        return this;
    }
    /**
     * Converts the Action Row to its JSON representation.
     * @returns The JSON representation of the Action Row.
     */
    toJSON() {
        const components = this.components.map(c => {
            return c.toJSON();
        });
        return { type: v10_1.ComponentType.ActionRow, components };
    }
}
exports.ActionRow = ActionRow;
