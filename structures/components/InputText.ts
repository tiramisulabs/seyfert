import { DiscordInputTextComponent, MessageComponentTypes, TextStyles } from "../../vendor/external.ts";
import { BaseComponent } from "./BaseComponent.ts";

/**
 * Represents Discord Text Inputs
 * @link https://discord.com/developers/docs/interactions/message-components#action-rows
 */
export class InputTextComponent extends BaseComponent<MessageComponentTypes.InputText> {
    constructor(data: DiscordInputTextComponent) {
        super(data.type);
        this.style = data!.style;
        this.label = data!.label;
        this.placeholder = data?.placeholder;
        this.maxLength = data?.max_length;
        this.minLength = data?.min_length;
        this.customId = data!.custom_id;
        this.required = !!data?.required;
        this.value = data?.value;
    }
    style: TextStyles;
    label: string;
    placeholder?: string;
    maxLength?: number;
    minLength?: number;
    customId: string;
    required?: boolean;
    value?: string;
}
