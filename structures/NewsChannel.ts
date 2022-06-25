import { DiscordChannel, Guild, Session, TextChannel } from "../mod.ts";

export class NewsChannel extends TextChannel {
    constructor(session: Session, data: DiscordChannel, guildId: Guild["id"]) {
        super(session, data, guildId);
        this.defaultAutoArchiveDuration = data.default_auto_archive_duration;
    }
    defaultAutoArchiveDuration?: number;
}
