import type { Session } from "../../Session.ts";
import type { DiscordInteraction } from "../../../discordeno/mod.ts";
import { InteractionTypes } from "../../../discordeno/mod.ts";
import CommandInteraction from "./CommandInteraction.ts";
import ComponentInteraction from "./ComponentInteraction.ts";
import PingInteraction from "./PingInteraction.ts";
import AutoCompleteInteraction from "./AutoCompleteInteraction.ts";
import ModalSubmitInteraction from "./ModalSubmitInteraction.ts";

export type Interaction =
    | CommandInteraction
    | ComponentInteraction
    | PingInteraction
    | AutoCompleteInteraction
    | ModalSubmitInteraction;

export class InteractionFactory {
    static from(session: Session, interaction: DiscordInteraction): Interaction {
        switch (interaction.type) {
            case InteractionTypes.Ping:
                return new PingInteraction(session, interaction);
            case InteractionTypes.ApplicationCommand:
                return new CommandInteraction(session, interaction);
            case InteractionTypes.MessageComponent:
                return new ComponentInteraction(session, interaction);
            case InteractionTypes.ApplicationCommandAutocomplete:
                return new AutoCompleteInteraction(session, interaction);
            case InteractionTypes.ModalSubmit:
                return new ModalSubmitInteraction(session, interaction);
        }
    }
}

export default InteractionFactory;
