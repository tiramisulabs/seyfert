import type { DiscordSelectOption } from "../../../../discordeno/mod.ts";
import type { ComponentEmoji } from "../../../Util.ts";

export class SelectMenuOptionBuilder {
    constructor() {
        this.#data = {} as DiscordSelectOption;
    }
    #data: DiscordSelectOption;

    setLabel(label: string) {
        this.#data.label = label;
        return this;
    }

    setValue(value: string) {
        this.#data.value = value;
        return this;
    }

    setDescription(description: string) {
        this.#data.description = description;
        return this;
    }

    setDefault(Default = true) {
        this.#data.default = Default;
        return this;
    }

    setEmoji(emoji: ComponentEmoji) {
        this.#data.emoji = emoji;
        return this;
    }

    toJSON() {
        return { ...this.#data };
    }
}
