import { type DiscordSelectMenuComponent, MessageComponentTypes } from "../../../../discordeno/mod.ts";
import type { SelectMenuOptionBuilder } from "./SelectMenuOptionBuilder.ts";

export class SelectMenuBuilder {
    constructor() {
        this.#data = {} as DiscordSelectMenuComponent;
        this.type = MessageComponentTypes.SelectMenu;
        this.options = [];
    }
    #data: DiscordSelectMenuComponent;
    type: MessageComponentTypes.SelectMenu;
    options: SelectMenuOptionBuilder[];

    setPlaceholder(placeholder: string): this {
        this.#data.placeholder = placeholder;
        return this;
    }

    setValues(max?: number, min?: number): this {
        this.#data.max_values = max;
        this.#data.min_values = min;
        return this;
    }

    setDisabled(disabled = true): this {
        this.#data.disabled = disabled;
        return this;
    }

    setCustomId(id: string): this {
        this.#data.custom_id = id;
        return this;
    }

    setOptions(...options: SelectMenuOptionBuilder[]): this {
        this.options.splice(
            0,
            this.options.length,
            ...options,
        );
        return this;
    }

    addOptions(...options: SelectMenuOptionBuilder[]): this {
        this.options.push(
            ...options,
        );
        return this;
    }

    toJSON(): DiscordSelectMenuComponent {
        return { ...this.#data, type: this.type, options: this.options.map((option) => option.toJSON()) };
    }
}
