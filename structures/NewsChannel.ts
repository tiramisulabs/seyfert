import { Guild } from "./Guild.ts";
import { TextChannel } from "./TextChannel.ts"
import { Session, DiscordChannel } from "../mod.ts";

export class NewsChannel extends TextChannel {
    constructor(session: Session, data: DiscordChannel , guild: Guild) {
        super(session, data, guild);
        this.defaultAutoArchiveDuration = data.default_auto_archive_duration;
    }
    defaultAutoArchiveDuration?: number;
}