import { type ButtonStyles, type DiscordButtonComponent, MessageComponentTypes } from "../../../../discordeno/mod.ts";
import type { ComponentEmoji } from "../../../Util.ts";

export class ButtonBuilder {
    constructor() {
        this.#data = {} as DiscordButtonComponent;
        this.type = MessageComponentTypes.Button;
    }
    #data: DiscordButtonComponent;
    type: MessageComponentTypes.Button;
    setStyle(style: ButtonStyles) {
        this.#data.style = style;
        return this;
    }

    setLabel(label: string): ButtonBuilder {
        this.#data.label = label;
        return this;
    }

    setCustomId(id: string): ButtonBuilder {
        this.#data.custom_id = id;
        return this;
    }

    setEmoji(emoji: ComponentEmoji): ButtonBuilder {
        this.#data.emoji = emoji;
        return this;
    }

    setDisabled(disabled = true): ButtonBuilder {
        this.#data.disabled = disabled;
        return this;
    }

    setURL(url: string): ButtonBuilder {
        this.#data.url = url;
        return this;
    }

    toJSON(): DiscordButtonComponent {
        return { ...this.#data, type: this.type };
    }
}
