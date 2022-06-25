import { Guild } from "./Guild.ts";
import { TextChannel } from "./TextChannel.ts"
import { Session, DiscordChannel } from "../mod.ts";

export class NewsChannel extends TextChannel {
    constructor(session: Session, data: DiscordChannel , guildId: Guild["id"]) {
        super(session, data, guildId);
        this.defaultAutoArchiveDuration = data.default_auto_archive_duration;
    }
    defaultAutoArchiveDuration?: number;
}