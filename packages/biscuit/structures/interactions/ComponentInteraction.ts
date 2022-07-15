import type { Model } from "../Base.ts";
import type { Snowflake } from "../../Snowflake.ts";
import type { Session } from "../../Session.ts";
import type { DiscordInteraction, InteractionTypes } from "../../../discordeno/mod.ts";
import type { InteractionApplicationCommandCallbackData, InteractionResponse } from "./CommandInteraction.ts";
import { MessageComponentTypes } from "../../../discordeno/mod.ts";
import CommandInteraction from "./CommandInteraction.ts";
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

    //TODO: create interface/class for components types
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

    sendFollowUp(options: InteractionApplicationCommandCallbackData) {
        return CommandInteraction.prototype.sendFollowUp.call(this, options);
    }

    respond(options: InteractionResponse): Promise<Message | undefined> {
        return CommandInteraction.prototype.respond.call(this, options);
    }
}

export default ComponentInteraction;
