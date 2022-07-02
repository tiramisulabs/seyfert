import {
    type DiscordButtonComponent,
    type DiscordInputTextComponent,
    type DiscordSelectMenuComponent,
    MessageComponentTypes,
} from "../vendor/external.ts";
import { BaseComponent } from "../structures/components/BaseComponent.ts";
import { ComponentBuilder } from "../structures/builders/ComponentBuilder.ts";
import { ButtonBuilder, ButtonComponent, InputTextComponent, SelectMenuBuilder, SelectMenuComponent, InputTextBuilder } from "../mod.ts";

export type AnyDiscordComponent = DiscordButtonComponent | DiscordInputTextComponent | DiscordSelectMenuComponent;
export type AnyComponent = ButtonComponent | InputTextComponent | SelectMenuComponent;
export type AnyComponentBuilder = ButtonBuilder | SelectMenuBuilder | InputTextBuilder;

export function createComponent(data: AnyDiscordComponent) {
    if (data instanceof BaseComponent) {
        return data;
    }

    switch (data.type) {
        case MessageComponentTypes.Button:
            return new ButtonComponent(data);
        case MessageComponentTypes.InputText:
            return new InputTextComponent(data);
        case MessageComponentTypes.SelectMenu:
            return new SelectMenuComponent(data);
        default:
            throw new Error(`Unknown component type: ${data["type"]}`);
    }
}

export function createBuilderComponent(data: AnyComponentBuilder | AnyDiscordComponent) {
    if (data instanceof ComponentBuilder) {
        return data;
    }

    switch (data.type) {
        case MessageComponentTypes.Button:
            return new ButtonBuilder(data);
        case MessageComponentTypes.InputText:
            return new InputTextBuilder(data);
        case MessageComponentTypes.SelectMenu:
            return new SelectMenuBuilder(data);
        default:
            throw new Error(`Unknown component type: ${data["type"]}`);
    }
}
