import type { Snowflake } from "../util/Snowflake.ts";
import type { Session } from "../session/Session.ts";
import type { DiscordChannel } from "../vendor/external.ts";
import { Channel } from "./Channel.ts";

export class DMChannel extends Channel {
    constructor(session: Session, data: DiscordChannel) {
        super(session, data);
        data.last_message_id ? this.lastMessageId = data.last_message_id : undefined;
        // Waiting for implementation of botId in session
        //this.user = new User(this.session, data.recipents!.find((r) => r.id !== this.session.botId));
    }
    lastMessageId?: Snowflake;

    async close() {
        const channel = await this.session.rest.runMethod<DiscordChannel>(
            this.session.rest,
            "DELETE",
            Routes.CHANNEL(this.id),
        );

        return new DMChannel(this.session, channel);
    }
}

export default DMChannel;
