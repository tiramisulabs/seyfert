import type { Model } from "./Base.ts";
import type { Snowflake } from "../util/Snowflake.ts";
import type { Session } from "../session/Session.ts";
import type { DiscordInteraction, InteractionTypes } from "../vendor/external.ts";
import User from "./User.ts";
// import Member from "./Member.ts";

export class Interaction implements Model {
    constructor(session: Session, data: DiscordInteraction) {
        this.session = session;
        this.id = data.id;
        this.token = data.token;
        this.type = data.type
        this.guildId = data.guild_id;
        this.channelId = data.channel_id;
        this.applicationId = data.application_id;
        this.locale = data.locale;
        this.data = data.data;

        if (!data.guild_id) {
            this.user = new User(session, data.user!);
        }
        else {
            // TODO: member transformer
            // pass
        }
    }

    readonly session: Session;
    readonly id: Snowflake;
    readonly token: string;

    type: InteractionTypes;
    guildId?: Snowflake;
    channelId?: Snowflake;
    applicationId?: Snowflake;
    locale?: string;
    // deno-lint-ignore no-explicit-any
    data: any;
    user?: User;

    // TODO: do methods
    async respond() {
    }
}

export default Interaction;
