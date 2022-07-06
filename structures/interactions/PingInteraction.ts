
import type { Model } from "../Base.ts";
import type { Snowflake } from "../../util/Snowflake.ts";
import type { Session } from "../../session/Session.ts";
import type { ApplicationCommandTypes, DiscordInteraction, InteractionTypes } from "../../vendor/external.ts";
import { InteractionResponseTypes } from "../../vendor/external.ts";
import BaseInteraction from "./BaseInteraction.ts";
import * as Routes from "../../util/Routes.ts";

export class PingInteraction extends BaseInteraction implements Model {
    constructor(session: Session, data: DiscordInteraction) {
        super(session, data);
        this.type = data.type as number;
        this.commandId = data.data!.id;
        this.commandName = data.data!.name;
        this.commandType = data.data!.type;
        this.commandGuildId = data.data!.guild_id;
    }

    override type: InteractionTypes.Ping;
    commandId: Snowflake;
    commandName: string;
    commandType: ApplicationCommandTypes;
    commandGuildId?: Snowflake;

    async pong() {
        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            "POST",
            Routes.INTERACTION_ID_TOKEN(this.id, this.token),
            {
                type: InteractionResponseTypes.Pong,
            }
        );
    }
}

export default PingInteraction;
