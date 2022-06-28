import type { Snowflake } from "../util/Snowflake.ts";
import type { Session } from "../session/Session.ts";
import type { DiscordChannel } from "../vendor/external.ts";
import TextChannel from "./TextChannel.ts";

export class NewsChannel extends TextChannel {
    constructor(session: Session, data: DiscordChannel, guildId: Snowflake) {
        super(session, data, guildId);
        this.defaultAutoArchiveDuration = data.default_auto_archive_duration;
    }
    defaultAutoArchiveDuration?: number;
}

export default NewsChannel;
