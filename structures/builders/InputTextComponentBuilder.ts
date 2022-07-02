import { ComponentBuilder } from "./ComponentBuilder.ts";
import { DiscordInputTextComponent, MessageComponentTypes, TextStyles } from "../../vendor/external.ts";

export class InputTextBuilder extends ComponentBuilder<DiscordInputTextComponent> {
    constructor(data?: DiscordInputTextComponent) {
        super({ ...data!, type: MessageComponentTypes.InputText });
    }

    setStyle(style: TextStyles) {
        this.data.style = style;
        return this;
    }

    setLabel(label: string) {
        this.data.label = label;
        return this;
    }

    setPlaceholder(placeholder: string) {
        this.data.placeholder = placeholder;
        return this;
    }

    setLength(max?: number, min?: number) {
        this.data.max_length = max;
        this.data.min_length = min;
        return this;
    }

    setCustomId(id: string) {
        this.data.custom_id = id;
        return this;
    }

    setValue(value: string) {
        this.data.value = value;
        return this;
    }

    setRequired(required = true) {
        this.data.required = required;
        return this;
    }
    toJSON() {
        return { ...this.data };
    }
}
