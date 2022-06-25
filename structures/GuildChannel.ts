import { Channel } from "./Channel.ts";
import { Guild } from "./Guild.ts";
import { DiscordChannel, Routes, Session, Snowflake } from "../mod.ts";

export abstract class GuildChannel extends Channel {
    constructor(session: Session, data: DiscordChannel, guildId: Guild["id"]) {
        super(session, data);
        this.guildId = guildId;
        this.position = data.position;
        data.topic ? this.topic = data.topic : null;
        data.parent_id ? this.parentId = data.parent_id : undefined;
    }

    guildId: Snowflake;
    topic?: string;
    position?: number;
    parentId?: Snowflake;

    delete(reason?: string) {
        return this.session.rest.runMethod<DiscordChannel>(
            this.session.rest,
            "DELETE",
            Routes.CHANNEL(this.id),
            {
                reason,
            },
        );
    }
}
