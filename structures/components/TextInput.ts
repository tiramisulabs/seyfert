import { DiscordInputTextComponent, MessageComponentTypes, TextStyles } from "../../vendor/external.ts";
import { BuildComponent } from "./BuildComponent.ts";

/**
 * Represents Discord Text Inputs
 * @link https://discord.com/developers/docs/interactions/message-components#action-rows
 */
export class TextInputComponent extends BuildComponent<DiscordInputTextComponent> {
    constructor(data?: DiscordInputTextComponent) {
        super({ ...data!, type: MessageComponentTypes.InputText });
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

    setStyle(style: TextStyles) {
        this.style = style;
        return this;
    }

    setLabel(label: string) {
        this.label = label;
        return this;
    }

    setPlaceholder(placeholder: string) {
        this.placeholder = placeholder;
        return this;
    }

    setLength(max?: number, min?: number) {
        this.maxLength = max;
        this.minLength = min;
        return this;
    }

    setCustomId(id: string) {
        this.customId = id;
        return this;
    }

    setValue(value: string) {
        this.value = value;
        return this;
    }

    setRequired(required = true) {
        this.required = required;
        return this;
    }
}
