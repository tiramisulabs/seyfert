import type { DiscordActionRow } from '@biscuitland/api-types';
import { MessageComponentTypes } from '@biscuitland/api-types';
import type { ComponentBuilder } from '@biscuitland/core';
export declare class ActionRowBuilder<T extends ComponentBuilder> {
    constructor();
    components: T[];
    type: MessageComponentTypes.ActionRow;
    addComponents(...components: T[]): this;
    setComponents(...components: T[]): this;
    toJSON(): DiscordActionRow;
}
