import type { ComponentEmoji, DiscordSelectOption } from "../../vendor/external.ts";

export class SelectMenuOptionBuilder {
    constructor(data?: DiscordSelectOption) {
        this.data = data ?? {} as DiscordSelectOption;
    }
    data: DiscordSelectOption;
    label?: string;
    value?: string;
    description?: string;
    emoji?: ComponentEmoji;
    default?: boolean;

    setLabel(label: string) {
        this.data.label = label;
        return this;
    }

    setValue(value: string) {
        this.data.value = value;
        return this;
    }

    setDescription(description: string) {
        this.data.description = description;
        return this;
    }

    setDefault(Default = true) {
        this.data.default = Default;
        return this;
    }

    setEmoji(emoji: ComponentEmoji) {
        this.data.emoji = emoji;
        return this;
    }

    toJSON() {
        return { ...this.data };
    }
}
