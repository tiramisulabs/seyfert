import type { Model } from "../Base.ts";
import type { Session } from "../../session/Session.ts";
import type { Snowflake } from "../../util/Snowflake.ts";
import type { ChannelTypes, DiscordChannel } from "../../vendor/external.ts";
import TextChannel from "./TextChannel.ts";
import BaseChannel from "./BaseChannel.ts";
import User from "../User.ts";
import * as Routes from "../../util/Routes.ts";

export class DMChannel extends BaseChannel implements Model {
    constructor(session: Session, data: DiscordChannel) {
        super(session, data);
        this.user = new User(this.session, data.recipents!.find((r) => r.id !== this.session.botId)!);
        this.type = data.type as ChannelTypes.DM | ChannelTypes.GroupDm;
        if (data.last_message_id) {
            this.lastMessageId = data.last_message_id;
        }
    }

    override type: ChannelTypes.DM | ChannelTypes.GroupDm;
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

TextChannel.applyTo(DMChannel);

export interface DMChannel extends Omit<TextChannel, "type">, Omit<BaseChannel, "type"> {}

export default DMChannel;
