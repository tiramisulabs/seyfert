import type { Session } from "../../session/Session.ts";
import type { DiscordComponent } from "../../vendor/external.ts";
import type Emoji from "../Emoji.ts";
import { ButtonStyles, MessageComponentTypes, TextStyles } from "../../vendor/external.ts";

// TODO: fix circular dependencies
import ActionRow from "./ActionRowComponent.ts";
import Button from "./ButtonComponent.ts";
import LinkButton from "./ButtonComponent.ts";
import SelectMenu from "./SelectMenuComponent.ts";
import TextInput from "./TextInputComponent.ts";

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

    /**
     * Component factory
     * @internal
     * */
    static from(session: Session, component: DiscordComponent): Component {
        switch (component.type) {
            case MessageComponentTypes.ActionRow:
                return new ActionRow(session, component);
            case MessageComponentTypes.Button:
                if (component.style === ButtonStyles.Link) {
                    return new LinkButton(session, component);
                }
                return new Button(session, component);
            case MessageComponentTypes.SelectMenu:
                return new SelectMenu(session, component);
            case MessageComponentTypes.InputText:
                return new TextInput(session, component);
        }
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
export interface ButtonComponent {
    type: MessageComponentTypes.Button;
    style: ButtonStyles.Primary | ButtonStyles.Secondary | ButtonStyles.Success | ButtonStyles.Danger;
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
