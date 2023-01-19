import type { DiscordSelectOption, DiscordSelectMenuComponent } from '@biscuitland/api-types';
import type { ComponentEmoji } from '@biscuitland/core';
import { MessageComponentTypes } from '@biscuitland/api-types';
export declare class SelectMenuOptionBuilder {
    #private;
    constructor();
    setLabel(label: string): SelectMenuOptionBuilder;
    setValue(value: string): SelectMenuOptionBuilder;
    setDescription(description: string): SelectMenuOptionBuilder;
    setDefault(Default?: boolean): SelectMenuOptionBuilder;
    setEmoji(emoji: ComponentEmoji): SelectMenuOptionBuilder;
    toJSON(): DiscordSelectOption;
}
export declare class SelectMenuBuilder {
    #private;
    constructor();
    type: MessageComponentTypes.SelectMenu | MessageComponentTypes.RoleSelect | MessageComponentTypes.UserSelect | MessageComponentTypes.MentionableSelect | MessageComponentTypes.ChannelSelect;
    options: SelectMenuOptionBuilder[];
    setType(type: this['type']): this;
    setPlaceholder(placeholder: string): this;
    setValues(max?: number, min?: number): this;
    setDisabled(disabled?: boolean): this;
    setCustomId(id: string): this;
    setOptions(...options: SelectMenuOptionBuilder[]): this;
    addOptions(...options: SelectMenuOptionBuilder[]): this;
    toJSON(): DiscordSelectMenuComponent;
}
