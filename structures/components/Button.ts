import { ButtonStyles, ComponentEmoji, DiscordButtonComponent, MessageComponentTypes } from "../../vendor/external.ts";
import { BaseComponent } from "./BaseComponent.ts";

/**
 * Represents Discord Buttton
 * @link https://discord.com/developers/docs/interactions/message-components#button-object
 */
export class ButtonComponent extends BaseComponent<MessageComponentTypes.Button> {
    constructor(data: DiscordButtonComponent) {
        super(data.type);
        this.style = data.style;
        this.label = data.label;
        this.emoji = data.emoji;
        this.disabled = !!data.disabled;
        this.customId = data.custom_id;
        this.url = data.url;
    }
    style: ButtonStyles;
    label: string;
    emoji?: ComponentEmoji;
    disabled?: boolean;
    customId?: string;
    url?: string;
}
