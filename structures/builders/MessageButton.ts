import { ComponentBuilder } from "./ComponentBuilder.ts";
import {
    ButtonStyles,
    ComponentEmoji,
    type DiscordButtonComponent,
    MessageComponentTypes,
} from "../../vendor/external.ts";

export class ButtonBuilder extends ComponentBuilder<DiscordButtonComponent> {
    constructor(data?: DiscordButtonComponent) {
        super({ ...data!, type: MessageComponentTypes.Button });
    }
    setStyle(style: ButtonStyles) {
        this.data.style = style;
        return this;
    }

    setLabel(label: string) {
        this.data.label = label;
        return this;
    }

    setCustomId(id: string) {
        this.data.custom_id = id;
        return this;
    }

    setEmoji(emoji: ComponentEmoji) {
        this.data.emoji = emoji;
        return this;
    }

    setDisabled(disabled = true) {
        this.data.disabled = disabled;
        return this;
    }

    setURL(url: string) {
        this.data.url = url;
        return this;
    }

    toJSON(): DiscordButtonComponent {
        return { ...this.data };
    }
}
