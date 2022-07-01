import {
    type DiscordButtonComponent,
    type DiscordInputTextComponent,
    type DiscordSelectMenuComponent,
    MessageComponentTypes,
} from "../vendor/external.ts";
import { BuildComponent } from "../structures/components/BuildComponent.ts";
import { ButtonComponent, SelectMenuComponent, TextInputComponent } from "../mod.ts";

export type AnyDiscordComponent = DiscordButtonComponent | DiscordInputTextComponent | DiscordSelectMenuComponent;
export type AnyComponent = ButtonComponent | TextInputComponent | SelectMenuComponent;

export function createComponent(data: AnyDiscordComponent) {
    if (data instanceof BuildComponent) {
        return data;
    }

    switch (data.type) {
        case MessageComponentTypes.Button:
            return new ButtonComponent(data);
        case MessageComponentTypes.InputText:
            return new TextInputComponent(data);
        case MessageComponentTypes.SelectMenu:
            return new SelectMenuComponent(data);
        default:
            throw new Error(`Unknown component type: ${data["type"]}`);
    }
}
