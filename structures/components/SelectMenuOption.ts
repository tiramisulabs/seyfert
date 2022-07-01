import { ComponentEmoji, DiscordSelectOption } from "../../vendor/external.ts";

/**
 * Represents Discord Selec Menu Option
 * @link https://discord.com/developers/docs/interactions/message-components#select-menu-object-select-option-structure
 */
export class SelectMenuOption {
    constructor(data?: DiscordSelectOption) {
        this.label = data!.label;
        this.value = data!.value;
        this.description = data?.description;
        this.emoji = data?.emoji;
        this.default = !!data!.default;
    }
    label: string;
    value: string;
    description?: string;
    emoji?: ComponentEmoji;
    default?: boolean;

    setLabel(label: string) {
        this.label = label;
        return this;
    }

    setValue(value: string) {
        this.value = value;
        return this;
    }

    setDescription(description: string) {
        this.description = description;
        return this;
    }

    setDefault(Default = true) {
        this.default = Default;
        return this;
    }

    setEmoji(emoji: ComponentEmoji) {
        this.emoji = emoji;
        return this;
    }
}
