import { type DiscordSelectMenuComponent, MessageComponentTypes } from "../../vendor/external.ts";
import { SelectMenuOptionBuilder } from "./SelectMenuOptionBuilder.ts";

export class SelectMenuBuilder {
    constructor() {
        this.#data = {} as DiscordSelectMenuComponent;
        this.type = 3;
        this.options = [];
    }
    #data: DiscordSelectMenuComponent;
    type: MessageComponentTypes.SelectMenu;
    options: SelectMenuOptionBuilder[];

    setPlaceholder(placeholder: string) {
        this.#data.placeholder = placeholder;
        return this;
    }

    setValues(max?: number, min?: number) {
        this.#data.max_values = max;
        this.#data.min_values = min;
        return this;
    }

    setDisabled(disabled = true) {
        this.#data.disabled = disabled;
        return this;
    }

    setCustomId(id: string) {
        this.#data.custom_id = id;
        return this;
    }

    setOptions(...options: SelectMenuOptionBuilder[]) {
        this.options.splice(
            0,
            this.options.length,
            ...options,
        );
        return this;
    }

    addOptions(...options: SelectMenuOptionBuilder[]) {
        this.options.push(
            ...options,
        );
    }

    toJSON() {
        return { ...this.#data, options: this.options.map((option) => option.toJSON()) };
    }
}
