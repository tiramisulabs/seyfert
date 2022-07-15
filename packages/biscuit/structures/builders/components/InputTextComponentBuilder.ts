import type { DiscordInputTextComponent, MessageComponentTypes, TextStyles } from "../../../../discordeno/mod.ts";

export class InputTextBuilder {
    constructor() {
        this.#data = {} as DiscordInputTextComponent;
        this.type = 4;
    }
    #data: DiscordInputTextComponent;
    type: MessageComponentTypes.InputText;

    setStyle(style: TextStyles): InputTextBuilder {
        this.#data.style = style;
        return this;
    }

    setLabel(label: string): InputTextBuilder {
        this.#data.label = label;
        return this;
    }

    setPlaceholder(placeholder: string): InputTextBuilder {
        this.#data.placeholder = placeholder;
        return this;
    }

    setLength(max?: number, min?: number): InputTextBuilder {
        this.#data.max_length = max;
        this.#data.min_length = min;
        return this;
    }

    setCustomId(id: string): InputTextBuilder {
        this.#data.custom_id = id;
        return this;
    }

    setValue(value: string): InputTextBuilder {
        this.#data.value = value;
        return this;
    }

    setRequired(required = true): InputTextBuilder {
        this.#data.required = required;
        return this;
    }
    toJSON(): DiscordInputTextComponent {
        return { ...this.#data, type: this.type };
    }
}
