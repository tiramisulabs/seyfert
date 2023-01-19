import type { ButtonStyles, DiscordButtonComponent } from '@biscuitland/api-types';
import { MessageComponentTypes } from '@biscuitland/api-types';
import type { ComponentEmoji } from '@biscuitland/core';
export declare class ButtonBuilder {
    #private;
    constructor();
    type: MessageComponentTypes.Button;
    setStyle(style: ButtonStyles): this;
    setLabel(label: string): this;
    setCustomId(id: string): this;
    setEmoji(emoji: ComponentEmoji): this;
    setDisabled(disabled?: boolean): this;
    setURL(url: string): this;
    toJSON(): DiscordButtonComponent;
}
