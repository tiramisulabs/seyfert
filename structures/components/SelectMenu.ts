import { DiscordSelectMenuComponent, MessageComponentTypes } from "../../vendor/external.ts";
import { BaseComponent } from "./BaseComponent.ts";
import { SelectMenuOption } from "./SelectMenuOption.ts";

/**
 * Represents Discord Select Menu
 * @link https://discord.com/developers/docs/interactions/message-components#select-menu-object
 */
export class SelectMenuComponent extends BaseComponent<MessageComponentTypes.SelectMenu> {
    constructor(data: DiscordSelectMenuComponent) {
        super(data.type);
        this.placeholder = data.placeholder;
        this.maxValues = data.max_values;
        this.minValues = data.min_values;
        this.customId = data.custom_id;
        this.options = data.options.map((x) => new SelectMenuOption(x)) ?? [];
        this.disabled = !!data?.disabled;
    }
    placeholder?: string;
    maxValues?: number;
    minValues?: number;
    customId: string;
    options: SelectMenuOption[];
    disabled?: boolean;
}
