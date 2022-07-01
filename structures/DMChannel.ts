import type { Model } from "./Base.ts";
import type { Snowflake } from "../util/Snowflake.ts";
import type { Session } from "../session/Session.ts";
import type { DiscordChannel } from "../vendor/external.ts";
import Channel from "./Channel.ts";
import User from "./User.ts";
import * as Routes from "../util/Routes.ts";

export class DMChannel extends Channel implements Model {
    constructor(session: Session, data: DiscordChannel) {
        super(session, data);

        this.user = new User(this.session, data.recipents!.find((r) => r.id !== this.session.botId)!);

        if (data.last_message_id) {
            this.lastMessageId = data.last_message_id;
        }
    }

    user: User;
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
