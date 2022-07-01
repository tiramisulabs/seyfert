import { ButtonStyles, ComponentEmoji, DiscordButtonComponent } from "../../vendor/external.ts";
import { BuildComponent } from "./BuildComponent.ts";

export interface ButtonEmoji {
    id: string;
    name: string;
    animated?: boolean;
}

/**
 * Represents Discord Buttton
 * @link https://discord.com/developers/docs/interactions/message-components#button-object
 */

export class ButtonComponent extends BuildComponent<DiscordButtonComponent> {
    constructor(data?: DiscordButtonComponent) {
        super(data!);
        this.style = data!.style;
        this.label = data?.label;
        this.emoji = data?.emoji;
        this.disabled = !!data?.disabled;
        this.customId = data?.custom_id;
        this.url = data?.url;
    }
    style: ButtonStyles;
    label?: string;
    emoji?: ComponentEmoji;
    disabled?: boolean;
    customId?: string;
    url?: string;

    setStyle(style: ButtonStyles) {
        this.style = style;
        return this;
    }

    setLabel(label: string) {
        this.label = label;
        return this;
    }

    setCustomId(id: string) {
        this.customId = id;
        return this;
    }

    setEmoji(emoji: ButtonEmoji) {
        this.emoji = emoji;
        return this;
    }

    setDisabled(disabled = true) {
        this.disabled = disabled;
        return this;
    }

    setURL(url: string) {
        this.url = url;
        return this;
    }
}
