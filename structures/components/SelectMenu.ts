import { DiscordSelectMenuComponent, MessageComponentTypes } from "../../vendor/external.ts";
import { BuildComponent } from "./BuildComponent.ts";
import { SelectMenuOption } from "./SelectMenuOption.ts";

/**
 * Represents Discord Select Menu
 * @link https://discord.com/developers/docs/interactions/message-components#select-menu-object
 */
export class SelectMenuComponent extends BuildComponent<DiscordSelectMenuComponent> {
    constructor(data?: DiscordSelectMenuComponent) {
        super({ ...data!, type: MessageComponentTypes.SelectMenu });
        this.placeholder = data?.placeholder;
        this.maxValues = data?.max_values;
        this.minValues = data?.min_values;
        this.customId = data!.custom_id;
        this.options = data!.options.map((x) => new SelectMenuOption(x)) ?? [];
        this.disabled = !!data?.disalbed;
    }
    placeholder?: string;
    maxValues?: number;
    minValues?: number;
    customId: string;
    options: SelectMenuOption[];
    disabled?: boolean;

    setPlaceholder(placeholder: string) {
        this.placeholder = placeholder;
        return this;
    }

    setValues(max?: number, min?: number) {
        this.maxValues = max;
        this.minValues = min;
        return this;
    }

    setDisabled(disabled = true) {
        this.disabled = disabled;
        return this;
    }

    setCustomId(id: string) {
        this.customId = id;
        return this;
    }

    setOptions(...options: SelectMenuOption[]) {
        this.options.splice(
            0,
            this.options.length,
            ...options.map((option) => option instanceof SelectMenuOption ? option : new SelectMenuOption(option)),
        );
        return this;
    }

    addOptions(options: SelectMenuOption[]) {
        this.options.push(
            ...options.map(
                (option) => option instanceof SelectMenuOption ? option : new SelectMenuOption(option),
            ),
        );
    }
}
