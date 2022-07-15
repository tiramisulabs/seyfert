import type { Session } from "../../Session.ts";
import type { DiscordComponent, DiscordInputTextComponent } from "../../../discordeno/mod.ts";
import type { ActionRowComponent, Component } from "./Component.ts";
import { ButtonStyles, MessageComponentTypes } from "../../../discordeno/mod.ts";
import BaseComponent from "./Component.ts";
import Button from "./ButtonComponent.ts";
import LinkButton from "./LinkButtonComponent.ts";
import SelectMenu from "./SelectMenuComponent.ts";
import InputText from "./TextInputComponent.ts";

export class ActionRow extends BaseComponent implements ActionRowComponent {
    constructor(session: Session, data: DiscordComponent) {
        super(data.type);

        this.session = session;
        this.type = data.type as MessageComponentTypes.ActionRow;
        this.components = data.components!.map((component) => {
            switch (component.type) {
                case MessageComponentTypes.Button:
                    if (component.style === ButtonStyles.Link) {
                        return new LinkButton(session, component);
                    }
                    return new Button(session, component);
                case MessageComponentTypes.SelectMenu:
                    return new SelectMenu(session, component);
                case MessageComponentTypes.InputText:
                    return new InputText(session, component as DiscordInputTextComponent);
                case MessageComponentTypes.ActionRow:
                    throw new Error("Cannot have an action row inside an action row");
            }
        });
    }

    readonly session: Session;
    override type: MessageComponentTypes.ActionRow;
    components: Array<Exclude<Component, ActionRowComponent>>;
}

export default ActionRow;
