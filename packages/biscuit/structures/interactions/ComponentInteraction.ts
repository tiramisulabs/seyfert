import type { Model } from "../Base.ts";
import type { Snowflake } from "../../Snowflake.ts";
import type { Session } from "../../Session.ts";
import type { DiscordInteraction, InteractionTypes } from "../../../discordeno/mod.ts";
import { MessageComponentTypes } from "../../../discordeno/mod.ts";
import BaseInteraction from "./BaseInteraction.ts";
import Message from "../Message.ts";

export class ComponentInteraction extends BaseInteraction implements Model {
    constructor(session: Session, data: DiscordInteraction) {
        super(session, data);
        this.type = data.type as number;
        this.componentType = data.data!.component_type!;
        this.customId = data.data!.custom_id;
        this.targetId = data.data!.target_id;
        this.values = data.data!.values;
        this.message = new Message(session, data.message!);
    }

    override type: InteractionTypes.MessageComponent;
    componentType: MessageComponentTypes;
    customId?: string;
    targetId?: Snowflake;
    values?: string[];
    message: Message;
    responded = false;

    isButton() {
        return this.componentType === MessageComponentTypes.Button;
    }

    isActionRow() {
        return this.componentType === MessageComponentTypes.ActionRow;
    }

    isTextInput() {
        return this.componentType === MessageComponentTypes.InputText;
    }

    isSelectMenu() {
        return this.componentType === MessageComponentTypes.SelectMenu;
    }
}

export default ComponentInteraction;
