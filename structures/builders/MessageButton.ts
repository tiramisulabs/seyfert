import { ButtonStyles, type DiscordButtonComponent, MessageComponentTypes } from "../../vendor/external.ts";
import { ComponentEmoji } from "../../util/builders.ts";

export class ButtonBuilder {
    constructor() {
        this.#data = {} as DiscordButtonComponent;
        this.type = 2;
    }
    #data: DiscordButtonComponent;
    type: MessageComponentTypes.Button;
    setStyle(style: ButtonStyles) {
        this.#data.style = style;
        return this;
    }

    setLabel(label: string) {
        this.#data.label = label;
        return this;
    }

    setCustomId(id: string) {
        this.#data.custom_id = id;
        return this;
    }

    setEmoji(emoji: ComponentEmoji) {
        this.#data.emoji = emoji;
        return this;
    }

    setDisabled(disabled = true) {
        this.#data.disabled = disabled;
        return this;
    }

    setURL(url: string) {
        this.#data.url = url;
        return this;
    }

    toJSON(): DiscordButtonComponent {
        return { ...this.#data };
    }
}
