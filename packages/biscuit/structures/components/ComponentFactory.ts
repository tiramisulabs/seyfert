import type { Session } from "../../Session.ts";
import type { DiscordComponent, DiscordInputTextComponent } from "../../../discordeno/mod.ts";
import type { Component } from "./Component.ts";
import { ButtonStyles, MessageComponentTypes } from "../../../discordeno/mod.ts";
import ActionRow from "./ActionRowComponent.ts";
import Button from "./ButtonComponent.ts";
import LinkButton from "./ButtonComponent.ts";
import SelectMenu from "./SelectMenuComponent.ts";
import TextInput from "./TextInputComponent.ts";

export class ComponentFactory {
    /**
     * Component factory
     * @internal
     */
    static from(session: Session, component: DiscordComponent): Component {
        switch (component.type) {
            case MessageComponentTypes.ActionRow:
                return new ActionRow(session, component);
            case MessageComponentTypes.Button:
                if (component.style === ButtonStyles.Link) return new LinkButton(session, component);
                return new Button(session, component);
            case MessageComponentTypes.SelectMenu:
                return new SelectMenu(session, component);
            case MessageComponentTypes.InputText:
                return new TextInput(session, component as DiscordInputTextComponent);
        }
    }
}

export default ComponentFactory;
