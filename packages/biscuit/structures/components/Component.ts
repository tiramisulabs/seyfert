import type Emoji from '../Emoji.ts';
import { ButtonStyles, MessageComponentTypes, TextStyles } from '../../../discordeno/mod.ts';

export class BaseComponent {
    constructor(type: MessageComponentTypes) {
        this.type = type;
    }

    type: MessageComponentTypes;

    isActionRow(): this is ActionRowComponent {
        return this.type === MessageComponentTypes.ActionRow;
    }

    isButton(): this is ButtonComponent {
        return this.type === MessageComponentTypes.Button;
    }

    isSelectMenu(): this is SelectMenuComponent {
        return this.type === MessageComponentTypes.SelectMenu;
    }

    isTextInput(): this is TextInputComponent {
        return this.type === MessageComponentTypes.InputText;
    }
}

/** Action Row Component */
export interface ActionRowComponent {
    type: MessageComponentTypes.ActionRow;
    components: Array<Exclude<Component, ActionRowComponent>>;
}

/** All Components */
export type Component =
    | ActionRowComponent
    | ButtonComponent
    | LinkButtonComponent
    | SelectMenuComponent
    | TextInputComponent;

/** Button Component */
export type ClassicButton = Exclude<ButtonStyles, ButtonStyles.Link>;

export type ComponentsWithoutRow = Exclude<Component, ActionRowComponent>;

export interface ButtonComponent {
    type: MessageComponentTypes.Button;
    style: ClassicButton;
    label?: string;
    emoji?: Emoji;
    customId?: string;
    disabled?: boolean;
}

/** Link Button Component */
export interface LinkButtonComponent {
    type: MessageComponentTypes.Button;
    style: ButtonStyles.Link;
    label?: string;
    url: string;
    disabled?: boolean;
}

/** Select Menu Component */
export interface SelectMenuComponent {
    type: MessageComponentTypes.SelectMenu;
    customId: string;
    options: SelectMenuOption[];
    placeholder?: string;
    minValue?: number;
    maxValue?: number;
    disabled?: boolean;
}

/** Text Input Component */
export interface TextInputComponent {
    type: MessageComponentTypes.InputText;
    customId: string;
    style: TextStyles;
    label: string;
    minLength?: number;
    maxLength?: number;
    required?: boolean;
    value?: string;
    placeholder?: string;
}

export interface SelectMenuOption {
    label: string;
    value: string;
    description?: string;
    emoji?: Emoji;
    default?: boolean;
}

export default BaseComponent;
