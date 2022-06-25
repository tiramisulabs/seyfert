import { GuildChannel } from "./GuildChannel.ts";
import { Guild } from "./Guild.ts";
import { DiscordChannel, Session, Snowflake } from "../mod.ts";

export class ThreadChannel extends GuildChannel {
    constructor(session: Session, data: DiscordChannel, guildId: Guild["id"]) {
        super(session, data, guildId);
        this.archived = !!data.thread_metadata?.archived;
        this.archiveTimestamp = data.thread_metadata?.archive_timestamp;
        this.autoArchiveDuration = data.thread_metadata?.auto_archive_duration;
        this.locked = !!data.thread_metadata?.locked;
        this.messageCount = data.message_count;
        this.memberCount = data.member_count;
        this.ownerId = data.owner_id;
    }
    archived?: boolean;
    archiveTimestamp?: string;
    autoArchiveDuration?: number;
    locked?: boolean;
    messageCount?: number;
    memberCount?: number;
    ownerId?: Snowflake;
}
